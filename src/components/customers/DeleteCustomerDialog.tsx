import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteCustomerDialogFragment, useDeleteCustomerMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerDialog on Customer {
    id
    name
    displayName
  }

  mutation deleteCustomer($input: DestroyCustomerInput!) {
    destroyCustomer(input: $input) {
      id
    }
  }
`

type TDeleteCustomerDialogProps = {
  customer?: DeleteCustomerDialogFragment
  onDeleted?: () => void
}

export interface DeleteCustomerDialogRef {
  openDialog: (props: TDeleteCustomerDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteCustomerDialog = forwardRef<DeleteCustomerDialogRef, unknown>((_props, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TDeleteCustomerDialogProps>()

  useImperativeHandle(ref, () => ({
    openDialog: (props) => {
      setLocalData(props)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      setLocalData(undefined)
      dialogRef.current?.closeDialog()
    },
  }))

  const [deleteCustomer] = useDeleteCustomerMutation({
    onCompleted(data) {
      if (data && data.destroyCustomer) {
        localData?.onDeleted?.()
        addToast({
          message: translate('text_626162c62f790600f850b814'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['customers'],
  })

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_626162c62f790600f850b6e8', {
        customerFullName:
          localData?.customer?.displayName || translate('text_651a8ab50fd34e005d1c1dc7'),
      })}
      description={<Typography html={translate('text_626162c62f790600f850b6f8')} />}
      onContinue={async () =>
        await deleteCustomer({
          variables: {
            input: {
              id: localData?.customer?.id || '',
            },
          },
        })
      }
      continueText={translate('text_626162c62f790600f850b712')}
    />
  )
})

DeleteCustomerDialog.displayName = 'DeleteCustomerDialog'
