import React, { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Skeleton, Typography } from '~/components/designSystem'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  Customer,
  Invoice,
  InvoiceForDetailsTableFooterFragmentDoc,
  InvoiceSubscription,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import formatInvoiceItemsMap from '~/core/formats/formatInvoiceItemsMap'

import { InvoiceDetailsTableHeader } from './InvoiceDetailsTableHeader'
import { InvoiceDetailsTableFooter } from './InvoiceDetailsTableFooter'

gql`
  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency

    ...InvoiceForDetailsTableFooter

    fees {
      id
      amountCents
      itemName
      units
      feeType
      trueUpFee {
        id
      }
    }
    customer {
      currency
    }
    invoiceSubscriptions {
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
          <table className="main-table">
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
          ({ currentSubscription, invoiceDisplayName, subscriptionFees, remainingFees }, i) => {
            return (
              <React.Fragment key={`invoiceSubscription=${i}`}>
                <table className="main-table">
                  <InvoiceDetailsTableHeader
                    displayName={translate('text_634d631acf4dce7b0127a39a', {
                      invoiceDisplayName,
                    })}
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
                                  <RightSkeleton variant="text" height={12} width={120} />
                                </td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          <>
                            <tr>
                              <PaddedTd $pad={!!fee.isGroupChildFee}>
                                <Typography variant="body" color="grey700">
                                  {fee.displayName}
                                  {!!fee.isTrueUpFee
                                    ? ` - ${translate('text_64463aaa34904c00a23be4f7')}`
                                    : ''}
                                </Typography>
                              </PaddedTd>
                              <PaddedTd $pad={!!fee.isGroupChildFee}>
                                <Typography variant="body" color="grey700">
                                  {fee?.charge?.billableMetric?.aggregationType ===
                                  AggregationTypeEnum.RecurringCountAgg
                                    ? '-'
                                    : `${fee.units}`}
                                </Typography>
                              </PaddedTd>
                              <PaddedTd $pad={!!fee.isGroupChildFee}>
                                {!fee.isGroupParentFee && (
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
                                )}
                              </PaddedTd>
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
  margin-bottom: ${theme.spacing(6)};

  .main-table:not(:first-child) {
    margin-top: ${theme.spacing(10)};
  }

  > table {
    width: 100%;
    border-collapse: collapse;

    > thead > tr > th,
    > tbody > tr > td {
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
      &:nth-child(1) {
        width: 60%;
      }
      &:nth-child(2) {
        width: 30%;
      }
      &:nth-child(3) {
        width: 10%;
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

    > tfoot > tr:first-child > td {
      padding-top: ${theme.spacing(6)};
    }
  }
`

const PaddedTd = styled.td<{ $pad: boolean }>`
  padding-left: ${({ $pad }) => ($pad ? theme.spacing(8) : 0)};
`

const RightSkeleton = styled(Skeleton)`
  float: right;
`
