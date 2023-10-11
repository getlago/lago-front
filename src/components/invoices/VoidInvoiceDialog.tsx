import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
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

type VoidInvoiceDialogProps = {
  invoice?: InvoiceForVoidInvoiceDialogFragment | null
}

export interface VoidInvoiceDialogRef {
  openDialog: (dialogData: VoidInvoiceDialogProps) => unknown
  closeDialog: () => unknown
}

export const VoidInvoiceDialog = forwardRef<VoidInvoiceDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [dialogData, setDialogData] = useState<VoidInvoiceDialogProps | undefined>(undefined)

  const invoice = dialogData?.invoice

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

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setDialogData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_65269b43d4d2b15dd929a0df', {
        invoiceNumber: invoice?.number,
      })}
      description={translate('text_65269b43d4d2b15dd929a0e5')}
      onContinue={async () =>
        await voidInvoice({
          variables: { input: { id: invoice?.id as string } },
        })
      }
      continueText={translate('text_65269b43d4d2b15dd929a259')}
    />
  )
})

VoidInvoiceDialog.displayName = 'VoidInvoiceDialog'
