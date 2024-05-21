import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteOktaIntegrationDialogFragment,
  useDestroyIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteOktaIntegrationDialog on OktaIntegration {
    id
    name
  }

  mutation DestroyIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type DeleteOktaIntegrationDialogProps = {
  integration: DeleteOktaIntegrationDialogFragment | undefined
  callback?: Function
}

export interface DeleteOktaIntegrationDialogRef {
  openDialog: ({ integration, callback }: DeleteOktaIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteOktaIntegrationDialog = forwardRef<DeleteOktaIntegrationDialogRef>((_, ref) => {
  const { translate } = useInternationalization()

  const dialogRef = useRef<WarningDialogRef>(null)
  const [localData, setLocalData] = useState<DeleteOktaIntegrationDialogProps>()

  const integration = localData?.integration

  const [deleteIntegration] = useDestroyIntegrationMutation({
    onCompleted(data) {
      if (data && data.destroyIntegration) {
        dialogRef.current?.closeDialog()
        localData?.callback?.()

        addToast({
          message: translate('text_664c732c264d7eed1c74fdb4', {
            integration: translate('text_664c732c264d7eed1c74fda2'),
          }),
          severity: 'success',
        })
      }
    },
    update(cache) {
      cache.evict({ id: `OktaIntegration:${integration?.id}` })
    },
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
      title={translate('text_664c900d2d312a01546bd84b')}
      description={translate('text_664c900d2d312a01546bd84c')}
      onContinue={async () =>
        await deleteIntegration({
          variables: {
            input: {
              id: integration?.id ?? '',
            },
          },
        })
      }
      continueText={translate('text_645d071272418a14c1c76a81')}
    />
  )
})

DeleteOktaIntegrationDialog.displayName = 'DeleteOktaIntegrationDialog'
