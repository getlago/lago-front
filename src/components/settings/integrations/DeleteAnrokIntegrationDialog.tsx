import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteAnrokIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteAnrokIntegrationDialog on AnrokIntegration {
    id
    name
  }

  mutation destroyNangoIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteAnrokIntegrationDialogProps = {
  provider: DeleteAnrokIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteAnrokIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteAnrokIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAnrokIntegrationDialog = forwardRef<DeleteAnrokIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteAnrokIntegrationDialogProps | undefined>(
      undefined,
    )
    const anrokProvider = localData?.provider

    const [deleteAnrok] = useDestroyNangoIntegrationMutation({
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
        cache.evict({ id: `AnrokProvider:${anrokProvider?.id}` })
      },
      refetchQueries: ['getAnrokIntegrationsList'],
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
        title={translate('text_658461066530343fe1808cd7', { name: anrokProvider?.name })}
        description={translate('text_6668870bc8bdb352948ffb5f')}
        onContinue={async () =>
          await deleteAnrok({ variables: { input: { id: anrokProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteAnrokIntegrationDialog.displayName = 'DeleteAnrokIntegrationDialog'
