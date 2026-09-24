import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useMemo, useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CONTRACT_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  ContractForContractDrawerFragment,
  LagoApiError,
  useCreateContractMutation,
  useUpdateContractMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { buildCreateContractInput, buildUpdateContractInput } from './buildContractInput'
import {
  buildContractFormDefaults,
  CONTRACT_DRAWER_SUBMIT_TEST_ID,
  CONTRACT_DRAWER_TITLE_CREATE_KEY,
  CONTRACT_DRAWER_TITLE_EDIT_KEY,
  CONTRACT_DRAWER_UPDATE_ERROR_KEY,
  CONTRACT_DRAWER_UPDATE_SUCCESS_KEY,
  CONTRACT_FORM_ID,
  ContractDrawerCustomer,
  ContractFormValues,
} from './constants'
import { ContractDrawerContent } from './ContractDrawerContent'
import { getContractFieldLocks } from './fieldLocks'
import { mapContractToDrawerCustomer, mapContractToFormValues } from './mapContractToFormValues'
import { buildContractSchema } from './schema'

gql`
  fragment ContractForContractDrawer on Contract {
    id
    externalId
    name
    status
    startedAt
    endedAt
    billingAnchorDate
    billingEntityId
    consolidateInvoice
    purchaseOrderNumber
    paymentMethodType
    paymentMethod {
      id
    }
    customer {
      id
      externalId
      displayName
      applicableTimezone
      billingEntity {
        id
      }
    }
    plan {
      id
      name
      code
    }
  }

  mutation createContract($input: CreateContractInput!) {
    createContract(input: $input) {
      id
      ...ContractForContractDrawer
    }
  }

  mutation updateContract($input: UpdateContractInput!) {
    updateContract(input: $input) {
      id
      ...ContractForContractDrawer
    }
  }
`

export type OpenContractDrawerArgs =
  | { customer?: ContractDrawerCustomer; contract?: never }
  | { contract: ContractForContractDrawerFragment; customer?: never }

type ContractFormSuccess = {
  contract: ContractForContractDrawerFragment
  wasEdit: boolean
}

const useContractForm = ({ onSuccess }: { onSuccess: (success: ContractFormSuccess) => void }) => {
  // A ref, not a local: `onSubmit` is created with the form and would otherwise close
  // over the contract from whichever render built it.
  const editedContractRef = useRef<ContractForContractDrawerFragment | undefined>(undefined)
  // `planCode` is optional on the API, so a contract created without a plan must stay saveable.
  const isPlanRequiredRef = useRef(true)
  const contractSchema = useMemo(
    () => buildContractSchema({ isPlanRequired: () => isPlanRequiredRef.current }),
    [],
  )

  const [createContract] = useCreateContractMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['getContractsList', 'getCustomerContractsList'],
  })
  const [updateContract] = useUpdateContractMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: [
      'getContractsList',
      'getCustomerContractsList',
      'getContractForDetails',
      'getContractForDetailsOverview',
    ],
  })

  const submitUpdate = async (
    value: ContractFormValues,
    editedContract: ContractForContractDrawerFragment,
  ): Promise<void> => {
    const result = await updateContract({
      variables: { input: buildUpdateContractInput(value, editedContract) },
    })
    const contract = result.data?.updateContract

    // `silentErrorCodes` swallows the rejection, so without this the failed submit
    // would look like a no-op.
    if (!contract || result.errors?.length) {
      addToast({ severity: 'danger', translateKey: CONTRACT_DRAWER_UPDATE_ERROR_KEY })
      return
    }

    onSuccess({ contract, wasEdit: true })
  }

  const submitCreate = async (value: ContractFormValues): Promise<void> => {
    const result = await createContract({ variables: { input: buildCreateContractInput(value) } })
    const contract = result.data?.createContract

    if (!contract || result.errors?.length) {
      addToast({ severity: 'danger', translateKey: 'text_1789552637141bjmvomefkkg' })
      return
    }

    onSuccess({ contract, wasEdit: false })
  }

  const form = useAppForm({
    defaultValues: buildContractFormDefaults(),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: contractSchema },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(CONTRACT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const editedContract = editedContractRef.current

      if (editedContract) {
        await submitUpdate(value, editedContract)
        return
      }

      await submitCreate(value)
    },
  })

  const resetForm = (args: OpenContractDrawerArgs = {}): void => {
    editedContractRef.current = args.contract
    isPlanRequiredRef.current = !args.contract || !!args.contract.plan

    const values = args.contract
      ? mapContractToFormValues(args.contract)
      : buildContractFormDefaults(args.customer)

    form.reset(values, { keepDefaultValues: true })
  }

  return { form, resetForm }
}

export const useContractDrawer = (): {
  openDrawer: (args?: OpenContractDrawerArgs) => void
} => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // A ref, not a local: `onSuccess` is created with the form and would otherwise
  // close over the seed from whichever render built it.
  const seededCustomerRef = useRef<ContractDrawerCustomer | undefined>(undefined)

  const { form, resetForm } = useContractForm({
    onSuccess: ({ contract, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({ severity: 'success', translateKey: CONTRACT_DRAWER_UPDATE_SUCCESS_KEY })
        return
      }

      const contractDetailsPath = generatePath(CONTRACT_DETAILS_ROUTE, { id: contract.id })

      if (isCreateMoreEnabled()) {
        resetForm({ customer: seededCustomerRef.current })
        notifyReset()
        // The drawer renders outside the matched-route context, so the router Link
        // in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1789552637141ul3xbbl8uu5', {
            contractName: escapeDoubleQuotes(contract.name || contract.externalId),
            contractUrl: prependOrgSlug(contractDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(contractDetailsPath)
      addToast({ severity: 'success', translateKey: 'text_1789552637141hilxjurcb4j' })
    },
  })

  const openDrawer = (args: OpenContractDrawerArgs = {}): void => {
    const { contract } = args
    const isEdit = !!contract
    const title = translate(
      isEdit ? CONTRACT_DRAWER_TITLE_EDIT_KEY : CONTRACT_DRAWER_TITLE_CREATE_KEY,
    )

    seededCustomerRef.current = contract ? mapContractToDrawerCustomer(contract) : args.customer
    resetCreateMore()
    resetForm(args)

    drawer.open({
      title,
      form: { id: CONTRACT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: isEdit ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONTRACT_DRAWER_SUBMIT_TEST_ID}>
            {isEdit ? translate('text_17295436903260tlyb1gp1i7') : title}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ContractDrawerContent
          form={form}
          isEdit={isEdit}
          fieldLocks={getContractFieldLocks(contract?.status)}
          seededCustomer={seededCustomerRef.current}
          seededPlan={contract?.plan ?? undefined}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
