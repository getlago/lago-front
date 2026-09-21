import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { AdditionalIntegrationSettingsDrawerContent } from './AdditionalIntegrationSettingsDrawerContent'
import {
  ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES,
  additionalIntegrationSettingsValidationSchema,
  AdditionalIntegrationSettingsValues,
} from './additionalIntegrationSettingsSchema'

const ADDITIONAL_INTEGRATION_SETTINGS_FORM_ID = 'additional-integration-settings-drawer-form'

const ADDITIONAL_INTEGRATION_SETTINGS_SAVE_TEST_ID = 'additional-integration-settings-drawer-save'

interface UseAdditionalIntegrationSettingsDrawerProps {
  customerId: string
  description?: string
  onSave: (values: AdditionalIntegrationSettingsValues) => void | Promise<void>
}

interface UseAdditionalIntegrationSettingsDrawerReturn {
  openDrawer: (values?: Partial<AdditionalIntegrationSettingsValues>) => void
}

export const useAdditionalIntegrationSettingsDrawer = ({
  customerId,
  description,
  onSave,
}: UseAdditionalIntegrationSettingsDrawerProps): UseAdditionalIntegrationSettingsDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: additionalIntegrationSettingsValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value)
      drawer.close()
    },
  })

  const openDrawer = (values?: Partial<AdditionalIntegrationSettingsValues>): void => {
    form.reset(
      { ...ADDITIONAL_INTEGRATION_SETTINGS_DEFAULT_VALUES, ...values },
      {
        keepDefaultValues: true,
      },
    )

    drawer.open({
      title: translate('text_1789472252793twqbda38ec2'),
      form: { id: ADDITIONAL_INTEGRATION_SETTINGS_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: (container) => focusFirstInput(container),
      children: (
        <AdditionalIntegrationSettingsDrawerContent
          form={form}
          customerId={customerId}
          description={description}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={ADDITIONAL_INTEGRATION_SETTINGS_SAVE_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
