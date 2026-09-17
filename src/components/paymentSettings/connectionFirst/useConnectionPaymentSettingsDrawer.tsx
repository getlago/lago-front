import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { ConnectionPaymentSettingsDrawerContent } from './ConnectionPaymentSettingsDrawerContent'
import {
  CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES,
  connectionPaymentSettingsValidationSchema,
  ConnectionPaymentSettingsValues,
} from './connectionPaymentSettingsSchema'

const CONNECTION_PAYMENT_SETTINGS_FORM_ID = 'connection-payment-settings-drawer-form'

const CONNECTION_PAYMENT_SETTINGS_SAVE_TEST_ID = 'connection-payment-settings-drawer-save'

interface UseConnectionPaymentSettingsDrawerProps {
  viewType: ViewTypeEnum
  customerId: string
  onSave: (values: ConnectionPaymentSettingsValues) => void | Promise<void>
}

interface UseConnectionPaymentSettingsDrawerReturn {
  openDrawer: (values?: Partial<ConnectionPaymentSettingsValues>) => void
}

export const useConnectionPaymentSettingsDrawer = ({
  viewType,
  customerId,
  onSave,
}: UseConnectionPaymentSettingsDrawerProps): UseConnectionPaymentSettingsDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: connectionPaymentSettingsValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value)
      drawer.close()
    },
  })

  const openDrawer = (values?: Partial<ConnectionPaymentSettingsValues>): void => {
    form.reset(
      { ...CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES, ...values },
      {
        keepDefaultValues: true,
      },
    )

    drawer.open({
      title: translate('text_1789381469546g27fewh3r8c'),
      form: { id: CONNECTION_PAYMENT_SETTINGS_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: (container) => focusFirstInput(container),
      children: (
        <ConnectionPaymentSettingsDrawerContent
          form={form}
          viewType={viewType}
          customerId={customerId}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={CONNECTION_PAYMENT_SETTINGS_SAVE_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
