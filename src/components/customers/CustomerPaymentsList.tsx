import { FC } from 'react'
import { generatePath } from 'react-router-dom'

import { InfiniteScroll, Status, Table, Typography } from '~/components/designSystem'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { addToast } from '~/core/apolloClient'
import { payablePaymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_PAYMENT_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  GetPaymentListQuery,
  GetPaymentListQueryHookResult,
  Invoice,
  PaymentForPaymentsListFragment,
  PaymentRequest,
  PaymentTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface CustomerPaymentsListProps {
  payments: PaymentForPaymentsListFragment[]
  loading: boolean
  metadata?: GetPaymentListQuery['payments']['metadata']
  fetchMore?: GetPaymentListQueryHookResult['fetchMore']
}

export const CustomerPaymentsList: FC<CustomerPaymentsListProps> = ({
  payments,
  loading,
  metadata,
  fetchMore,
}) => {
  const { translate } = useInternationalization()

  return (
    <InfiniteScroll
      onBottom={() => {
        const { currentPage = 0, totalPages = 0 } = metadata || {}

        currentPage < totalPages &&
          !loading &&
          fetchMore?.({
            variables: { page: currentPage + 1 },
          })
      }}
    >
      <Table
        name="customer-payments-list"
        data={payments}
        containerSize={{ default: 4 }}
        isLoading={loading}
        actionColumn={() => {
          return [
            {
              startIcon: 'duplicate',
              title: translate('text_1737029625089rtcf3ah5khq'),
              onAction: ({ id }) => {
                copyToClipboard(id)
                addToast({
                  severity: 'info',
                  translateKey: translate('text_17370296250897n2pakp5v33'),
                })
              },
            },
          ]
        }}
        actionColumnTooltip={() => translate('text_637f813d31381b1ed90ab326')}
        onRowActionLink={(request) =>
          generatePath(CUSTOMER_PAYMENT_DETAILS_ROUTE, {
            paymentId: request.id,
            customerId: request.customer.id,
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
  )
}
