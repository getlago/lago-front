import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CONTRACT_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  ContractForContractDrawerFragment,
  LagoApiError,
  useCreateContractMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  buildContractFormDefaults,
  CONTRACT_DRAWER_SUBMIT_TEST_ID,
  CONTRACT_DRAWER_TITLE_CREATE_KEY,
  CONTRACT_FORM_ID,
  ContractDrawerCustomer,
} from './constants'
import { ContractDrawerContent } from './ContractDrawerContent'
import { contractSchema } from './schema'

gql`
  fragment ContractForContractDrawer on Contract {
    id
    name
    externalId
  }

  mutation createContract($input: CreateContractInput!) {
    createContract(input: $input) {
      id
      ...ContractForContractDrawer
    }
  }
`

const useContractForm = ({
  onSuccess,
}: {
  onSuccess: (contract: ContractForContractDrawerFragment) => void
}) => {
  const [createContract] = useCreateContractMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['getContractsList', 'getCustomerContractsList'],
  })

  const form = useAppForm({
    defaultValues: buildContractFormDefaults(),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: contractSchema },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(CONTRACT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const result = await createContract({
        variables: {
          input: {
            externalCustomerId: value.externalCustomerId,
            // The API still requires an external ID. Preserve Lago's generated
            // fallback unless the user reveals and fills the optional field.
            externalId: value.externalId || crypto.randomUUID(),
            planCode: value.planCode,
            name: value.name || undefined,
            billingEntityId: value.billingEntityId || undefined,
            consolidateInvoice: value.consolidateInvoice,
            paymentMethod: value.paymentMethod,
            purchaseOrderNumber:
              normalizePurchaseOrderNumber(value.purchaseOrderNumber) ?? undefined,
            // The pickers publish UTC already; this is the same belt-and-braces
            // conversion the subscription form applies on submit.
            startedAt: DateTime.fromISO(value.startedAt).toUTC().toISO() ?? undefined,
            endedAt: value.endedAt
              ? (DateTime.fromISO(value.endedAt).toUTC().toISO() ?? undefined)
              : undefined,
            // ISO8601Date, not a datetime: a bare calendar day.
            billingAnchorDate:
              DateTime.fromISO(value.billingAnchorDate).toUTC().toISODate() ?? undefined,
          },
        },
      })

      const contract = result.data?.createContract

      // `silentErrorCodes` swallows the rejection, so without this the failed
      // submit would look like a no-op.
      if (!contract || result.errors?.length) {
        addToast({ severity: 'danger', translateKey: 'text_1789552637141bjmvomefkkg' })
        return
      }

      onSuccess(contract)
    },
  })

  const resetForm = (customer?: ContractDrawerCustomer): void => {
    form.reset(buildContractFormDefaults(customer), { keepDefaultValues: true })
  }

  return { form, resetForm }
}

export const useContractDrawer = (): {
  openDrawer: (args?: { customer?: ContractDrawerCustomer }) => void
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
    onSuccess: (contract) => {
      const contractDetailsPath = generatePath(CONTRACT_DETAILS_ROUTE, { id: contract.id })

      if (isCreateMoreEnabled()) {
        resetForm(seededCustomerRef.current)
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

  const openDrawer = (args?: { customer?: ContractDrawerCustomer }): void => {
    seededCustomerRef.current = args?.customer
    resetCreateMore()
    resetForm(seededCustomerRef.current)

    drawer.open({
      title: translate(CONTRACT_DRAWER_TITLE_CREATE_KEY),
      form: { id: CONTRACT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONTRACT_DRAWER_SUBMIT_TEST_ID}>
            {translate(CONTRACT_DRAWER_TITLE_CREATE_KEY)}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ContractDrawerContent
          form={form}
          seededCustomer={seededCustomerRef.current}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
