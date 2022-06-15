import { forwardRef, memo } from 'react'
import { gql } from '@apollo/client'

import { DialogRef } from '~/components/designSystem'
import { useDeleteWebhookMutation } from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  mutation deleteWebhook($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      webhookUrl
    }
  }
`

export interface DeleteWebhookDialogRef extends WarningDialogRef {}

export const DeleteWebhookDialog = memo(
  forwardRef<DialogRef>((_, ref) => {
    const [deleteCustomer] = useDeleteWebhookMutation({
      onCompleted({ updateOrganization }) {
        if (!!updateOrganization) {
          addToast({
            message: translate('text_6271200984178801ba8bdf6c'),
            severity: 'success',
          })
        }
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_6271200984178801ba8bdeb2')}
        description={translate('text_6271200984178801ba8bded2')}
        onContinue={async () =>
          await deleteCustomer({
            variables: { input: { webhookUrl: null } },
          })
        }
        continueText={translate('text_6271200984178801ba8bdf0c')}
      />
    )
  })
)

DeleteWebhookDialog.displayName = 'DeleteWebhookDialog'
