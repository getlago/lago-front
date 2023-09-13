import { gql } from '@apollo/client'
import React, { memo } from 'react'
import styled from 'styled-components'

import { Skeleton, Typography } from '~/components/designSystem'
import formatInvoiceItemsMap from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  CurrencyEnum,
  Customer,
  Invoice,
  InvoiceForDetailsTableFeeFragmentDoc,
  InvoiceForDetailsTableFooterFragmentDoc,
  InvoiceSubscription,
  InvoiceTypeEnum,
  Subscription,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { InvoiceDetailsTableFeeItem } from './InvoiceDetailsTableFeeItem'
import { InvoiceDetailsTableFooter } from './InvoiceDetailsTableFooter'
import { InvoiceDetailsTableHeader } from './InvoiceDetailsTableHeader'

gql`
  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency
    issuingDate

    ...InvoiceForDetailsTableFee
    ...InvoiceForDetailsTableFooter

    fees {
      id
      amountCents
      itemName
      units
      feeType
      appliedTaxes {
        id
        taxRate
      }
      trueUpFee {
        id
      }
      charge {
        id
        payInAdvance
      }
    }
    customer {
      id
      currency
      applicableTimezone
    }
    invoiceSubscriptions {
      fromDatetime
      toDatetime
      chargesFromDatetime
      chargesToDatetime
      inAdvanceChargesFromDatetime
      inAdvanceChargesToDatetime
      subscription {
        id
        name
        plan {
          id
          name
          interval
          amountCents
          amountCurrency
          invoiceDisplayName
        }
      }
      fees {
        id
        amountCents
        eventsCount
        units
        feeType
        subscription {
          id
          name
          plan {
            id
            name
            invoiceDisplayName
          }
        }

        appliedTaxes {
          id
          taxRate
        }
        trueUpFee {
          id
        }
        trueUpParentFee {
          id
        }
        charge {
          id
          payInAdvance
          billableMetric {
            id
            name
            aggregationType
          }
        }
        group {
          id
          key
          value
        }
      }
    }
  }

  ${InvoiceForDetailsTableFeeFragmentDoc}
  ${InvoiceForDetailsTableFooterFragmentDoc}
`

interface InvoiceDetailsTableProps {
  customer: Customer
  invoice: Invoice
  loading: boolean
}

const getSubscriptionDisplayName = (subscription: Subscription) => {
  if (!!subscription.name) {
    return subscription.name
  } else if (!!subscription.plan?.invoiceDisplayName) {
    return subscription.plan.invoiceDisplayName
  }

  const plan = subscription?.plan
  const planInterval = `${plan?.interval?.charAt(0)?.toUpperCase()}${plan?.interval?.slice(1)}`

  return `${planInterval} - ${plan?.name}`
}

export const InvoiceDetailsTable = memo(
  ({ customer, invoice, loading }: InvoiceDetailsTableProps) => {
    const { translate } = useInternationalization()
    const currency = invoice?.currency || CurrencyEnum.Usd

    if (
      [InvoiceTypeEnum.AddOn, InvoiceTypeEnum.Credit, InvoiceTypeEnum.OneOff].includes(
        invoice.invoiceType
      )
    ) {
      return (
        <Wrapper>
          <table>
            <InvoiceDetailsTableHeader displayName={translate('text_6388b923e514213fed58331c')} />

            <tbody>
              {invoice.fees?.map((fee, i) => (
                <tr key={`fee-${i}`}>
                  <td>
                    <Typography variant="body" color="grey700">
                      {invoice.invoiceType === InvoiceTypeEnum.AddOn
                        ? translate('text_6388baa2e514213fed583611', { name: fee.itemName })
                        : invoice.invoiceType === InvoiceTypeEnum.OneOff
                        ? fee.itemName
                        : translate('text_637ccf8133d2c9a7d11ce6e1')}
                    </Typography>
                  </td>
                  <td>
                    <Typography variant="body" color="grey700">
                      {fee.units}
                    </Typography>
                  </td>
                  <td>
                    <Typography variant="body" color="grey700">
                      {fee.appliedTaxes?.length
                        ? fee.appliedTaxes.map((appliedTaxes) => (
                            <Typography
                              key={`fee-${fee.id}-applied-taxe-${appliedTaxes.id}`}
                              variant="body"
                              color="grey700"
                            >
                              {intlFormatNumber(appliedTaxes.taxRate / 100 || 0, {
                                maximumFractionDigits: 2,
                                style: 'percent',
                              })}
                            </Typography>
                          ))
                        : '0%'}
                    </Typography>
                  </td>
                  <td>
                    <Typography variant="body" color="grey700">
                      {intlFormatNumber(deserializeAmount(fee.amountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency,
                      })}
                    </Typography>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <InvoiceDetailsTableFooter invoice={invoice} loading={loading} />
          </table>
        </Wrapper>
      )
    }

    const formattedInvoiceItemsMap = formatInvoiceItemsMap(
      invoice?.invoiceSubscriptions as InvoiceSubscription[]
    )

    return (
      <Wrapper>
        {formattedInvoiceItemsMap.map(
          (
            {
              invoiceSubscription,
              currentSubscription,
              invoiceDisplayName,
              subscriptionFees,
              feesInArrears,
              feesInAdvance,
            },
            i
          ) => {
            const hasAnySubscriptionFeeUnits = subscriptionFees?.some(
              (fee) => Number(fee.units) > 0
            )
            const hasAnyArrearsFeeUnits = feesInArrears?.some((fee) => Number(fee.units) > 0)
            const hasAnyAdvanceFeeUnits = feesInAdvance?.some((fee) => Number(fee.units) > 0)

            return (
              <React.Fragment key={`invoiceSubscription=${i}`}>
                <table>
                  <InvoiceDetailsTableHeader
                    displayName={translate('text_634d631acf4dce7b0127a39a', {
                      invoiceDisplayName,
                    })}
                    period={
                      hasAnySubscriptionFeeUnits
                        ? translate('text_6499a4e4db5730004703f36b', {
                            from: formatDateToTZ(
                              invoiceSubscription?.fromDatetime,
                              customer?.applicableTimezone,
                              'LLL. dd, yyyy'
                            ),
                            to: formatDateToTZ(
                              invoiceSubscription?.toDatetime,
                              customer?.applicableTimezone,
                              'LLL. dd, yyyy'
                            ),
                          })
                        : !hasAnySubscriptionFeeUnits &&
                          hasAnyArrearsFeeUnits &&
                          feesInArrears.some((r) => r.units === 0) &&
                          !hasAnyAdvanceFeeUnits
                        ? invoiceSubscription?.chargesFromDatetime &&
                          invoiceSubscription?.chargesToDatetime
                          ? translate('text_6499a4e4db5730004703f36b', {
                              from: formatDateToTZ(
                                invoiceSubscription?.chargesFromDatetime,
                                customer?.applicableTimezone,
                                'LLL. dd, yyyy'
                              ),
                              to: formatDateToTZ(
                                invoiceSubscription?.chargesToDatetime,
                                customer?.applicableTimezone,
                                'LLL. dd, yyyy'
                              ),
                            })
                          : translate('text_6499a6209ae0d900826053a7', {
                              date: formatDateToTZ(
                                invoice.issuingDate,
                                customer?.applicableTimezone,
                                'LLL. dd, yyyy'
                              ),
                            })
                        : !hasAnySubscriptionFeeUnits &&
                          !hasAnyArrearsFeeUnits &&
                          !hasAnyAdvanceFeeUnits
                        ? translate('text_6499a4e4db5730004703f36b', {
                            from: formatDateToTZ(
                              invoiceSubscription?.fromDatetime,
                              customer?.applicableTimezone,
                              'LLL. dd, yyyy'
                            ),
                            to: formatDateToTZ(
                              invoiceSubscription?.toDatetime,
                              customer?.applicableTimezone,
                              'LLL. dd, yyyy'
                            ),
                          })
                        : undefined
                    }
                  />
                </table>

                {/* If no positive fees are present in the invoice, display subscription fee placeholder */}
                {!hasAnySubscriptionFeeUnits &&
                  !hasAnyArrearsFeeUnits &&
                  !hasAnyAdvanceFeeUnits && (
                    <table key={`invoiceSubscription-${i}-fee-placeholder`}>
                      <tbody>
                        <tr>
                          <td>
                            <Typography variant="body" color="grey700">
                              {getSubscriptionDisplayName(currentSubscription)}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              0
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              0%
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              {intlFormatNumber(0, {
                                currencyDisplay: 'symbol',
                                currency,
                              })}
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                {subscriptionFees?.map((fee, j) => {
                  return (
                    <table key={`invoiceSubscription-${i}-subscription-fee-${j}`}>
                      <tbody>
                        <tr>
                          <td>
                            <Typography variant="body" color="grey700">
                              {getSubscriptionDisplayName(currentSubscription)}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              1
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              {fee.appliedTaxes?.length
                                ? fee.appliedTaxes.map((appliedTaxes) => (
                                    <Typography
                                      key={`fee-${fee.id}-applied-taxe-${appliedTaxes.id}`}
                                      variant="body"
                                      color="grey700"
                                    >
                                      {intlFormatNumber(appliedTaxes.taxRate / 100 || 0, {
                                        maximumFractionDigits: 2,
                                        style: 'percent',
                                      })}
                                    </Typography>
                                  ))
                                : '0%'}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="grey700">
                              {intlFormatNumber(deserializeAmount(fee.amountCents || 0, currency), {
                                currencyDisplay: 'symbol',
                                currency,
                              })}
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )
                })}
                {((hasAnySubscriptionFeeUnits && hasAnyArrearsFeeUnits) ||
                  feesInArrears.some((r) => r.units !== 0 || !r.isGroupChildFee)) && (
                  <ChargePeriodSeparator variant="caption" color="grey500">
                    {invoiceSubscription?.chargesFromDatetime &&
                    invoiceSubscription?.chargesToDatetime
                      ? translate('text_6499a4e4db5730004703f36b', {
                          from: formatDateToTZ(
                            invoiceSubscription?.chargesFromDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                          to: formatDateToTZ(
                            invoiceSubscription?.chargesToDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                        })
                      : translate('text_6499a6209ae0d900826053a7', {
                          date: formatDateToTZ(
                            invoice.issuingDate,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                        })}
                  </ChargePeriodSeparator>
                )}
                {feesInArrears.map((fee, j) => {
                  if (Number(fee?.units) === 0 && !!fee?.isGroupChildFee) return

                  {
                    !!loading && (
                      <table key={`invoiceSubscription-${i}-fee-${j}`}>
                        <tbody>
                          {[1, 2, 3].map((k) => (
                            <tr key={`invoice-details-loading-${k}`}>
                              <td>
                                <Skeleton variant="text" height={12} width={240} />
                              </td>
                              <td>
                                <RightSkeleton variant="text" height={12} width={80} />
                              </td>
                              <td>
                                <RightSkeleton variant="text" height={12} width={40} />
                              </td>
                              <td>
                                <RightSkeleton variant="text" height={12} width={120} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }

                  return (
                    <InvoiceDetailsTableFeeItem
                      key={`invoiceSubscription-${i}-fee-${fee.id}`}
                      currency={currency}
                      customer={customer}
                      fee={fee}
                      invoiceSubscriptionIndex={i}
                    />
                  )
                })}
                {/* Charge paid in advance */}
                {!!hasAnyAdvanceFeeUnits && (
                  <ChargePeriodSeparator variant="caption" color="grey500">
                    {invoiceSubscription?.inAdvanceChargesFromDatetime &&
                    invoiceSubscription?.inAdvanceChargesToDatetime
                      ? translate('text_6499a4e4db5730004703f36b', {
                          from: formatDateToTZ(
                            invoiceSubscription?.inAdvanceChargesFromDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                          to: formatDateToTZ(
                            invoiceSubscription?.inAdvanceChargesToDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                        })
                      : translate('text_6499a6209ae0d900826053a7', {
                          date: formatDateToTZ(
                            invoice.issuingDate,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy'
                          ),
                        })}
                  </ChargePeriodSeparator>
                )}
                {feesInAdvance.map((fee) => {
                  if (Number(fee?.units) === 0 && !!fee?.isGroupChildFee) return

                  return (
                    <InvoiceDetailsTableFeeItem
                      key={`invoiceSubscription-${i}-fee-${fee.id}`}
                      currency={currency}
                      customer={customer}
                      fee={fee}
                      invoiceSubscriptionIndex={i}
                    />
                  )
                })}
              </React.Fragment>
            )
          }
        )}
        <table id="table">
          <InvoiceDetailsTableFooter invoice={invoice} loading={loading} />
        </table>
      </Wrapper>
    )
  }
)

InvoiceDetailsTable.displayName = 'InvoiceDetailsTable'

const Wrapper = styled.section`
  > table {
    width: 100%;
    border-collapse: collapse;

    > thead > tr > th,
    > tbody > tr > td {
      &:nth-child(1) {
        width: 50%;
      }
      &:nth-child(2) {
        width: 20%;
      }
      &:nth-child(3) {
        width: 10%;
      }
      &:nth-child(4) {
        width: 20%;
      }
    }

    > tfoot > tr > td {
      &:nth-child(1) {
        width: 50%;
      }
      &:nth-child(2) {
        width: 35%;
      }
      &:nth-child(3) {
        width: 15%;
      }
    }

    > tfoot > tr > td {
      &:nth-child(2) {
        text-align: left;
      }
    }

    th:not(:last-child),
    td:not(:last-child) {
      padding-right: ${theme.spacing(3)};
    }

    > thead > tr > th,
    > tbody > tr > td {
      text-align: right;

      &:nth-child(1),
      &:nth-child(2) {
        text-align: left;
      }
    }

    > tfoot > tr > td {
      text-align: right;
      padding: ${theme.spacing(3)} 0;
    }

    > tfoot > tr > td {
      &:nth-child(2),
      &:nth-child(3) {
        box-shadow: ${theme.shadows[7]};
      }
    }

    > thead > tr > th {
      height: ${NAV_HEIGHT}px;
      padding: ${theme.spacing(8)} 0 ${theme.spacing(3)} 0;
      box-sizing: border-box;
      box-shadow: ${theme.shadows[7]};
    }

    > tbody > tr > td {
      vertical-align: top;
      min-height: 44px;
      padding: ${theme.spacing(3)} 0;
      box-shadow: ${theme.shadows[7]};
    }
  }
`

const RightSkeleton = styled(Skeleton)`
  float: right;
`

const ChargePeriodSeparator = styled(Typography)`
  padding: ${theme.spacing(3)} 0;
  box-shadow: ${theme.shadows[7]};
`
