import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  InvoiceForVoidInvoiceDialogFragment,
  InvoiceForVoidInvoiceDialogFragmentDoc,
  InvoiceListItemFragmentDoc,
  useVoidInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment InvoiceForVoidInvoiceDialog on Invoice {
    id
    number
  }

  mutation voidInvoice($input: VoidInvoiceInput!) {
    voidInvoice(input: $input) {
      id
      status
      ...InvoiceListItem
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  # Fragments needed to refresh data from other parts of the UI
  ${InvoiceListItemFragmentDoc}
  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
`

type VoidInvoiceDialogData = {
  invoice?: InvoiceForVoidInvoiceDialogFragment | null
}

export const useVoidInvoiceDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [voidInvoice] = useVoidInvoiceMutation({
    onCompleted(data) {
      if (data && data.voidInvoice) {
        addToast({
          message: translate('text_65269b43d4d2b15dd929a254'),
          severity: 'success',
        })
      }
    },
    update(cache, { data: invoiceData }) {
      if (!invoiceData?.voidInvoice) return

      const cacheId = `Invoice:${invoiceData?.voidInvoice.id}`

      const previousData: InvoiceForVoidInvoiceDialogFragment | null = cache.readFragment({
        id: cacheId,
        fragment: InvoiceForVoidInvoiceDialogFragmentDoc,
        fragmentName: 'InvoiceForVoidInvoiceDialog',
      })

      cache.writeFragment({
        id: cacheId,
        fragment: InvoiceForVoidInvoiceDialogFragmentDoc,
        fragmentName: 'InvoiceForVoidInvoiceDialog',
        data: {
          ...previousData,
          status: invoiceData.voidInvoice.status,
        },
      })
    },
    refetchQueries: ['getCustomerCreditNotes'], // Refresh amounts in case the invoices containes some credits
  })

  const openVoidInvoiceDialog = ({ invoice }: VoidInvoiceDialogData) => {
    centralizedDialog.open({
      title: translate('text_65269b43d4d2b15dd929a0df', {
        invoiceNumber: invoice?.number,
      }),
      description: translate('text_65269b43d4d2b15dd929a0e5'),
      colorVariant: 'danger',
      actionText: translate('text_65269b43d4d2b15dd929a259'),
      onAction: async () => {
        await voidInvoice({
          variables: { input: { id: invoice?.id as string } },
        })
      },
    })
  }

  return { openVoidInvoiceDialog }
}
