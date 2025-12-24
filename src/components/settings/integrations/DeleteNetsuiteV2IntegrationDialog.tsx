import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  DeleteNetsuiteV2IntegrationDialogFragment,
  useDestroyIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteNetsuiteV2IntegrationDialog on NetsuiteV2Integration {
    id
    name
  }

  mutation DestroyIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteNetsuiteV2IntegrationDialogProps = {
  provider: DeleteNetsuiteV2IntegrationDialogFragment | null
  callback?: () => void
}

export interface DeleteNetsuiteV2IntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteNetsuiteV2IntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteNetsuiteV2IntegrationDialog = forwardRef<DeleteNetsuiteV2IntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteNetsuiteV2IntegrationDialogProps | undefined>(
      undefined,
    )
    const netsuiteProvider = localData?.provider

    const [deleteNetsuite] = useDestroyIntegrationMutation({
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

DeleteNetsuiteV2IntegrationDialog.displayName = 'DeleteNetsuiteV2IntegrationDialog'
