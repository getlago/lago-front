import { revalidateLogic } from '@tanstack/react-form'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import EmailPreview, { BillingEntity } from '~/components/emails/EmailPreview'
import {
  resendEmailFormDefaultValues,
  resendEmailFormValidationSchema,
} from '~/components/emails/resendEmail/formInitialization'
import ResendEmailHeaderContent from '~/components/emails/resendEmail/ResendEmailHeaderContent'
import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'

import { useInternationalization } from './core/useInternationalization'
import { useAppForm } from './forms/useAppform'

export const SUBMIT_RESEND_EMAIL_DATA_TEST = 'submit-resend-email'
export const RESEND_EMAIL_FORM_ID = 'resend-email'

export const useResendEmailDialog = () => {
  const formDialog = useFormDialog()

  const form = useAppForm({
    defaultValues: resendEmailFormDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: resendEmailFormValidationSchema,
    },
    onSubmit: () => {
      // Do the resend
      return {
        reason: 'success',
      }
    },
  })
  const { translate } = useInternationalization()

  const handleSubmit = async () => {
    const result = await form.handleSubmit()

    // This way we can manage the validation
    if (!form.state.canSubmit) {
      throw Error('Not valid')
    }

    return result
  }

  const showResendEmailDialog = ({
    subject,
    type,
    billingEntity,
  }: {
    subject: string
    type?: BillingEntityEmailSettingsEnum
    billingEntity?: BillingEntity
  }) => {
    formDialog
      .open({
        title: translate('text_1770392315728uyw3zhs7kzh'),
        headerContent: <ResendEmailHeaderContent form={form} subject={subject} />,
        children: (
          <EmailPreview
            loading={false}
            type={type}
            billingEntity={billingEntity}
            showEmailHeader={false}
          />
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={SUBMIT_RESEND_EMAIL_DATA_TEST}>
              {translate('text_17703925321987cxf5psj6l4')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: RESEND_EMAIL_FORM_ID,
          submit: handleSubmit,
        },
        closeOnError: false,
      })
      .then((result) => {
        /* TODO: Remove this line */
        // eslint-disable-next-line no-console
        console.log('result', result)
      })
  }

  return {
    showResendEmailDialog,
  }
}
