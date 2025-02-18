import { FC } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { ButtonLink, InfiniteScroll, Status, Table } from '~/components/designSystem'
import { Typography } from '~/components/designSystem/Typography'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { payablePaymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CREATE_INVOICE_PAYMENT_ROUTE, PAYMENT_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  CurrencyEnum,
  Invoice,
  PaymentRequest,
  PaymentTypeEnum,
  useGetPaymentListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

export const InvoicePaymentList: FC<{
  invoiceTotalDueAmount: AllInvoiceDetailsForCustomerInvoiceDetailsFragment['totalDueAmountCents']
}> = ({ invoiceTotalDueAmount }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()
  const { invoiceId } = useParams()

  const { data, loading, error, fetchMore } = useGetPaymentListQuery({
    variables: { invoiceId: invoiceId as string, limit: 20 },
    skip: !invoiceId,
  })

  const payments = data?.payments.collection || []

  const canRecordPayment =
    invoiceTotalDueAmount > 0 && hasPermissions(['paymentsCreate']) && isPremium

  return (
    <>
      <div className="flex h-18 items-center justify-between shadow-b">
        <Typography variant="subhead">{translate('text_6672ebb8b1b50be550eccbed')}</Typography>
        {canRecordPayment && (
          <ButtonLink
            type="button"
            to={generatePath(CREATE_INVOICE_PAYMENT_ROUTE, { invoiceId: invoiceId as string })}
            buttonProps={{
              variant: 'quaternary',
            }}
          >
            {translate('text_1737471851634wpeojigr27w')}
          </ButtonLink>
        )}
      </div>
      {!loading && !payments.length && (
        <Typography className="mt-6" variant="body" color="grey500">
          {translate('text_17380560401785kuvb6m2yfm')}
        </Typography>
      )}
      {!loading && payments.length > 0 && (
        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = data?.payments.metadata || {}

            currentPage < totalPages &&
              !loading &&
              fetchMore?.({ variables: { page: currentPage + 1 } })
          }}
        >
          <Table
            name="payments-list"
            data={payments || []}
            containerSize={{
              default: 0,
            }}
            isLoading={loading}
            hasError={!!error}
            onRowActionLink={(request) =>
              generatePath(PAYMENT_DETAILS_ROUTE, {
                paymentId: request.id,
              })
            }
            columns={[
              {
                key: 'payablePaymentStatus',
                title: translate('text_63ac86d797f728a87b2f9fa7'),
                minWidth: 80,
                content: ({ payablePaymentStatus }) => (
                  <Status
                    {...payablePaymentStatusMapping({
                      payablePaymentStatus: payablePaymentStatus ?? undefined,
                    })}
                  />
                ),
              },
              {
                key: 'payable.payableType',
                title: translate('text_63ac86d797f728a87b2f9fad'),
                minWidth: 160,
                maxSpace: true,
                content: ({ payable }) => {
                  if (payable.payableType === 'Invoice') {
                    const payableInvoice = payable as Invoice

                    return payableInvoice.number
                  }
                  if (payable.payableType === 'PaymentRequest') {
                    const payablePaymentRequest = payable as PaymentRequest

                    return translate('text_17370296250898eqj4qe4qg9', {
                      count: payablePaymentRequest.invoices.length,
                    })
                  }
                },
              },
              {
                key: 'amountCents',
                title: translate('text_6419c64eace749372fc72b3e'),
                textAlign: 'right',
                content: ({ amountCents, amountCurrency }) => (
                  <Typography variant="bodyHl" color="textSecondary" noWrap>
                    {intlFormatNumber(
                      deserializeAmount(amountCents, amountCurrency || CurrencyEnum.Usd),
                      {
                        currency: amountCurrency || CurrencyEnum.Usd,
                      },
                    )}
                  </Typography>
                ),
              },
              {
                key: 'paymentType',
                title: translate('text_1737043182491927uocp2ydo'),
                content: ({ paymentType, paymentProviderType }) => (
                  <PaymentProviderChip
                    paymentProvider={
                      paymentProviderType ??
                      (paymentType === PaymentTypeEnum.Manual ? 'manual' : undefined)
                    }
                  />
                ),
              },
              {
                key: 'createdAt',
                title: translate('text_664cb90097bfa800e6efa3f5'),
                content: ({ createdAt, customer }) =>
                  formatDateToTZ(createdAt, customer.applicableTimezone),
              },
            ]}
          />
        </InfiniteScroll>
      )}
    </>
  )
}
