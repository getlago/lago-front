import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import { Button, ButtonLink, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE } from '~/core/router'
import {
  CreditNotesForTableFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetInvoiceCreditNotesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  query getInvoiceCreditNotes($invoiceId: ID!, $page: Int, $limit: Int) {
    invoiceCreditNotes(invoiceId: $invoiceId, page: $page, limit: $limit) {
      ...CreditNotesForTable
    }

    invoice(id: $invoiceId) {
      id
      invoiceType
      associatedActiveWalletPresent
      paymentStatus
      refundableAmountCents
      creditableAmountCents
      totalPaidAmountCents
      totalDueAmountCents
      status
      customer {
        id
        applicableTimezone
        displayName
      }
    }
  }

  ${CreditNotesForTableFragmentDoc}
`

export const InvoiceCreditNoteList = () => {
  const { invoiceId, customerId } = useParams()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { data, loading, error, fetchMore, variables } = useGetInvoiceCreditNotesQuery({
    variables: { invoiceId: invoiceId as string, limit: 20 },
    skip: !invoiceId || !customerId,
  })
  const creditNotes = data?.invoiceCreditNotes?.collection

  const invoice = data?.invoice
  const isPartiallyPaid =
    Number(invoice?.totalPaidAmountCents || 0) > 0 && Number(invoice?.totalDueAmountCents || 0) > 0

  const { disabledIssueCreditNoteButton, disabledIssueCreditNoteButtonLabel } =
    createCreditNoteForInvoiceButtonProps({
      invoiceType: invoice?.invoiceType,
      paymentStatus: invoice?.paymentStatus,
      creditableAmountCents: invoice?.creditableAmountCents,
      refundableAmountCents: invoice?.refundableAmountCents,
      associatedActiveWalletPresent: invoice?.associatedActiveWalletPresent,
    })

  return (
    <div>
      {(!loading || !!creditNotes?.length) && (
        <div className="flex h-18 items-center justify-between shadow-b">
          <Typography variant="subhead1">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
          {data?.invoice?.status !== InvoiceStatusTypeEnum.Draft && (
            <>
              {data?.invoice?.status !== InvoiceStatusTypeEnum.Voided && (
                <>
                  {isPremium ? (
                    <Tooltip
                      title={
                        !isPartiallyPaid &&
                        disabledIssueCreditNoteButtonLabel &&
                        translate(disabledIssueCreditNoteButtonLabel)
                      }
                      placement="top-start"
                    >
                      <ButtonLink
                        type="button"
                        disabled={disabledIssueCreditNoteButton}
                        buttonProps={{ variant: 'quaternary' }}
                        to={generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, {
                          customerId: customerId as string,
                          invoiceId: invoiceId as string,
                        })}
                      >
                        {translate('text_636bdef6565341dcb9cfb127')}
                      </ButtonLink>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="quaternary"
                      onClick={() => premiumWarningDialogRef.current?.openDialog()}
                      endIcon="sparkles"
                    >
                      {translate('text_636bdef6565341dcb9cfb127')}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
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
          <Typography className="mt-6" variant="body" color="grey500">
            {translate('text_636bdef6565341dcb9cfb12b')}
          </Typography>
        ) : (
          <CreditNotesTable
            creditNotes={creditNotes}
            fetchMore={fetchMore}
            isLoading={loading}
            metadata={data?.invoiceCreditNotes?.metadata}
            customerTimezone={data?.invoice?.customer.applicableTimezone || TimezoneEnum.TzUtc}
            error={error}
            variables={variables}
            showFilters={false}
          />
        )}
      </>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

InvoiceCreditNoteList.displayName = 'InvoiceCreditNoteList'
