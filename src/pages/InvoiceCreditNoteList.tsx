import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import styled from 'styled-components'

import CreditNotesList from '~/components/customers/creditNotes/CreditNotesList'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import { Button, ButtonLink, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
} from '~/core/router'
import {
  CreditNotesForListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetInvoiceCreditNotesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'

gql`
  query getInvoiceCreditNotes($invoiceId: ID!, $page: Int, $limit: Int) {
    invoiceCreditNotes(invoiceId: $invoiceId, page: $page, limit: $limit) {
      ...CreditNotesForList
    }

    invoice(id: $invoiceId) {
      id
      refundableAmountCents
      creditableAmountCents
      status
      customer {
        id
        applicableTimezone
      }
    }
  }

  ${CreditNotesForListFragmentDoc}
`

const InvoiceCreditNoteList = () => {
  const { invoiceId, customerId } = useParams()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { data, loading, error, fetchMore } = useGetInvoiceCreditNotesQuery({
    variables: { invoiceId: invoiceId as string, limit: 20 },
    skip: !invoiceId || !customerId,
  })
  const creditNotes = data?.invoiceCreditNotes?.collection

  return (
    <div>
      {(!loading || !!creditNotes?.length) && (
        <Header>
          <Typography variant="subhead">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
          {data?.invoice?.status !== InvoiceStatusTypeEnum.Draft && (
            <>
              {data?.invoice?.status !== InvoiceStatusTypeEnum.Voided && (
                <>
                  {isPremium ? (
                    <ButtonLink
                      type="button"
                      disabled={
                        data?.invoice?.creditableAmountCents === '0' &&
                        data?.invoice?.refundableAmountCents === '0'
                      }
                      buttonProps={{ variant: 'quaternary' }}
                      to={generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, {
                        customerId: customerId as string,
                        invoiceId: invoiceId as string,
                      })}
                    >
                      {translate('text_636bdef6565341dcb9cfb127')}
                    </ButtonLink>
                  ) : (
                    <Button
                      variant="quaternary"
                      onClick={premiumWarningDialogRef.current?.openDialog}
                      endIcon="sparkles"
                    >
                      {translate('text_636bdef6565341dcb9cfb127')}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
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
            customerTimezone={data?.invoice?.customer.applicableTimezone || TimezoneEnum.TzUtc}
          />
        )}
      </>
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
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
