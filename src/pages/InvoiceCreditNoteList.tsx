import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { useParams, generatePath } from 'react-router-dom'

import { theme, NAV_HEIGHT } from '~/styles'
import { Typography, ButtonLink } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  useGetInvoiceCreditNotesQuery,
  CreditNotesForListFragmentDoc,
  TimezoneEnum,
} from '~/generated/graphql'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
} from '~/core/router'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import CreditNotesList from '~/components/customers/creditNotes/CreditNotesList'

gql`
  query getInvoiceCreditNotes($customerId: ID!, $invoiceId: ID!, $page: Int, $limit: Int) {
    invoiceCreditNotes(invoiceId: $invoiceId, page: $page, limit: $limit) {
      ...CreditNotesForList
    }

    invoice(id: $invoiceId) {
      id
      refundableAmountCents
      creditableAmountCents
    }

    customer(id: $customerId) {
      id
      applicableTimezone
    }
  }

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }

  ${CreditNotesForListFragmentDoc}
`

const InvoiceCreditNoteList = () => {
  const { invoiceId, id } = useParams()
  const { translate } = useInternationalization()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { data, loading, error, fetchMore } = useGetInvoiceCreditNotesQuery({
    variables: { customerId: id as string, invoiceId: invoiceId as string, limit: 20 },
    skip: !invoiceId || !id,
  })
  const creditNotes = data?.invoiceCreditNotes?.collection

  return (
    <div>
      {(!loading || !!creditNotes?.length) && (
        <Header>
          <Typography variant="subhead">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
          <ButtonLink
            type="button"
            disabled={
              data?.invoice?.creditableAmountCents === 0 &&
              data?.invoice?.refundableAmountCents === 0
            }
            buttonProps={{ variant: 'quaternary' }}
            to={generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, { id, invoiceId })}
          >
            {translate('text_636bdef6565341dcb9cfb127')}
          </ButtonLink>
        </Header>
      )}
      <>
        {!!error && !loading ? (
          <GenericPlaceholder
            title={translate('text_636d023ce11a9d038819b579')}
            subtitle={translate('text_636d023ce11a9d038819b57b')}
            buttonTitle={translate('text_636d023ce11a9d038819b57d')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : !loading && !creditNotes?.length ? (
          <EmptyStateTypography variant="body" color="grey500">
            {translate('text_636bdef6565341dcb9cfb12b')}
          </EmptyStateTypography>
        ) : (
          <CreditNotesList
            creditNotes={creditNotes}
            fetchMore={fetchMore}
            itemClickRedirection={CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE}
            loading={loading}
            metadata={data?.invoiceCreditNotes?.metadata}
            customerTimezone={data?.customer?.applicableTimezone || TimezoneEnum.TzUtc}
          />
        )}
      </>
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </div>
  )
}

export default InvoiceCreditNoteList

InvoiceCreditNoteList.displayName = 'InvoiceCreditNoteList'

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const EmptyStateTypography = styled(Typography)`
  margin-top: ${theme.spacing(6)};
`
