import React, { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Skeleton, Typography } from '~/components/designSystem'
import {
  CurrencyEnum,
  Customer,
  Invoice,
  InvoiceForDetailsTableFooterFragmentDoc,
  InvoiceSubscription,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import formatInvoiceItemsMap from '~/core/formats/formatInvoiceItemsMap'
import { formatDateToTZ } from '~/core/timezone'

import { InvoiceDetailsTableHeader } from './InvoiceDetailsTableHeader'
import { InvoiceDetailsTableFooter } from './InvoiceDetailsTableFooter'

gql`
  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency
    issuingDate

    ...InvoiceForDetailsTableFooter

    fees {
      id
      amountCents
      itemName
      units
      feeType
      appliedTaxes {
        id
        tax {
          id
          rate
        }
      }
      trueUpFee {
        id
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
      subscription {
        id
        name
        plan {
          id
          name
          interval
          amountCents
          amountCurrency
        }
      }
      fees {
        id
        amountCents
        eventsCount
        units
        feeType
        appliedTaxes {
          id
          tax {
            id
            rate
          }
        }
        trueUpFee {
          id
        }
        trueUpParentFee {
          id
        }
        charge {
          id
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

  ${InvoiceForDetailsTableFooterFragmentDoc}
`

interface InvoiceDetailsTableProps {
  customer: Customer
  invoice: Invoice
  loading: boolean
}

export const InvoiceDetailsTable = memo(
  ({ customer, invoice, loading }: InvoiceDetailsTableProps) => {
    const { translate } = useInternationalization()

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
                              {intlFormatNumber(appliedTaxes.tax.rate / 100 || 0, {
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
                      {intlFormatNumber(
                        deserializeAmount(
                          fee.amountCents || 0,
                          customer?.currency || CurrencyEnum.Usd
                        ),
                        {
                          currencyDisplay: 'symbol',
                          currency: customer?.currency || CurrencyEnum.Usd,
                        }
                      )}
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
              remainingFees,
            },
            i
          ) => {
            const hasAnyPositiveSubscriptionFee = subscriptionFees?.some(
              (fee) => Number(fee.amountCents) > 0
            )
            const hasAnyPositiveRemainingFee = remainingFees?.some(
              (fee) => Number(fee.amountCents) > 0
            )

            return (
              <React.Fragment key={`invoiceSubscription=${i}`}>
                <table>
                  <InvoiceDetailsTableHeader
                    displayName={translate('text_634d631acf4dce7b0127a39a', {
                      invoiceDisplayName,
                    })}
                    period={
                      hasAnyPositiveSubscriptionFee
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
                        : hasAnyPositiveRemainingFee
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
                        : undefined
                    }
                  />
                </table>
                {subscriptionFees?.map((fee, j) => {
                  const plan = currentSubscription?.plan
                  const planInterval = `${plan?.interval
                    ?.charAt(0)
                    ?.toUpperCase()}${plan?.interval?.slice(1)}`

                  return (
                    <table key={`invoiceSubscription-${i}-subscription-fee-${j}`}>
                      <tbody>
                        <tr>
                          <td>
                            <Typography variant="body" color="grey700">
                              {planInterval} - {plan?.name}
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
                                      {intlFormatNumber(appliedTaxes.tax.rate / 100 || 0, {
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
                              {intlFormatNumber(
                                deserializeAmount(fee.amountCents || 0, plan?.amountCurrency),
                                {
                                  currencyDisplay: 'symbol',
                                  currency: plan?.amountCurrency,
                                }
                              )}
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )
                })}
                {hasAnyPositiveSubscriptionFee && hasAnyPositiveRemainingFee && (
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
                {remainingFees.map((fee, j) => {
                  if (Number(fee.units) === 0) return

                  return (
                    <table key={`invoiceSubscription-${i}-fee-${j}`}>
                      <tbody>
                        {loading ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <tr>
                              <td>
                                <Typography variant="body" color="grey700">
                                  {fee.isGroupChildFee && fee.charge?.billableMetric?.name
                                    ? `${fee.charge?.billableMetric?.name} • `
                                    : ''}
                                  {fee.displayName}
                                  {!!fee.isTrueUpFee
                                    ? ` • ${translate('text_64463aaa34904c00a23be4f7')}`
                                    : ''}
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
                                          {intlFormatNumber(appliedTaxes.tax.rate / 100 || 0, {
                                            maximumFractionDigits: 2,
                                            style: 'percent',
                                          })}
                                        </Typography>
                                      ))
                                    : '0%'}
                                </Typography>
                              </td>
                              <td>
                                {
                                  <Typography variant="body" color="grey700">
                                    {intlFormatNumber(
                                      deserializeAmount(
                                        fee.amountCents || 0,
                                        customer?.currency || CurrencyEnum.Usd
                                      ),
                                      {
                                        currencyDisplay: 'symbol',
                                        currency: customer?.currency || CurrencyEnum.Usd,
                                      }
                                    )}
                                  </Typography>
                                }
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
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
