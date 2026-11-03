import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import { Button } from '~/components/designSystem/Button'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE } from '~/core/router'
import {
  CreditNotesForTableFragmentDoc,
  TimezoneEnum,
  useGetInvoiceCreditNotesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'
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
      offsettableAmountCents
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
  const { canIssueCreditNote } = usePermissionsInvoiceActions()
  const premiumWarningDialog = usePremiumWarningDialog()
  const { data, loading, error, fetchMore, variables } = useGetInvoiceCreditNotesQuery({
    notifyOnNetworkStatusChange: true,
    variables: { invoiceId: invoiceId as string, limit: DEFAULT_PAGE_SIZE },
    skip: !invoiceId || !customerId,
  })
  const creditNotes = data?.invoiceCreditNotes?.collection

  const invoice = data?.invoice

  const { disabledIssueCreditNoteButton, disabledIssueCreditNoteButtonLabel } =
    createCreditNoteForInvoiceButtonProps({
      invoiceType: invoice?.invoiceType,
      associatedActiveWalletPresent: invoice?.associatedActiveWalletPresent,
    })

  const renderIssueCreditNoteButton = () => {
    if (!invoice || !canIssueCreditNote(invoice)) return null

    if (!isPremium) {
      return (
        <Button variant="quaternary" onClick={() => premiumWarningDialog.open()} endIcon="sparkles">
          {translate('text_636bdef6565341dcb9cfb127')}
        </Button>
      )
    }

    return (
      <Tooltip
        title={disabledIssueCreditNoteButtonLabel && translate(disabledIssueCreditNoteButtonLabel)}
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
    )
  }

  return (
    <div>
      {(!loading || !!creditNotes?.length) && (
        <div className="flex h-18 items-center justify-between shadow-b">
          <Typography variant="subhead1">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
          {renderIssueCreditNoteButton()}
        </div>
      )}
      <>
        {!!error && !loading && (
          <GenericPlaceholder
            title={translate('text_636d023ce11a9d038819b579')}
            subtitle={translate('text_636d023ce11a9d038819b57b')}
            buttonTitle={translate('text_636d023ce11a9d038819b57d')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        )}
        {!error && !loading && !creditNotes?.length && (
          <Typography className="mt-6" variant="body" color="grey500">
            {translate('text_636bdef6565341dcb9cfb12b')}
          </Typography>
        )}
        {(loading || (!error && !!creditNotes?.length)) && (
          <CreditNotesTable
            creditNotes={creditNotes}
            fetchMore={fetchMore}
            isLoading={loading}
            metadata={data?.invoiceCreditNotes?.metadata}
            customerTimezone={data?.invoice?.customer.applicableTimezone || TimezoneEnum.TzUtc}
            error={error}
            variables={variables}
            sticky={false}
          />
        )}
      </>
    </div>
  )
}

InvoiceCreditNoteList.displayName = 'InvoiceCreditNoteList'
