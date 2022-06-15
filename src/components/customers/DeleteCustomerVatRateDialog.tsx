import { forwardRef } from 'react'
import { gql } from '@apollo/client'

import { DialogRef } from '~/components/designSystem'
import {
  useDeleteCustomerVatRateMutation,
  DeleteCustomerVatRateFragment,
} from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  mutation deleteCustomerVatRate($input: UpdateCustomerVatRateInput!) {
    updateCustomerVatRate(input: $input) {
      id
      vatRate
    }
  }

  fragment DeleteCustomerVatRate on CustomerDetails {
    id
    vatRate
    name
  }
`

export interface DeleteCustomerVatRateDialogRef extends WarningDialogRef {}

interface DeleteCustomerVatRateDialogProps {
  customer: DeleteCustomerVatRateFragment
}

export const DeleteCustomerVatRateDialog = forwardRef<DialogRef, DeleteCustomerVatRateDialogProps>(
  ({ customer }: DeleteCustomerVatRateDialogProps, ref) => {
    const [deleteCustomer] = useDeleteCustomerVatRateMutation({
      onCompleted({ updateCustomerVatRate }) {
        if (!!updateCustomerVatRate) {
          addToast({
            message: translate('text_62728ff857d47b013204cbed'),
            severity: 'success',
          })
        }
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_62728ff857d47b013204c768')}
        description={translate('text_62728ff857d47b013204c774', {
          customerFullName: customer?.name,
        })}
        onContinue={async () =>
          await deleteCustomer({
            variables: {
              input: {
                id: customer?.id,
                vatRate: null,
              },
            },
          })
        }
        continueText={translate('text_62728ff857d47b013204c796')}
      />
    )
  }
)

DeleteCustomerVatRateDialog.displayName = 'DeleteCustomerVatRateDialog'
