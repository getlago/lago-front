import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { gql } from '@apollo/client'

import { DialogRef } from '~/components/designSystem'
import { useDeleteWebhookMutation } from '~/generated/graphql'
import { WarningDialog } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  mutation deleteWebhook($input: DestroyWebhookEndpointInput!) {
    destroyWebhookEndpoint(input: $input) {
      id
    }
  }
`

export interface DeleteWebhookDialogRef {
  openDialog: (id: string) => unknown
  closeDialog: () => unknown
}

export const DeleteWebhookDialog = forwardRef<DeleteWebhookDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localId, setLocalId] = useState<string | undefined>(undefined)
  const [deleteCustomer] = useDeleteWebhookMutation({
    onCompleted(res) {
      if (!!res.destroyWebhookEndpoint) {
        addToast({
          message: translate('text_6271200984178801ba8bdf6c'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyWebhookEndpoint) return

      const cacheId = cache.identify({
        id: data?.destroyWebhookEndpoint.id,
        __typename: 'WebhookEndpoint',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalId(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_6271200984178801ba8bdeb2')}
      description={translate('text_6271200984178801ba8bded2')}
      onContinue={async () =>
        await deleteCustomer({
          variables: { input: { id: localId as string } },
        })
      }
      continueText={translate('text_6271200984178801ba8bdf0c')}
    />
  )
})

DeleteWebhookDialog.displayName = 'DeleteWebhookDialog'
