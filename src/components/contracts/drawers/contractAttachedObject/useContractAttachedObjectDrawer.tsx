import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { getContractFieldLocks } from '~/components/contracts/drawers/contract/fieldLocks'
import { mapContractToDrawerCustomer } from '~/components/contracts/drawers/contract/mapContractToDrawerCustomer'
import { useUpdateContractSection } from '~/components/contracts/useUpdateContractSection'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { ContractForContractDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { buildContractAttachedObjectInput } from './buildContractAttachedObjectInput'
import {
  CONTRACT_ATTACHED_OBJECT_DRAWER_SUBMIT_TEST_ID,
  CONTRACT_ATTACHED_OBJECT_DRAWER_TITLE_KEY,
  CONTRACT_ATTACHED_OBJECT_FORM_DEFAULTS,
  CONTRACT_ATTACHED_OBJECT_FORM_ID,
} from './constants'
import { ContractAttachedObjectDrawerContent } from './ContractAttachedObjectDrawerContent'
import { mapContractToAttachedObjectFormValues } from './mapContractToAttachedObjectFormValues'
import { contractAttachedObjectSchema } from './schema'

export const useContractAttachedObjectDrawer = (): {
  openDrawer: (contract: ContractForContractDrawerFragment) => void
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { updateContractSection } = useUpdateContractSection()

  // A ref, not a local: `onSubmit` is created with the form and would otherwise close
  // over the contract from whichever render opened it.
  const editedContractRef = useRef<ContractForContractDrawerFragment | undefined>(undefined)

  const form = useAppForm({
    defaultValues: CONTRACT_ATTACHED_OBJECT_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: contractAttachedObjectSchema },
    onSubmit: async ({ value }) => {
      const contract = editedContractRef.current

      if (!contract) return

      await updateContractSection(buildContractAttachedObjectInput(value, contract))
      drawer.close()
    },
  })

  const openDrawer = (contract: ContractForContractDrawerFragment): void => {
    editedContractRef.current = contract
    form.reset(mapContractToAttachedObjectFormValues(contract), { keepDefaultValues: true })

    drawer.open({
      title: translate(CONTRACT_ATTACHED_OBJECT_DRAWER_TITLE_KEY),
      form: { id: CONTRACT_ATTACHED_OBJECT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      children: (
        <ContractAttachedObjectDrawerContent
          form={form}
          fieldLocks={getContractFieldLocks(contract.status)}
          seededCustomer={mapContractToDrawerCustomer(contract)}
          seededPlan={contract.plan ?? undefined}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONTRACT_ATTACHED_OBJECT_DRAWER_SUBMIT_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
