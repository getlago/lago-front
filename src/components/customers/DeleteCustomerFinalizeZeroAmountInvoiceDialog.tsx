import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCustomerFinalizeZeroAmountInvoiceFragment,
  FinalizeZeroAmountInvoiceEnum,
  useDeleteCustomerFinalizeZeroAmountInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerFinalizeZeroAmountInvoice on Customer {
    id
    externalId
    name
    finalizeZeroAmountInvoice
  }

  mutation deleteCustomerFinalizeZeroAmountInvoice($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...DeleteCustomerFinalizeZeroAmountInvoice
    }
  }
`

export interface DeleteCustomerFinalizeZeroAmountInvoiceDialogRef extends WarningDialogRef {}

interface DeleteCustomerFinalizeZeroAmountInvoiceDialogProps {
  customer: DeleteCustomerFinalizeZeroAmountInvoiceFragment
}

export const DeleteCustomerFinalizeZeroAmountInvoiceDialog = forwardRef<
  DialogRef,
  DeleteCustomerFinalizeZeroAmountInvoiceDialogProps
>(({ customer }: DeleteCustomerFinalizeZeroAmountInvoiceDialogProps, ref) => {
  const { translate } = useInternationalization()

  const [deleteCustomerFinalizeZeroAmountInvoice] =
    useDeleteCustomerFinalizeZeroAmountInvoiceMutation({
      onCompleted(data) {
        if (data && data.updateCustomer) {
          addToast({
            message: translate('text_17255496712882bspi9zp0ii'),
            severity: 'success',
          })
        }
      },
    })

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_1725549671288txz7z4m4qrf')}
      description={
        <Typography
          html={translate('text_17255496712882gafqyniqpc', {
            customerName: customer?.name,
          })}
        />
      }
      onContinue={async () =>
        await deleteCustomerFinalizeZeroAmountInvoice({
          variables: {
            input: {
              id: customer?.id,
              externalId: customer?.externalId,
              name: customer?.name || '',
              finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Inherit,
            },
          },
        })
      }
      continueText={translate('text_63aa085d28b8510cd46441a5')}
    />
  )
})

DeleteCustomerFinalizeZeroAmountInvoiceDialog.displayName =
  'DeleteCustomerFinalizeZeroAmountInvoice'
