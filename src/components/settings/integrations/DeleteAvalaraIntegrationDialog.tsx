import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteAvalaraIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteAvalaraIntegrationDialog on AvalaraIntegration {
    id
    name
  }

  mutation destroyAvalaraIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

interface DeleteProviderDialogProps {
  provider: DeleteAvalaraIntegrationDialogFragment
  callback?: () => void
}

export interface DeleteAvalaraIntegrationDialogRef {
  openDialog: (value: DeleteProviderDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAvalaraIntegrationDialog = forwardRef<DeleteAvalaraIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)

    const [localData, setLocalData] = useState<DeleteProviderDialogProps | undefined>(undefined)
    const avalaraProvider = localData?.provider

    const [deleteAvalara] = useDestroyNangoIntegrationMutation({
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
        cache.evict({ id: `AvalaraIntegration:${avalaraProvider?.id}` })
      },
      refetchQueries: ['getAvalaraIntegrationsList'],
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
        title={translate('text_658461066530343fe1808cd7', { name: avalaraProvider?.name })}
        description={translate('text_1744293719130klvtjda8wjz')}
        onContinue={async () =>
          await deleteAvalara({ variables: { input: { id: avalaraProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteAvalaraIntegrationDialog.displayName = 'DeleteAvalaraIntegrationDialog'
