import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/designSystem/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeletePaystackIntegrationDialogFragment,
  useDeletePaystackIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeletePaystackIntegrationDialog on PaystackProvider {
    id
    name
  }
  mutation deletePaystackIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeletePaystackIntegrationDialogProps = {
  provider: DeletePaystackIntegrationDialogFragment | null
  callback?: () => void
}

export interface DeletePaystackIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeletePaystackIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeletePaystackIntegrationDialog = forwardRef<DeletePaystackIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeletePaystackIntegrationDialogProps | undefined>(
      undefined,
    )
    const paystackProvider = localData?.provider

    const [deletePaystack] = useDeletePaystackIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_17779187197468r7u2m51gv7'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `PaystackProvider:${paystackProvider?.id}` })
      },
      refetchQueries: ['getPaystackIntegrationsList'],
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
        title={translate('text_1749799070145vfvz9sq757a', {
          name: paystackProvider?.name,
        })}
        description={translate('text_1777918719746slvcrbxiqr3')}
        onContinue={async () =>
          await deletePaystack({
            variables: { input: { id: paystackProvider?.id as string } },
          })
        }
        continueText={translate('text_1749799070145czycjo9guoq')}
      />
    )
  },
)

DeletePaystackIntegrationDialog.displayName = 'DeletePaystackIntegrationDialog'
