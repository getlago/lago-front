import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteNetsuiteIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteNetsuiteIntegrationDialog on NetsuiteIntegration {
    id
    name
  }

  mutation destroyNangoIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteNetsuiteIntegrationDialogProps = {
  provider: DeleteNetsuiteIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteNetsuiteIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteNetsuiteIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteNetsuiteIntegrationDialog = forwardRef<DeleteNetsuiteIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteNetsuiteIntegrationDialogProps | undefined>(
      undefined,
    )
    const netsuiteProvider = localData?.provider

    const [deleteNetsuite] = useDestroyNangoIntegrationMutation({
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
        cache.evict({ id: `NetsuiteProvider:${netsuiteProvider?.id}` })
      },
      refetchQueries: ['getNetsuiteIntegrationsList'],
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
        title={translate('text_658461066530343fe1808cd7', { name: netsuiteProvider?.name })}
        description={translate('text_661ff6e56ef7e1b7c542b1ec')}
        onContinue={async () =>
          await deleteNetsuite({ variables: { input: { id: netsuiteProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteNetsuiteIntegrationDialog.displayName = 'DeleteNetsuiteIntegrationDialog'
