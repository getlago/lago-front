import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteXeroIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteXeroIntegrationDialog on XeroIntegration {
    id
    name
  }

  mutation destroyNangoIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteXeroIntegrationDialogProps = {
  provider: DeleteXeroIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteXeroIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteXeroIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteXeroIntegrationDialog = forwardRef<DeleteXeroIntegrationDialogRef>((_, ref) => {
  const { translate } = useInternationalization()

  const dialogRef = useRef<WarningDialogRef>(null)
  const [localData, setLocalData] = useState<TDeleteXeroIntegrationDialogProps | undefined>(
    undefined,
  )
  const xeroProvider = localData?.provider

  const [deleteXero] = useDestroyNangoIntegrationMutation({
    onCompleted(data) {
      if (data && data.destroyIntegration) {
        dialogRef.current?.closeDialog()
        localData?.callback?.()
        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2f9'),
          severity: 'success',
        })
      }
    },
    update(cache) {
      cache.evict({ id: `XeroProvider:${xeroProvider?.id}` })
    },
    refetchQueries: ['getXeroIntegrationsList'],
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
      title={translate('text_658461066530343fe1808cd7', { name: xeroProvider?.name })}
      description={translate('text_6672ebb8b1b50be550eccada')}
      onContinue={async () =>
        await deleteXero({ variables: { input: { id: xeroProvider?.id as string } } })
      }
      continueText={translate('text_645d071272418a14c1c76a81')}
    />
  )
})

DeleteXeroIntegrationDialog.displayName = 'DeleteXeroIntegrationDialog'
