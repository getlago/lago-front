import React, { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import _ from 'lodash'

import { Typography } from '~/components/designSystem'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  Customer,
  FeeTypesEnum,
  Invoice,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'

gql`
  fragment InvoiceForDetailsTable on Invoice {
    creditAmountCents
    creditAmountCurrency
    subtotalBeforePrepaidCredits
    totalAmountCents
    totalAmountCurrency
    vatAmountCents
    vatAmountCurrency
    walletTransactionAmountCents
    customer {
      currency
    }
    invoiceSubscriptions {
      subscription {
        id
        name
        subscriptionDate
        periodEndDate
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
`

interface InvoiceDetailsTableProps {
  customer: Customer
  invoice: Invoice
}

export const InvoiceDetailsTable = memo(({ customer, invoice }: InvoiceDetailsTableProps) => {
  const { translate } = useInternationalization()

  return (
    <Wrapper>
      {invoice?.invoiceSubscriptions?.map((invoiceSubscription, i) => {
        const subscription = invoiceSubscription.subscription
        const invoiceDisplayName = !!subscription
          ? subscription?.name || subscription?.plan?.name
          : ''

        return (
          <React.Fragment key={`invoiceSubscription=${i}`}>
            <table className="main-table">
              <thead>
                <tr>
                  <th>
                    <Typography variant="bodyHl" color="grey500">
                      {translate('text_634d631acf4dce7b0127a39a', {
                        invoiceDisplayName,
                      })}
                    </Typography>
                  </th>
                  <th>
                    <Typography variant="bodyHl" color="grey500">
                      {translate('text_634d631acf4dce7b0127a3a0')}
                    </Typography>
                  </th>
                  <th>
                    <Typography variant="bodyHl" color="grey500">
                      {translate('text_634d631acf4dce7b0127a3a6')}
                    </Typography>
                  </th>
                </tr>
              </thead>
            </table>
            {invoiceSubscription.fees
              ?.filter((fee) => fee.feeType === FeeTypesEnum.Subscription)
              .map((fee, j) => {
                const plan = subscription?.plan
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
                            {intlFormatNumber(fee.amountCents || 0, {
                              currencyDisplay: 'symbol',
                              currency: plan?.amountCurrency,
                            })}
                          </Typography>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              })}
            {_.chain(invoiceSubscription.fees)
              ?.filter((fee) => fee.feeType !== FeeTypesEnum.Subscription)
              .groupBy((fee) => fee?.charge?.id)
              .map((fees, j) => {
                const totalAmountCents = fees.reduce(
                  (acc, cur) => (acc += Number(cur.amountCents)),
                  0
                )
                const totalUnits = fees.reduce((acc, cur) => (acc += Number(cur.units)), 0)

                if (totalAmountCents === 0) return

                return (
                  <table key={`invoiceSubscription-${i}-fee-${j}`}>
                    <tbody>
                      <tr>
                        <td>
                          <Typography variant="body" color="grey700">
                            {fees[0]?.charge?.billableMetric.name}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="body" color="grey700">
                            {fees[0]?.charge?.billableMetric?.aggregationType ===
                            AggregationTypeEnum.RecurringCountAgg
                              ? '-'
                              : `${totalUnits}`}
                          </Typography>
                        </td>
                        <td>
                          {fees.length === 1 && (
                            <Typography variant="body" color="grey700">
                              {intlFormatNumber(fees[0].amountCents || 0, {
                                currencyDisplay: 'symbol',
                                currency: customer?.currency || CurrencyEnum.Usd,
                              })}
                            </Typography>
                          )}
                        </td>
                      </tr>
                      {fees.length > 1 &&
                        fees.map((fee, k) => {
                          if (Number(fee.units) === 0) return

                          return (
                            <tr key={`invoiceSubscription-${i}-fee-${j}-charge-${k}`}>
                              <PaddedTd>
                                <Typography variant="body" color="grey700">
                                  <span>{fee.group?.key && `${fee.group?.key} • `}</span>
                                  <span>{fee.group?.value}</span>
                                </Typography>
                              </PaddedTd>
                              <PaddedTd>
                                <Typography variant="body" color="grey700">
                                  {fee?.charge?.billableMetric?.aggregationType ===
                                  AggregationTypeEnum.RecurringCountAgg
                                    ? '-'
                                    : `${fee.units}`}
                                </Typography>
                              </PaddedTd>
                              <PaddedTd>
                                <Typography variant="body" color="grey700">
                                  {intlFormatNumber(fee.amountCents || 0, {
                                    currencyDisplay: 'symbol',
                                    currency: customer?.currency || CurrencyEnum.Usd,
                                  })}
                                </Typography>
                              </PaddedTd>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                )
              })
              .value()}
          </React.Fragment>
        )
      })}
      <table id="table">
        <tfoot>
          {Number(invoice?.creditAmountCents) > 0 && (
            <tr>
              <td></td>
              <td>
                <Typography variant="bodyHl" color="grey600">
                  {translate('text_634687079be251fdb4383473')}
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="success600">
                  {intlFormatNumber(Number(invoice?.creditAmountCents) || 0, {
                    currencyDisplay: 'symbol',
                    currency: invoice?.creditAmountCurrency || CurrencyEnum.Usd,
                  })}
                </Typography>
              </td>
            </tr>
          )}
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey600">
                {translate('text_63514a6f675da7e1c44fc6a9')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(Number(invoice?.subtotalBeforePrepaidCredits) * 100 || 0, {
                  currencyDisplay: 'symbol',
                  currency: customer?.currency || CurrencyEnum.Usd,
                })}
              </Typography>
            </td>
          </tr>
          {Number(invoice?.walletTransactionAmountCents) > 0 && (
            <tr>
              <td></td>
              <td>
                <Typography variant="bodyHl" color="grey600">
                  {translate('text_634687079be251fdb43834a3')}
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="success600">
                  {intlFormatNumber(Number(invoice?.walletTransactionAmountCents) || 0, {
                    currencyDisplay: 'symbol',
                    currency: customer?.currency || CurrencyEnum.Usd,
                  })}
                </Typography>
              </td>
            </tr>
          )}
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey600">
                {translate('text_634687079be251fdb438347f')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(invoice?.vatAmountCents || 0, {
                  currencyDisplay: 'symbol',
                  currency: invoice?.vatAmountCurrency,
                })}
              </Typography>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_634687079be251fdb43834af')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {intlFormatNumber(invoice?.totalAmountCents || 0, {
                  currencyDisplay: 'symbol',
                  currency: invoice?.totalAmountCurrency,
                })}
              </Typography>
            </td>
          </tr>
        </tfoot>
      </table>
    </Wrapper>
  )
})

InvoiceDetailsTable.displayName = 'InvoiceDetailsTable'

const Wrapper = styled.section`
  margin-bottom: ${theme.spacing(6)};

  .main-table:not(:first-child) {
    margin-top: ${theme.spacing(10)};
  }

  > table {
    width: 100%;
    border-collapse: collapse;

    > thead > tr > th,
    > tbody > tr > td,
    > tfoot > tr > td {
      &:nth-child(1) {
        width: 60%;
      }
      &:nth-child(2) {
        width: 20%;
      }
      &:nth-child(3) {
        width: 20%;
      }
    }

    > tfoot > tr > td {
      &:nth-child(2) {
        text-align: left;
      }
    }

    th:not(:last-child),
    td:not(:last-child) {
      padding-right: ${theme.spacing(8)};
    }

    > thead > tr > th,
    > tbody > tr > td {
      text-align: right;

      &:first-child {
        text-align: left;
      }
    }

    > tfoot > tr > td {
      text-align: right;
      padding-bottom: ${theme.spacing(4)};
    }

    > thead > tr {
      height: ${HEADER_TABLE_HEIGHT}px;
      box-shadow: ${theme.shadows[7]};
    }

    > tbody > tr > td {
      height: ${NAV_HEIGHT}px;
      box-shadow: ${theme.shadows[7]};
    }

    > tfoot > tr:first-child > th,
    > tfoot > tr:first-child > td {
      padding-top: ${theme.spacing(6)};
    }
  }
`

const PaddedTd = styled.td`
  padding-left: ${theme.spacing(8)};
`
