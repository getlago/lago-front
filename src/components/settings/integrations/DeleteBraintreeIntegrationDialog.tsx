import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState} from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  DeleteBraintreeIntegrationDialogFragment,
  useDeleteBraintreeIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql `
  fragment DeleteBraintreeIntegrationDialog on BraintreeProvider {
    id
    name
  }

  mutation deleteBraintreeIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteBraintreeIngrationDialogProps = {
  provider: DeleteBraintreeIntegrationDialogFragment | null
  callback?: () => void
}

export interface DeleteBraintreeIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteBraintreeIngrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteBraintreeIntegrationDialog = forwardRef<DeleteBraintreeIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteBraintreeIngrationDialogProps | undefined>(undefined)
    const braintreeProvider = localData?.provider

    const [deleteBraintree] = useDeleteBraintreeIntegrationMutation({
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
        cache.evict({ id: `BraintreeProvider:${braintreeProvider?.id}` })
      },
      refetchQueries: ['getBraintreeIntegrationsList'],
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
        title={translate('text_658461066530343fe1808cd7', { name: braintreeProvider?.name })}
        description={translate('text_658461066530343fe1808cc2')}
        onContinue={async () =>
          await deleteBraintree({ variables: { input: { id: braintreeProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteBraintreeIntegrationDialog.displayName = 'DeleteBraintreeIntegrationDialog'