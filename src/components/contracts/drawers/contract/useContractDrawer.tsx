import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { CONTRACT_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import { LagoApiError, useCreateContractMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { buildCreateContractInput } from './buildContractInput'
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
    externalId
    name
    status
    startedAt
    endedAt
    billingAnchorDate
    billingEntityId
    consolidateInvoice
    selectedInvoiceCustomSections {
      id
      name
    }
    skipInvoiceCustomSections
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
`

export type OpenContractDrawerArgs = { customer?: ContractDrawerCustomer }

export const useContractDrawer = (): {
  openDrawer: (args?: OpenContractDrawerArgs) => void
} => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const [createContract] = useCreateContractMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['getContractsList', 'getCustomerContractsList'],
  })

  const title = translate(CONTRACT_DRAWER_TITLE_CREATE_KEY)

  // A ref, not a local: `onSubmit` is created with the form and would otherwise close
  // over the seed from whichever render built it.
  const seededCustomerRef = useRef<ContractDrawerCustomer | undefined>(undefined)

  const form = useAppForm({
    defaultValues: buildContractFormDefaults(),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: contractSchema },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(CONTRACT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const result = await createContract({ variables: { input: buildCreateContractInput(value) } })
      const contract = result.data?.createContract

      if (!contract || result.errors?.length) {
        addToast({ severity: 'danger', translateKey: 'text_1789552637141bjmvomefkkg' })
        return
      }

      const contractDetailsPath = generatePath(CONTRACT_DETAILS_ROUTE, { id: contract.id })

      if (isCreateMoreEnabled()) {
        form.reset(buildContractFormDefaults(seededCustomerRef.current), {
          keepDefaultValues: true,
        })
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
    seededCustomerRef.current = args.customer
    resetCreateMore()
    form.reset(buildContractFormDefaults(args.customer), { keepDefaultValues: true })

    drawer.open({
      title,
      form: { id: CONTRACT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONTRACT_DRAWER_SUBMIT_TEST_ID}>{title}</form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ContractDrawerContent
          form={form}
          seededCustomer={args.customer}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
