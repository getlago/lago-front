import { gql } from '@apollo/client'
import { Avatar, Icon, IconName } from 'lago-design-system'
import { ReactNode, useCallback } from 'react'
import { generatePath, Link, useParams } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import {
  Button,
  Popper,
  Skeleton,
  Status,
  StatusType,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { addToast } from '~/core/apolloClient'
import { buildGoCardlessPaymentUrl, buildStripePaymentUrl } from '~/core/constants/externalUrls'
import {
  payablePaymentStatusMapping,
  paymentStatusMapping,
} from '~/core/constants/statusInvoiceMapping'
import {
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CREATE_INVOICE_PAYMENT_ROUTE,
  CREATE_PAYMENT_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  PAYMENTS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime, TimeFormat } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  PaymentTypeEnum,
  ProviderTypeEnum,
  useGetPaymentDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import useDownloadPaymentReceipts from '~/hooks/paymentReceipts/useDownloadPaymentReceipts'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  fragment InvoiceForPaymentDetails on Invoice {
    id
    status
    paymentStatus
    number
    totalAmountCents
    issuingDate
    currency
    paymentOverdue
    totalPaidAmountCents
    paymentDisputeLostAt
  }

  query GetPaymentDetails($id: ID!) {
    payment(id: $id) {
      id
      amountCents
      amountCurrency
      createdAt
      updatedAt
      reference
      paymentType
      paymentProviderType
      payablePaymentStatus
      providerPaymentId
      customer {
        deletedAt
        id
        name
        displayName
        applicableTimezone
      }
      payable {
        ... on Invoice {
          id
          payableType
          ...InvoiceForPaymentDetails
        }
        ... on PaymentRequest {
          id
          payableType
          invoices {
            ...InvoiceForPaymentDetails
          }
        }
      }
      paymentReceipt {
        id
      }
    }
  }
`

const Loading = () => {
  return (
    <div className="flex flex-row gap-8">
      <div className="flex w-full flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={`key-skeleton-line-${i}`} className="flex flex-row gap-x-3">
            <div className="min-w-35">
              <Skeleton variant="text" className="w-28" />
            </div>
            <Skeleton variant="text" className="w-60" />
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={`key-skeleton-line-${i}`} className="flex flex-row gap-x-3">
            <div className="min-w-35">
              <Skeleton variant="text" className="w-24" />
            </div>
            <Skeleton variant="text" className="w-60" />
          </div>
        ))}
      </div>
    </div>
  )
}

const InfoLine = ({
  label,
  value,
  isBold,
}: {
  label: string
  value: string | ReactNode
  isBold?: boolean
}) => (
  <div className="flex items-center gap-3 align-baseline [&>a>*]:text-inherit [&>a]:text-blue-600">
    <Typography variant={isBold ? 'captionHl' : 'caption'} noWrap className="min-w-35">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="body" color="grey700" forceBreak>
        {value}
      </Typography>
    ) : (
      value
    )}
  </div>
)

const PaymentDetails = () => {
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const { timezone } = useOrganizationInfos()
  const { customerId, paymentId } = useParams()
  const { goBack } = useLocationHistory()

  const { data = {}, loading } = useGetPaymentDetailsQuery({
    variables: {
      id: paymentId as string,
    },
  })

  const payment = data.payment
  const customer = payment?.customer
  const payable = payment?.payable
  const payableInvoice = payable?.__typename === 'Invoice' && [payable]
  const requestPaymentInvoices = payable?.__typename === 'PaymentRequest' && payable?.invoices
  const invoices = payableInvoice || requestPaymentInvoices || []

  const { canDownloadPaymentReceipts, downloadPaymentReceipts } = useDownloadPaymentReceipts()

  const goToPreviousRoute = useCallback(
    () =>
      goBack(
        !!customerId
          ? generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
              customerId: customerId as string,
              tab: CustomerDetailsTabsOptions.payments,
            })
          : generatePath(PAYMENTS_ROUTE),
        {
          exclude: [CREATE_PAYMENT_ROUTE, CREATE_INVOICE_PAYMENT_ROUTE],
        },
      ),
    [customerId, goBack],
  )

  const paymentFormattedDate = (dateString: string) => {
    const formattedDate = intlFormatDateTime(dateString, {
      timezone: customer?.applicableTimezone,
      formatTime: TimeFormat.TIME_24_SIMPLE,
    })

    return `${formattedDate.date} ${formattedDate.time} ${formattedDate.timezone}`
  }

  return (
    <div>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button icon="arrow-left" variant="quaternary" onClick={goToPreviousRoute} />
          {loading ? (
            <Skeleton variant="text" className="w-40" />
          ) : (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="coupon-details-name"
            >
              {payment?.id}
            </Typography>
          )}
        </PageHeader.Group>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down" data-test="coupon-details-actions">
              {translate('text_626162c62f790600f850b6fe')}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  if (!payment?.id) return

                  copyToClipboard(payment.id)
                  addToast({
                    severity: 'info',
                    translateKey: translate('text_17370296250897n2pakp5v33'),
                  })
                  closePopper()
                }}
              >
                {translate('text_1737029625089rtcf3ah5khq')}
              </Button>

              {canDownloadPaymentReceipts && (
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={!payment?.paymentReceipt?.id}
                  onClick={() => {
                    downloadPaymentReceipts({
                      paymentReceiptId: payment?.paymentReceipt?.id,
                    })

                    closePopper()
                  }}
                >
                  {translate('text_1741334392622fl3ozwejrul')}
                </Button>
              )}
            </MenuPopper>
          )}
        </Popper>
      </PageHeader.Wrapper>

      <div className="flex flex-col gap-12 px-12 pb-20 pt-8">
        <div className="flex items-center gap-4">
          <Avatar variant="connector" size="large">
            <Icon name="coin-dollar" color="dark" size="large" />
          </Avatar>
          <div>
            <div className="flex flex-row items-center gap-2">
              {loading ? (
                <Skeleton variant="text" className="w-60" />
              ) : (
                <Typography variant="headline" color="grey700" noWrap>
                  {intlFormatNumber(
                    deserializeAmount(
                      payment?.amountCents,
                      payment?.amountCurrency || CurrencyEnum.Usd,
                    ),
                    {
                      currency: payment?.amountCurrency,
                    },
                  )}
                </Typography>
              )}
              {payment?.payablePaymentStatus && (
                <Status
                  {...payablePaymentStatusMapping({
                    payablePaymentStatus: payment?.payablePaymentStatus,
                  })}
                />
              )}
            </div>

            {loading ? (
              <Skeleton variant="text" className="w-30" />
            ) : (
              <Typography variant="body" color="grey600" noWrap>
                {payment?.id}
              </Typography>
            )}
          </div>
        </div>

        <div className="pb-12 shadow-b">
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="subhead1">{translate('text_634687079be251fdb43833b7')}</Typography>

            {canDownloadPaymentReceipts && (
              <Button
                variant="quaternary"
                align="left"
                disabled={!payment?.paymentReceipt?.id}
                onClick={() => {
                  downloadPaymentReceipts({
                    paymentReceiptId: payment?.paymentReceipt?.id,
                  })
                }}
              >
                {translate('text_1741334392622fl3ozwejrul')}
              </Button>
            )}
          </div>

          {loading && <Loading />}
          {!loading && (
            <div className="flex flex-row gap-8">
              <div className="flex flex-1 flex-col gap-3">
                <InfoLine
                  label={translate('text_634687079be251fdb43833cb')}
                  value={
                    <ConditionalWrapper
                      condition={!!customer?.deletedAt || !hasPermissions(['customersView'])}
                      validWrapper={(children) => <>{children}</>}
                      invalidWrapper={(children) => {
                        return !!customerId || customer?.id ? (
                          <Link
                            to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                              customerId: (customerId || customer?.id) as string,
                            })}
                          >
                            {children}
                          </Link>
                        ) : (
                          <>{children}</>
                        )
                      }}
                    >
                      <Typography variant="body" color="grey700" forceBreak>
                        {customer?.displayName || customer?.name}
                      </Typography>
                    </ConditionalWrapper>
                  }
                />
                <InfoLine
                  label={translate('text_65a6b4e2cb38d9b70ec53d83')}
                  value={intlFormatNumber(
                    deserializeAmount(
                      payment?.amountCents,
                      payment?.amountCurrency || CurrencyEnum.Usd,
                    ),
                    {
                      currency: payment?.amountCurrency,
                    },
                  )}
                />
                <InfoLine
                  label={translate('text_62442e40cea25600b0b6d858')}
                  value={paymentFormattedDate(payment?.createdAt)}
                />
                <InfoLine
                  label={translate('text_1737043149535dhigi301msf')}
                  value={paymentFormattedDate(payment?.updatedAt)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <InfoLine
                  isBold
                  label={translate('text_1737043182491927uocp2ydo')}
                  value={
                    <PaymentProviderChip
                      paymentProvider={
                        payment?.paymentType === PaymentTypeEnum.Manual
                          ? 'manual_long'
                          : (payment?.paymentProviderType ?? undefined)
                      }
                    />
                  }
                />
                <InfoLine
                  label={translate('text_1737112054603c6phsbkyvmx')}
                  value={
                    <ConditionalWrapper
                      condition={!!payment?.providerPaymentId}
                      validWrapper={(children) => {
                        if (
                          payment?.providerPaymentId &&
                          payment?.paymentProviderType &&
                          [ProviderTypeEnum.Stripe, ProviderTypeEnum.Gocardless].includes(
                            payment.paymentProviderType,
                          )
                        ) {
                          const href =
                            payment?.paymentProviderType === ProviderTypeEnum.Stripe
                              ? buildStripePaymentUrl(payment.providerPaymentId)
                              : buildGoCardlessPaymentUrl(payment.providerPaymentId)

                          // If the payment has a providerPaymentId, it means it was created by a payment provider
                          return (
                            <Link
                              target="_blank"
                              rel="noopener noreferrer"
                              to={href}
                              className="w-fit !shadow-none line-break-anywhere hover:no-underline focus:ring-0"
                            >
                              {children}
                            </Link>
                          )
                        }

                        return (
                          <Typography variant="body" color="grey700" forceBreak>
                            {payment?.providerPaymentId}
                          </Typography>
                        )
                      }}
                      invalidWrapper={() => <>{'-'}</>}
                    >
                      <Typography variant="body" color="grey700" forceBreak>
                        {payment?.providerPaymentId ?? payment?.reference}
                        <Icon name="outside" className="mb-1 ml-2" />
                      </Typography>
                    </ConditionalWrapper>
                  }
                />
                <InfoLine
                  label={translate('text_63eba8c65a6c8043feee2a0f')}
                  value={
                    <Status
                      {...payablePaymentStatusMapping({
                        payablePaymentStatus: payment?.payablePaymentStatus ?? undefined,
                      })}
                    />
                  }
                />
                <InfoLine
                  label={translate('text_17370432002911cyzkxf966v')}
                  value={payment?.reference ?? '-'}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Typography variant="subhead1" className="mb-4">
            {translate('text_63ac86d797f728a87b2f9f85')}
          </Typography>

          <Table
            name={'payment-invoices'}
            data={invoices}
            isLoading={loading}
            containerSize={{
              default: 4,
            }}
            onRowActionLink={({ id }) =>
              generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                customerId: customerId || (customer?.id as string),
                invoiceId: id as string,
                tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
              })
            }
            columns={[
              {
                key: 'paymentStatus',
                title: translate('text_6419c64eace749372fc72b40'),
                content: ({
                  paymentStatus,
                  paymentOverdue,
                  totalAmountCents,
                  totalPaidAmountCents,
                  paymentDisputeLostAt,
                  status,
                }) => {
                  if (status !== InvoiceStatusTypeEnum.Finalized) {
                    return null
                  }

                  let content: { tooltipTitle?: string; statusEndIcon?: IconName } = {
                    tooltipTitle: undefined,
                    statusEndIcon: undefined,
                  }

                  const isOverdue =
                    paymentOverdue && paymentStatus === InvoicePaymentStatusTypeEnum.Pending
                  const isPartiallyPaid =
                    Number(totalPaidAmountCents) > 0 &&
                    Number(totalAmountCents) - Number(totalPaidAmountCents) > 0

                  if (isPartiallyPaid) {
                    content = {
                      tooltipTitle: translate('text_1738071221799vib0l2z1bxe'),
                      statusEndIcon: 'partially-filled',
                    }
                  } else if (!!paymentDisputeLostAt) {
                    content = {
                      tooltipTitle: translate('text_172416478461328edo4vwz05'),
                      statusEndIcon: 'warning-unfilled',
                    }
                  }

                  return (
                    <Tooltip placement="top" title={content.tooltipTitle}>
                      <Status
                        {...(isOverdue
                          ? {
                              type: StatusType.danger,
                              label: 'overdue',
                            }
                          : paymentStatusMapping({
                              status,
                              paymentStatus,
                              totalPaidAmountCents,
                              totalAmountCents,
                            }))}
                        endIcon={content.statusEndIcon}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                key: 'number',
                title: translate('text_64188b3d9735d5007d71226c'),
                maxSpace: true,
                content: ({ number }) => number,
              },
              {
                key: 'totalAmountCents',
                title: translate('text_6419c64eace749372fc72b3e'),
                content: ({ totalAmountCents, currency }) => (
                  <Typography variant="bodyHl" color="grey700">
                    {intlFormatNumber(
                      deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd),
                      {
                        currency: currency || CurrencyEnum.Usd,
                      },
                    )}
                  </Typography>
                ),
              },
              {
                key: 'issuingDate',
                title: translate('text_6419c64eace749372fc72b39'),
                content: ({ issuingDate }) => intlFormatDateTime(issuingDate, { timezone }).date,
              },
            ]}
            placeholder={{
              emptyState: {
                title: translate('text_63b578e959c1366df5d14569'),
                subtitle: translate('text_62bb102b66ff57dbfe7905c2'),
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default PaymentDetails
