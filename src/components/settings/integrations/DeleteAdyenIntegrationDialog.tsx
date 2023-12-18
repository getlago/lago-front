import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteAdyenIntegrationDialogFragment,
  useDeleteAdyenIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteAdyenIntegrationDialog on AdyenProvider {
    id
    name
  }

  mutation deleteAdyenIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteAdyenIntegrationDialogProps = {
  provider: DeleteAdyenIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteAdyenIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteAdyenIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAdyenIntegrationDialog = forwardRef<DeleteAdyenIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteAdyenIntegrationDialogProps | undefined>(
      undefined,
    )
    const adyenProvider = localData?.provider

    const [deleteAdyen] = useDeleteAdyenIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_645d071272418a14c1c76b25'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `AdyenProvider:${adyenProvider?.id}` })
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
        title={translate('text_658461066530343fe1808cd7', { name: adyenProvider?.name })}
        description={translate('text_658461066530343fe1808cc2')}
        onContinue={async () =>
          await deleteAdyen({ variables: { input: { id: adyenProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteAdyenIntegrationDialog.displayName = 'DeleteAdyenIntegrationDialog'
