import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteGocardlessIntegrationDialogFragment,
  useDeleteGocardlessMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteGocardlessIntegrationDialog on GocardlessProvider {
    id
    name
  }

  mutation deleteGocardless($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteGocardlessIntegrationDialogProps = {
  provider: DeleteGocardlessIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteGocardlessIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteGocardlessIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteGocardlessIntegrationDialog = forwardRef<DeleteGocardlessIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteGocardlessIntegrationDialogProps | undefined>(
      undefined,
    )

    const gocardlessProvider = localData?.provider

    const [deleteGocardless] = useDeleteGocardlessMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_62b1edddbf5f461ab9712758'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `GocardlessProvider:${gocardlessProvider?.id}` })
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
        mode="danger"
        ref={dialogRef}
        title={translate('text_658461066530343fe1808cd7', { name: gocardlessProvider?.name })}
        description={translate('text_65846181a741a1401ecdddb7')}
        onContinue={async () =>
          await deleteGocardless({ variables: { input: { id: gocardlessProvider?.id as string } } })
        }
        continueText={translate('text_659d5de7c9b7f51394f7f3fd')}
      />
    )
  },
)

DeleteGocardlessIntegrationDialog.displayName = 'DeleteGocardlessIntegrationDialog'
