import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
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
    displayName
    finalizeZeroAmountInvoice
  }

  mutation deleteCustomerFinalizeZeroAmountInvoice($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...DeleteCustomerFinalizeZeroAmountInvoice
    }
  }
`

type DeleteCustomerFinalizeZeroAmountInvoiceDialogData = {
  customer: DeleteCustomerFinalizeZeroAmountInvoiceFragment
}

export const useDeleteCustomerFinalizeZeroAmountInvoiceDialog = (): {
  openDeleteCustomerFinalizeZeroAmountInvoiceDialog: (
    data: DeleteCustomerFinalizeZeroAmountInvoiceDialogData,
  ) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteCustomerFinalizeZeroAmountInvoice] =
    useDeleteCustomerFinalizeZeroAmountInvoiceMutation({
      onCompleted(data) {
        if (data && data.updateCustomer) {
          addToast({
            message: translate('text_17255496712882bspi9zp0iy'),
            severity: 'success',
          })
        }
      },
    })

  const openDeleteCustomerFinalizeZeroAmountInvoiceDialog = ({
    customer,
  }: DeleteCustomerFinalizeZeroAmountInvoiceDialogData): void => {
    centralizedDialog.open({
      title: translate('text_1725549671288txz7z4m4qrf'),
      description: (
        <Typography
          html={translate('text_17255496712882gafqyniqpc', {
            customerName: customer?.displayName,
          })}
        />
      ),
      colorVariant: 'danger',
      actionText: translate('text_63aa085d28b8510cd46441a5'),
      onAction: async () => {
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
      },
    })
  }

  return { openDeleteCustomerFinalizeZeroAmountInvoiceDialog }
}
