import { gql } from '@apollo/client'
import { memo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Alert, Button, Skeleton } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { InvoiceCreditNotesTable } from '~/components/invoices/InvoiceCreditNotesTable'
import { InvoiceCustomerInfos } from '~/components/invoices/InvoiceCustomerInfos'
import { InvoiceDetailsTable } from '~/components/invoices/InvoiceDetailsTable'
import { Metadatas } from '~/components/invoices/Metadatas'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import { formatDateToTZ } from '~/core/timezone'
import {
  CreditNote,
  CreditNoteItem,
  Customer,
  Invoice,
  InvoiceStatusTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

gql`
  fragment InvoiceDetailsForInvoiceOverview on Invoice {
    id
    status
    issuingDate
    customer {
      id
      applicableTimezone
    }
  }
`

interface InvoiceOverviewProps {
  downloadInvoice: Function
  hasError: boolean
  invoice: Invoice
  loading: boolean
  loadingInvoiceDownload: boolean
  loadingRefreshInvoice: boolean
  refreshInvoice: Function
}

const InvoiceOverview = memo(
  ({
    downloadInvoice,
    hasError,
    invoice,
    loading,
    loadingInvoiceDownload,
    loadingRefreshInvoice,
    refreshInvoice,
  }: InvoiceOverviewProps) => {
    const { translate } = useInternationalization()
    const { invoiceId } = useParams()
    const customer = invoice?.customer
    const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
    const formatedCreditNotes = invoice?.creditNotes
      ?.reduce<{ creditNote: CreditNote; items: CreditNoteItem[][][] }[]>((acc, cur) => {
        const newItems = formatCreditNotesItems(cur.items as CreditNoteItem[])

        acc.push({ creditNote: cur, items: newItems })
        return acc
      }, [])
      .sort((a, b) => (a.creditNote.number < b.creditNote.number ? -1 : 1))

    if (hasError) {
      return (
        <ErrorPlaceholder
          title={translate('text_634812d6f16b31ce5cbf4126')}
          subtitle={translate('text_634812d6f16b31ce5cbf4128')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      )
    }

    return (
      <>
        <SectionHeader variant="subhead">
          {translate('text_634687079be251fdb43833bf')}
          {invoice?.status === InvoiceStatusTypeEnum.Draft ? (
            <NavigationRightActions>
              <Button
                variant="quaternary"
                startIcon="reload"
                disabled={loading || loadingRefreshInvoice}
                onClick={async () => {
                  await refreshInvoice()
                }}
              >
                {translate('text_63a41a8eabb9ae67047c1c06')}
              </Button>
              <Button
                variant="quaternary"
                disabled={loading}
                onClick={() => {
                  finalizeInvoiceRef.current?.openDialog(invoice)
                }}
              >
                {translate('text_638f4d756d899445f18a4a10')}
              </Button>
            </NavigationRightActions>
          ) : (
            !hasError &&
            !loading && (
              <Button
                variant="quaternary"
                disabled={loadingInvoiceDownload}
                onClick={async () => {
                  await downloadInvoice({
                    variables: { input: { id: invoiceId || '' } },
                  })
                }}
              >
                {translate('text_634687079be251fdb43833b9')}
              </Button>
            )
          )}
        </SectionHeader>

        <>
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonLine key={`key-skeleton-line-${i}`}>
                  <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                  <Skeleton variant="text" width="38%" height={12} marginRight="11.2%" />
                  <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                  <Skeleton variant="text" width="38%" height={12} marginRight="9.25%" />
                </SkeletonLine>
              ))}
            </>
          ) : (
            <>
              {invoice?.status === InvoiceStatusTypeEnum.Draft && (
                <DraftAlertWrapper>
                  <Alert type="info">
                    {translate('text_63a41a8eabb9ae67047c1c0c', {
                      issuingDate: formatDateToTZ(
                        invoice.issuingDate,
                        customer?.applicableTimezone,
                        "LLL. dd, yyyy U'T'CZ",
                      ),
                    })}
                  </Alert>
                </DraftAlertWrapper>
              )}
              <InvoiceCustomerInfos invoice={invoice} />
              <InvoiceDetailsTable
                customer={customer as Customer}
                invoice={invoice as Invoice}
                loading={loadingRefreshInvoice}
              />
              {!!formatedCreditNotes?.length &&
                invoice?.status !== InvoiceStatusTypeEnum.Draft &&
                !loadingRefreshInvoice && (
                  <InvoiceCreditNotesTable
                    customerId={customer?.id || ''}
                    formatedCreditNotes={formatedCreditNotes}
                    invoiceId={invoiceId || ''}
                  />
                )}

              {invoice?.status !== InvoiceStatusTypeEnum.Draft && (
                <Metadatas customer={customer} invoice={invoice} />
              )}
            </>
          )}
        </>
        <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      </>
    )
  },
)

InvoiceOverview.displayName = 'InvoiceOverview'

const ErrorPlaceholder = styled(GenericPlaceholder)`
  padding-top: ${theme.spacing(12)};
`

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

const NavigationRightActions = styled.div`
  display: flex;

  > button {
    margin-left: ${theme.spacing(3)};
  }
`

const DraftAlertWrapper = styled.div`
  padding-top: ${theme.spacing(3)};
`

export default InvoiceOverview
