import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useCallback, useRef } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  AdjustedFeeTypeEnum,
  Charge,
  CreateAdjustedFeeInput,
  FixedCharge,
  LagoApiError,
  SubscriptionForCreateFeeDrawerFragment,
  useCreateAdjustedFeeMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { EditFeeDrawerContent } from './EditFeeDrawerContent'
import { OpenEditFeeDrawer, OpenEditFeeDrawerParams } from './types'
import {
  buildEditFeeDefaultValues,
  EDIT_FEE_DEFAULT_VALUES,
  editFeeValidationSchema,
} from './validationSchema'

import { EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID } from '../invoiceDetailsTestIds'

const EDIT_FEE_FORM_ID = 'edit-fee-drawer-form'

gql`
  # Fragment for subscription/plan data (charges and fixed charges available to add)
  fragment SubscriptionForCreateFeeDrawer on Subscription {
    id
    plan {
      id
      charges {
        id
        invoiceDisplayName
        chargeModel
        prorated
        properties {
          amount
        }
        filters {
          id
          invoiceDisplayName
          values
        }
        billableMetric {
          id
          name
          code
        }
      }
      fixedCharges {
        id
        invoiceDisplayName
        chargeModel
        prorated
        addOn {
          id
          name
          code
        }
      }
    }
  }

  # Fee fragment for the drawer - matches InvoiceForFormatInvoiceItemMap structure
  # so fees can be used consistently for boundary grouping
  fragment FeeForCreateFeeDrawer on Fee {
    id
    adjustedFee
    properties {
      fromDatetime
      toDatetime
    }
    subscription {
      id
    }
    charge {
      id
      filters {
        id
        values
      }
      properties {
        graduatedRanges {
          flatAmount
          fromValue
          perUnitAmount
          toValue
        }
        graduatedPercentageRanges {
          flatAmount
          fromValue
          rate
          toValue
        }
      }
    }
    fixedCharge {
      id
    }
    chargeFilter {
      id
    }
    pricingUnitUsage {
      shortName
    }
  }

  fragment FeeForEditfeeDrawer on Fee {
    id
    currency
    charge {
      id
      chargeModel
      prorated
    }
    fixedCharge {
      id
      chargeModel
      prorated
    }
  }

  query getInvoiceDetailsForCreateFeeDrawer($invoiceId: ID!) {
    invoice(id: $invoiceId) {
      id
      subscriptions {
        ...SubscriptionForCreateFeeDrawer
      }
      # Fees at Invoice level (like InvoiceForFormatInvoiceItemMap)
      fees {
        ...FeeForCreateFeeDrawer
      }
    }
  }

  mutation createAdjustedFee($input: CreateAdjustedFeeInput!) {
    createAdjustedFee(input: $input) {
      id
    }
  }
`

export const useEditFeeDrawer = (): { openDrawer: OpenEditFeeDrawer } => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const drawer = useFormDrawer()

  const openParamsRef = useRef<OpenEditFeeDrawerParams | undefined>(undefined)
  // The drawer body owns the invoice query, so the regenerate branch reads the loaded
  // subscription from here rather than from a `children` prop frozen at open time.
  const currentSubscriptionRef = useRef<SubscriptionForCreateFeeDrawerFragment | undefined>(
    undefined,
  )

  const onSubscriptionLoaded = useCallback(
    (subscription: SubscriptionForCreateFeeDrawerFragment | undefined): void => {
      currentSubscriptionRef.current = subscription
    },
    [],
  )

  const [createFee] = useCreateAdjustedFeeMutation({
    // Draft fees are destroyed and recreated when the draft is refreshed server-side, so a
    // row rendered before that refresh submits a `feeId` the API can no longer resolve.
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    onError(error) {
      // Only `not_found` is silenced, so every other code is still the global error link's to
      // toast and report — re-toasting it here would only be saved by addToast's dedupe.
      if (!hasDefinedGQLError('NotFound', error)) return

      if (openParamsRef.current?.mode === 'edit' && hasDefinedGQLError('NotFound', error, 'fee')) {
        addToast({ severity: 'danger', translateKey: 'text_1788330185449ifi9d6haua6' })
        drawer.close()
        client.refetchQueries({ include: ['getInvoiceDetails', 'getInvoiceFees'] })

        return
      }

      addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
    },
    onCompleted({ createAdjustedFee }) {
      if (createAdjustedFee?.id) {
        drawer.close()
      }
    },
    refetchQueries: ['getInvoiceDetails', 'getInvoiceFees'],
  })

  const form = useAppForm({
    defaultValues: EDIT_FEE_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editFeeValidationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(EDIT_FEE_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value: { adjustmentType, unitPreciseAmount, units, ...values } }) => {
      const openParams = openParamsRef.current

      if (!openParams) return

      const invoiceSubscriptionId =
        openParams.mode === 'edit' ? undefined : openParams.invoiceSubscriptionId
      const fee = openParams.mode === 'add' ? undefined : openParams.fee

      const chargeFilterId =
        values.chargeFilterId === ALL_FILTER_VALUES ? null : values.chargeFilterId || undefined

      const input: CreateAdjustedFeeInput = {
        chargeFilterId,
        chargeId: values.chargeId,
        feeId: fee?.id,
        fixedChargeId: values.fixedChargeId,
        invoiceDisplayName: values.invoiceDisplayName || undefined,
        invoiceId: openParams.invoiceId,

        unitPreciseAmount:
          adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount
            ? String(unitPreciseAmount)
            : undefined,
        units: adjustmentType ? Number(units || 0) : undefined,
      }

      if (openParams.mode === 'regenerate') {
        const currentSubscription = currentSubscriptionRef.current

        const currentCharge = currentSubscription?.plan.charges?.find(
          (charge) => charge.id === values.chargeId,
        )

        const currentFixedCharge = currentSubscription?.plan.fixedCharges?.find(
          (fixedCharge) => fixedCharge.id === values.fixedChargeId,
        )

        openParams.onAdd({
          ...(openParams.fee || {}),
          ...input,
          invoiceSubscriptionId: invoiceSubscriptionId || '',
          charge: currentCharge as Charge,
          fixedCharge: currentFixedCharge as FixedCharge,
        })

        drawer.close()

        return
      }

      await createFee({
        variables: {
          input: {
            ...input,
            subscriptionId: invoiceSubscriptionId || '',
          },
        },
      })
    },
  })

  const openDrawer: OpenEditFeeDrawer = (params) => {
    const isRegenerateMode = params.mode === 'regenerate'
    const fee = params.mode === 'add' ? undefined : params.fee

    openParamsRef.current = params
    currentSubscriptionRef.current = undefined

    form.reset(buildEditFeeDefaultValues({ fee, isRegenerateMode }), { keepDefaultValues: true })

    void drawer.open({
      title: !!fee
        ? translate('text_65a6b4e2cb38d9b70ec53c25', {
            name: fee?.metadata?.displayName || fee?.itemName || '',
          })
        : translate('text_1737709105343hpvidjp0yz0'),
      form: { id: EDIT_FEE_FORM_ID, submit: form.handleSubmit },
      cancelOrCloseText: 'cancel',
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      withPadding: false,
      fullContentHeight: true,
      children: (
        <EditFeeDrawerContent
          form={form}
          invoiceId={params.invoiceId}
          invoiceSubscriptionId={params.mode === 'edit' ? undefined : params.invoiceSubscriptionId}
          isRegenerateMode={isRegenerateMode}
          fee={fee}
          localFees={params.mode === 'regenerate' ? params.localFees : undefined}
          onSubscriptionLoaded={onSubscriptionLoaded}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={EDIT_FEE_DRAWER_SUBMIT_BUTTON_TEST_ID}>
            {translate(fee?.id ? 'text_65a6b4e2cb38d9b70ec53d9b' : 'text_1752580912616sr615x718w7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
