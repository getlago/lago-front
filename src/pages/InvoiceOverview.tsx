import React, { memo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CreditNote,
  CreditNoteItem,
  Customer,
  Invoice,
  InvoiceForCreditNotesTableFragmentDoc,
  InvoiceForDetailsTableFragmentDoc,
  InvoiceForInvoiceInfosFragmentDoc,
  useDownloadInvoiceMutation,
  useGetAllInvoiceDetailsQuery,
} from '~/generated/graphql'
import { Skeleton, Button } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { SectionHeader } from '~/styles/customer'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import { InvoiceCustomerInfos } from '~/components/invoices/InvoiceCustomerInfos'
import { InvoiceDetailsTable } from '~/components/invoices/InvoiceDetailsTable'
import { InvoiceCreditNotesTable } from '~/components/invoices/InvoiceCreditNotesTable'

gql`
  query getAllInvoiceDetails($id: ID!) {
    invoice(id: $id) {
      id
      totalAmountCents
      customer {
        id
      }

      ...InvoiceForCreditNotesTable
      ...InvoiceForDetailsTable
      ...InvoiceForInvoiceInfos
    }
  }

  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  ${InvoiceForCreditNotesTableFragmentDoc}
  ${InvoiceForDetailsTableFragmentDoc}
  ${InvoiceForInvoiceInfosFragmentDoc}
`

export const InvoiceOverview = memo(() => {
  const { translate } = useInternationalization()
  const { invoiceId } = useParams()
  const { data, loading, error } = useGetAllInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })
  const invoice = data?.invoice
  const customer = invoice?.customer
  const hasError = (!!error || !invoice) && !loading
  const formatedCreditNotes = invoice?.creditNotes
    ?.reduce<{ creditNote: CreditNote; items: CreditNoteItem[][][] }[]>((acc, cur) => {
      const newItems = formatCreditNotesItems(cur.items as CreditNoteItem[])

      // @ts-ignore
      acc.push({ creditNote: cur, items: newItems })
      return acc
    }, [])
    .sort((a, b) => (a.creditNote.number < b.creditNote.number ? -1 : 1))

  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      const fileUrl = downloadInvoiceData?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

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
        {!hasError && !loading && (
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
        )}
      </SectionHeader>

      <Content>
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
            <InvoiceCustomerInfos customer={customer as Customer} invoice={invoice as Invoice} />
            <InvoiceDetailsTable customer={customer as Customer} invoice={invoice as Invoice} />
            {!!formatedCreditNotes?.length && (
              <InvoiceCreditNotesTable
                customerId={customer?.id || ''}
                invoiceId={invoiceId || ''}
                formatedCreditNotes={formatedCreditNotes}
                subTotalVatExcludedAmountCents={invoice?.subTotalVatExcludedAmountCents || 0}
              />
            )}
          </>
        )}
      </Content>
    </>
  )
})

InvoiceOverview.displayName = 'InvoiceOverview'

const Content = styled.div`
  padding-top: ${theme.spacing(6)};
`

const ErrorPlaceholder = styled(GenericPlaceholder)`
  padding-top: ${theme.spacing(12)};
`

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

export default InvoiceOverview
