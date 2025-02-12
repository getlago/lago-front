import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteMoneyhashIntegrationDialogFragment,
  useDeleteMoneyhashIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteMoneyhashIntegrationDialog on MoneyhashProvider {
    id
    name
  }
  mutation deleteMoneyhashIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteMoneyhashIntegrationDialogProps = {
  provider: DeleteMoneyhashIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteMoneyhashIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteMoneyhashIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteMoneyhashIntegrationDialog = forwardRef<DeleteMoneyhashIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteMoneyhashIntegrationDialogProps | undefined>(
      undefined,
    )
    const moneyhashProvider = localData?.provider

    const [deleteMoneyhash] = useDeleteMoneyhashIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_1737463302046fgixue5wtvu'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `MoneyhashProvider:${moneyhashProvider?.id}` })
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
        title={translate('text_658461066530343fe1808cd7', { name: moneyhashProvider?.name })}
        description={translate('text_658461066530343fe1808cc2')}
        onContinue={async () =>
          await deleteMoneyhash({ variables: { input: { id: moneyhashProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteMoneyhashIntegrationDialog.displayName = 'DeleteMoneyhashIntegrationDialog'
