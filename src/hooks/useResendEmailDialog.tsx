import { revalidateLogic } from '@tanstack/react-form'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import EmailPreview, { BillingEntity } from '~/components/emails/EmailPreview'
import {
  resendEmailFormDefaultValues,
  resendEmailFormValidationSchema,
} from '~/components/emails/resendEmail/formInitialization'
import ResendEmailHeaderContent from '~/components/emails/resendEmail/ResendEmailHeaderContent'
import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'

import { useInternationalization } from './core/useInternationalization'
import { useAppForm } from './forms/useAppform'

export const useResendEmailDialog = () => {
  const form = useAppForm({
    defaultValues: resendEmailFormDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: resendEmailFormValidationSchema,
    },
  })
  const { translate } = useInternationalization()

  const centralizedDialog = useCentralizedDialog()

  const showResendEmailDialog = ({
    subject,
    type,
    billingEntity,
  }: {
    subject: string
    type?: BillingEntityEmailSettingsEnum
    billingEntity?: BillingEntity
  }) => {
    centralizedDialog.open({
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
      onAction: () => {
        // Do the resend
      },
      actionText: translate('text_17703925321987cxf5psj6l4'),
    })
  }

  return {
    showResendEmailDialog,
  }
}
