import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { getContractFieldLocks } from '~/components/contracts/drawers/contract/fieldLocks'
import { useUpdateContractSection } from '~/components/contracts/useUpdateContractSection'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { ContractForContractDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { buildContractSettingsInput } from './buildContractSettingsInput'
import {
  CONTRACT_SETTINGS_DRAWER_SUBMIT_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_TITLE_KEY,
  CONTRACT_SETTINGS_FORM_DEFAULTS,
  CONTRACT_SETTINGS_FORM_ID,
} from './constants'
import { ContractSettingsDrawerContent } from './ContractSettingsDrawerContent'
import { mapContractToContractSettingsFormValues } from './mapContractToContractSettingsFormValues'
import { contractSettingsSchema } from './schema'

export const useContractSettingsDrawer = (): {
  openDrawer: (contract: ContractForContractDrawerFragment) => void
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { updateContractSection } = useUpdateContractSection()

  // A ref, not a local: `onSubmit` is created with the form and would otherwise close
  // over the contract from whichever render opened it.
  const editedContractRef = useRef<ContractForContractDrawerFragment | undefined>(undefined)

  const form = useAppForm({
    defaultValues: CONTRACT_SETTINGS_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: contractSettingsSchema },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(CONTRACT_SETTINGS_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const contract = editedContractRef.current

      if (!contract) return

      await updateContractSection(buildContractSettingsInput(value, contract))
      drawer.close()
    },
  })

  const openDrawer = (contract: ContractForContractDrawerFragment): void => {
    editedContractRef.current = contract
    form.reset(mapContractToContractSettingsFormValues(contract), { keepDefaultValues: true })

    drawer.open({
      title: translate(CONTRACT_SETTINGS_DRAWER_TITLE_KEY),
      form: { id: CONTRACT_SETTINGS_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      children: (
        <ContractSettingsDrawerContent
          form={form}
          fieldLocks={getContractFieldLocks(contract.status)}
          customerTimezone={contract.customer.applicableTimezone}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONTRACT_SETTINGS_DRAWER_SUBMIT_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
