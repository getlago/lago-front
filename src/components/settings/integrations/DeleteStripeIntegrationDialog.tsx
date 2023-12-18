import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteStripeIntegrationDialogFragment, useDeleteStripeMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteStripeIntegrationDialog on StripeProvider {
    id
    name
  }

  mutation deleteStripe($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteStripeIntegrationDialogProps = {
  provider: DeleteStripeIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteStripeIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteStripeIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteStripeIntegrationDialog = forwardRef<DeleteStripeIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteStripeIntegrationDialogProps | undefined>(
      undefined,
    )

    const stripeProvider = localData?.provider

    const [deleteStripe] = useDeleteStripeMutation({
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
        cache.evict({ id: `StripeProvider:${stripeProvider?.id}` })
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
        title={translate('text_658461066530343fe1808cd7', { name: stripeProvider?.name })}
        description={translate('text_658461066530343fe1808cdb')}
        onContinue={async () =>
          await deleteStripe({ variables: { input: { id: stripeProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteStripeIntegrationDialog.displayName = 'DeleteStripeIntegrationDialog'
