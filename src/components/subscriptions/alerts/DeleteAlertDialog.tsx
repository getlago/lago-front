import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { useDestroySubscriptionAlertMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation destroySubscriptionAlert($input: DestroySubscriptionAlertInput!) {
    destroySubscriptionAlert(input: $input) {
      id
    }
  }
`

type DeleteAlertDialogProps = {
  id: string
}

export interface DeleteAlertDialogRef {
  openDialog: ({ id }: DeleteAlertDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAlertDialog = forwardRef<DeleteAlertDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<DeleteAlertDialogProps | undefined>(undefined)

  const [destroyAlert] = useDestroySubscriptionAlertMutation({
    onCompleted(data) {
      if (!!data?.destroySubscriptionAlert?.id) {
        addToast({
          message: translate('text_1746611635508k9cmy2th6r1'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getAlertsOfSubscription'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_1746611635509m6xkucwbclx')}
      description={translate('text_1746611635509rkns7krj9zq')}
      onContinue={async () =>
        await destroyAlert({
          variables: { input: { id: localData?.id || '' } },
        })
      }
      continueText={translate('text_6271200984178801ba8bdf0c')}
    />
  )
})

DeleteAlertDialog.displayName = 'DeleteAlertDialog'
