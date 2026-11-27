import { gql } from '@apollo/client'
import { AnyFormApi, revalidateLogic, StandardSchemaV1Issue } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { setCodeAlreadyExistsError } from '~/components/alerts/utils'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { EMPTY_SCOPE_ENTRY } from '~/components/scope/scopeEntry'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  ContractAlertForDrawerFragment,
  ContractAlertTypeEnum,
  CurrencyEnum,
  LagoApiError,
  useCreateContractAlertMutation,
  useGetContractAlertDrawerScopeOptionsQuery,
  useGetContractAlertsForAlertDrawerQuery,
  useUpdateContractAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { deriveContractScopeOptions, getTakenScopeKeys, isWholeContractTaken } from './alertScope'
import { ContractAlertDrawerContent } from './ContractAlertDrawerContent'
import { mapFromApiToForm, mapFromFormToApi } from './mappers'
import {
  buildContractAlertSchema,
  CONTRACT_ALERT_FORM_DEFAULTS,
  SCOPE_ALREADY_TAKEN_ERROR,
} from './validationSchema'

gql`
  fragment ContractAlertForDrawer on ContractAlert {
    id
    name
    code
    alertType
    scope {
      type
      withProductFilters
      product {
        id
        name
        code
        invoiceDisplayName
        productCategory {
          id
          name
          code
          invoiceDisplayName
        }
      }
      productFilters {
        id
        name
        code
        invoiceDisplayName
      }
    }
    thresholds {
      code
      recurring
      value
      notifyOn
    }
  }

  query getContractAlertDrawerScopeOptions($contractId: ID!) {
    contract(id: $contractId) {
      id
      appliedRateCards {
        id
        product {
          id
          name
          code
          invoiceDisplayName
          productType
          productCategory {
            id
            name
            code
            invoiceDisplayName
          }
        }
        rateCard {
          id
          productFilter {
            id
            name
            code
            invoiceDisplayName
          }
        }
      }
    }
  }

  query getContractAlertsForAlertDrawer($contractId: ID!, $limit: Int) {
    contractAlerts(contractId: $contractId, limit: $limit) {
      collection {
        id
        alertType
        scope {
          withProductFilters
          product {
            id
            code
          }
          productFilters {
            id
            code
          }
        }
      }
    }
  }

  mutation createContractAlert($input: CreateContractAlertInput!) {
    createContractAlert(input: $input) {
      id
    }
  }

  mutation updateContractAlert($input: UpdateContractAlertInput!) {
    updateContractAlert(input: $input) {
      id
      ...ContractAlertForDrawer
    }
  }
`

const CONTRACT_ALERT_FORM_ID = 'contract-alert-drawer-form'

export const CONTRACT_ALERT_DRAWER_SUBMIT_TEST_ID = 'contract-alert-drawer-submit'

const EXISTING_ALERTS_LIMIT = 99999
const CONTRACT_ALERTS_REFETCH_QUERIES = [
  'getContractAlertsForAlertsSection',
  'getContractAlertsCountForOverviewNav',
]
const MUTATION_CONTEXT = {
  silentErrorDetails: [
    LagoApiError.AlertAlreadyExists,
    LagoApiError.ProductRequiredForUnits,
    LagoApiError.ValueAlreadyExist,
    LagoApiError.DuplicateThresholdValues,
    LagoApiError.DuplicateThresholdCodes,
    LagoApiError.RecurringValueIsNegative,
    LagoApiError.RecurringNotSupported,
  ],
}

const THRESHOLD_ERROR_PATH = /^thresholds\[(\d+)\]\.(value|code|notifyOn)$/
const THRESHOLD_ERROR_MESSAGES: Record<string, string> = {
  [LagoApiError.DuplicateThresholdValues]: 'text_1795792049850v4zjojr03cb',
  [LagoApiError.RecurringValueIsNegative]: 'text_1795802708078t9ythhvdvd5',
  [LagoApiError.DuplicateThresholdCodes]: 'text_17924397105421fihqq5j6ns',
  [LagoApiError.RecurringNotSupported]: 'text_1795792049850r32kntpkx3v',
}

export type ContractAlertDrawerProps = {
  contractId: string
  currency: CurrencyEnum
  alert?: ContractAlertForDrawerFragment
}

const setScopeError = (
  formApi: AnyFormApi,
  field: 'scope' | 'scope.productCode',
  message: string,
): void => {
  const fields = { [field]: { message, path: field.split('.') } }

  formApi.setErrorMap({ onDynamic: { fields } })
  scrollToFirstInputError(CONTRACT_ALERT_FORM_ID, fields)
}

const setThresholdErrors = (
  formApi: AnyFormApi,
  errors: readonly GraphQLFormattedError[] | undefined,
): boolean => {
  const details = errors?.[0]?.extensions?.details

  if (!details || typeof details !== 'object') return false

  const fields: Record<string, StandardSchemaV1Issue[]> = {}

  Object.entries(details).forEach(([key, codes]) => {
    const match = THRESHOLD_ERROR_PATH.exec(key)
    const code = Array.isArray(codes)
      ? codes.find(
          (value): value is string =>
            typeof value === 'string' && value in THRESHOLD_ERROR_MESSAGES,
        )
      : undefined

    if (!match || !code) return

    const field = match[2] === 'notifyOn' ? 'value' : match[2]

    fields[`thresholds[${match[1]}].${field}`] = [
      { message: THRESHOLD_ERROR_MESSAGES[code], path: ['thresholds', Number(match[1]), field] },
    ]
  })

  if (!Object.keys(fields).length) return false

  formApi.setErrorMap({ onDynamic: { form: fields, fields } })

  return true
}

export const useContractAlertDrawer = (): {
  openDrawer: (props: ContractAlertDrawerProps) => void
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { update: updateDrawer } = drawer
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  const [openContext, setOpenContext] = useState<ContractAlertDrawerProps | null>(null)

  const contractId = openContext?.contractId ?? ''
  const isCreation = !!openContext && !openContext.alert

  const { data: scopeOptionsData, loading: scopeOptionsLoading } =
    useGetContractAlertDrawerScopeOptionsQuery({
      variables: { contractId },
      skip: !openContext,
    })
  const {
    data: existingAlertsData,
    loading: existingAlertsLoading,
    refetch: refetchExistingAlerts,
  } = useGetContractAlertsForAlertDrawerQuery({
    variables: { contractId, limit: EXISTING_ALERTS_LIMIT },
    skip: !isCreation,
    fetchPolicy: 'no-cache',
  })

  const [createContractAlert] = useCreateContractAlertMutation({
    refetchQueries: CONTRACT_ALERTS_REFETCH_QUERIES,
    context: MUTATION_CONTEXT,
  })
  const [updateContractAlert] = useUpdateContractAlertMutation({
    refetchQueries: CONTRACT_ALERTS_REFETCH_QUERIES,
    context: MUTATION_CONTEXT,
  })

  const isDataReady =
    !!openContext &&
    !(scopeOptionsLoading && !scopeOptionsData) &&
    !(isCreation && existingAlertsLoading && !existingAlertsData)

  const scopeOptions = useMemo(
    () =>
      deriveContractScopeOptions(
        scopeOptionsData?.contract?.appliedRateCards ?? [],
        openContext?.alert?.scope[0],
      ),
    [scopeOptionsData, openContext],
  )
  const takenScopeKeys = useMemo(
    () => getTakenScopeKeys(existingAlertsData?.contractAlerts.collection ?? []),
    [existingAlertsData],
  )

  const form = useAppForm({
    defaultValues: CONTRACT_ALERT_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildContractAlertSchema(takenScopeKeys) },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(CONTRACT_ALERT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      if (!openContext || !isDataReady || !value.alertType) return

      const values = { ...value, alertType: value.alertType }
      const { alert, currency } = openContext

      if (alert) {
        const { data, errors } = await updateContractAlert({
          variables: {
            input: mapFromFormToApi(values, { kind: 'update', id: alert.id, currency }),
          },
        })

        if (hasDefinedGQLError('NotFound', errors, 'alert')) {
          closeDrawer()
          return
        }

        if (setThresholdErrors(formApi, errors)) return

        if (!data?.updateContractAlert) return

        addToast({ severity: 'success', translateKey: 'text_1746623860224qwhtxyuophr' })
        closeDrawer()
        return
      }

      const { data, errors } = await createContractAlert({
        variables: {
          input: mapFromFormToApi(values, {
            kind: 'create',
            contractId: openContext.contractId,
            currency,
          }),
        },
      })

      if (await applyCreateErrors(formApi, errors, !!value.scope)) return

      if (!data?.createContractAlert) return

      addToast({ severity: 'success', translateKey: 'text_1746611635509ov7jepx55bz' })

      if (isCreateMoreEnabled()) {
        form.reset(CONTRACT_ALERT_FORM_DEFAULTS)
        notifyReset()
        await refetchExistingAlerts()
        return
      }

      closeDrawer()
    },
  })

  useEffect(() => {
    if (!isCreation || !existingAlertsData || !isWholeContractTaken(takenScopeKeys)) return

    const { alertType, scope } = form.state.values

    if (alertType === ContractAlertTypeEnum.UsageAmount && scope === null) {
      form.setFieldValue('scope', EMPTY_SCOPE_ENTRY)
    }
  }, [isCreation, existingAlertsData, takenScopeKeys, form])

  const renderChildren = useCallback(
    (context: ContractAlertDrawerProps, isReady: boolean): ReactNode => (
      <CreateMoreResetBoundary resetSignal={context.alert ? undefined : resetSignal}>
        <ContractAlertDrawerContent
          form={form}
          isEdition={!!context.alert}
          currency={context.currency}
          isDataReady={isReady}
          scopeOptions={scopeOptions}
          takenScopeKeys={takenScopeKeys}
        />
      </CreateMoreResetBoundary>
    ),
    [form, resetSignal, scopeOptions, takenScopeKeys],
  )

  const renderMainAction = useCallback(
    (context: ContractAlertDrawerProps, isReady: boolean): ReactNode => (
      <form.AppForm>
        <form.SubmitButton disabled={!isReady} dataTest={CONTRACT_ALERT_DRAWER_SUBMIT_TEST_ID}>
          {translate(
            context.alert ? 'text_17432414198706rdwf76ek3u' : 'text_1747917472538el8fg31n3i8',
          )}
        </form.SubmitButton>
      </form.AppForm>
    ),
    [form, translate],
  )

  useEffect(() => {
    if (!openContext) return

    updateDrawer({
      children: renderChildren(openContext, isDataReady),
      mainAction: renderMainAction(openContext, isDataReady),
    })
  }, [openContext, isDataReady, renderChildren, renderMainAction, updateDrawer])

  const applyCreateErrors = async (
    formApi: AnyFormApi,
    errors: readonly GraphQLFormattedError[] | undefined,
    hasScopeRow: boolean,
  ): Promise<boolean> => {
    if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
      setCodeAlreadyExistsError(formApi)
      return true
    }

    if (hasDefinedGQLError('AlertAlreadyExists', errors, 'base')) {
      setScopeError(formApi, hasScopeRow ? 'scope.productCode' : 'scope', SCOPE_ALREADY_TAKEN_ERROR)
      await refetchExistingAlerts()
      return true
    }

    if (hasDefinedGQLError('ProductRequiredForUnits', errors, 'scope')) {
      setScopeError(formApi, 'scope', 'text_624ea7c29103fd010732ab7d')
      return true
    }

    return setThresholdErrors(formApi, errors)
  }

  const closeDrawer = (): void => {
    drawer.close()
    form.reset(CONTRACT_ALERT_FORM_DEFAULTS)
    setOpenContext(null)
  }

  const openDrawer = (props: ContractAlertDrawerProps): void => {
    setOpenContext(props)
    resetCreateMore()
    form.reset(
      props.alert ? mapFromApiToForm(props.alert, props.currency) : CONTRACT_ALERT_FORM_DEFAULTS,
      { keepDefaultValues: true },
    )

    void drawer.open({
      title: translate(
        props.alert ? 'text_1795778599614c6czsklhiid' : 'text_1795778599614dqcrqlck2ut',
      ),
      form: { id: CONTRACT_ALERT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      cancelOrCloseText: 'cancel',
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => {
        form.reset(CONTRACT_ALERT_FORM_DEFAULTS)
        setOpenContext(null)
      },
      secondaryAction: props.alert ? undefined : createMoreControl,
      children: renderChildren(props, false),
      mainAction: renderMainAction(props, false),
    })
  }

  return { openDrawer }
}
