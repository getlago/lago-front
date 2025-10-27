import { RefObject } from 'react'

import { Button } from '~/components/designSystem'
import { FinalizeInvoiceDialogRef } from '~/components/invoices/FinalizeInvoiceDialog'
import { envGlobalVar } from '~/core/apolloClient'
import {
  DownloadInvoiceItemMutationFn,
  Invoice,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  RefreshInvoiceMutationFn,
  RetryInvoiceMutationFn,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const { disablePdfGeneration } = envGlobalVar()

interface InvoiceOverviewHeaderButtonsProps {
  invoice: Invoice
  loading: boolean
  loadingRefreshInvoice: boolean
  loadingRetryInvoice: boolean
  loadingInvoiceDownload: boolean
  hasError: boolean
  hasTaxProviderError: boolean
  refreshInvoice: RefreshInvoiceMutationFn
  retryInvoice: RetryInvoiceMutationFn
  downloadInvoice: DownloadInvoiceItemMutationFn
  finalizeInvoiceRef: RefObject<FinalizeInvoiceDialogRef>
  goToPreviousRoute?: () => void
  invoiceId?: string
}

export const InvoiceOverviewHeaderButtons = ({
  invoice,
  loading,
  loadingRefreshInvoice,
  loadingRetryInvoice,
  loadingInvoiceDownload,
  hasError,
  hasTaxProviderError,
  refreshInvoice,
  retryInvoice,
  downloadInvoice,
  finalizeInvoiceRef,
  goToPreviousRoute,
  invoiceId,
}: InvoiceOverviewHeaderButtonsProps) => {
  const { translate } = useInternationalization()
  const isTaxStatusPending = invoice?.taxStatus === InvoiceTaxStatusTypeEnum.Pending

  if (invoice?.status === InvoiceStatusTypeEnum.Draft) {
    return (
      <>
        <Button
          variant="quaternary"
          startIcon="reload"
          disabled={loading || loadingRefreshInvoice || isTaxStatusPending}
          onClick={async () => {
            await refreshInvoice()
          }}
        >
          {translate('text_63a41a8eabb9ae67047c1c06')}
        </Button>
        <Button
          variant="quaternary"
          disabled={loading || isTaxStatusPending}
          onClick={() => {
            finalizeInvoiceRef.current?.openDialog(invoice, goToPreviousRoute)
          }}
        >
          {translate('text_638f4d756d899445f18a4a10')}
        </Button>
      </>
    )
  }

  if (hasTaxProviderError) {
    return (
      <Button
        variant="quaternary"
        disabled={loading || loadingRetryInvoice || isTaxStatusPending}
        onClick={async () => {
          await retryInvoice()
        }}
      >
        {translate('text_1724164767403kyknbaw13mg')}
      </Button>
    )
  }

  if (!hasError && !loading && !disablePdfGeneration) {
    return (
      <Button
        variant="quaternary"
        disabled={loadingInvoiceDownload || isTaxStatusPending}
        onClick={async () => {
          await downloadInvoice({
            variables: { input: { id: invoiceId || '' } },
          })
        }}
      >
        {translate('text_634687079be251fdb43833b9')}
      </Button>
    )
  }

  return null
}
