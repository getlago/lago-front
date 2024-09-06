import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCashfreeIntegrationDialogFragment,
  useDeleteCashfreeMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCashfreeIntegrationDialog on CashfreeProvider {
    id
    name
  }

  mutation deleteCashfree($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteCashfreeIntegrationDialogProps = {
  provider: DeleteCashfreeIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteCashfreeIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteCashfreeIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteCashfreeIntegrationDialog = forwardRef<DeleteCashfreeIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteCashfreeIntegrationDialogProps | undefined>(
      undefined,
    )

    const cashfreeProvider = localData?.provider

    const [deleteCashfree] = useDeleteCashfreeMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_1727621949511zk6kkl99pzk'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `CashfreeProvider:${cashfreeProvider?.id}` })
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
        title={translate('text_658461066530343fe1808cd7', { name: cashfreeProvider?.name })}
        description={translate('text_1727621816788cygs13tsdyv')}
        onContinue={async () =>
          await deleteCashfree({ variables: { input: { id: cashfreeProvider?.id as string } } })
        }
        continueText={translate('text_659d5de7c9b7f51394f7f3fd')}
      />
    )
  },
)

DeleteCashfreeIntegrationDialog.displayName = 'DeleteCashfreeIntegrationDialog'
