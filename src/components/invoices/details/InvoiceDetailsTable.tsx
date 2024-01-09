import { gql } from '@apollo/client'
import React, { memo } from 'react'
import styled, { css } from 'styled-components'

import { groupAndFormatFees, TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { formatDateToTZ } from '~/core/timezone'
import {
  CurrencyEnum,
  Customer,
  FeeForInvoiceDetailsTableBodyLineFragmentDoc,
  InvoiceForDetailsTableFooterFragmentDoc,
  InvoiceForDetailsTableFragment,
  InvoiceSubscription,
  InvoiceSubscriptionFormatingFragmentDoc,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { InvoiceDetailsTableBodyLine } from './InvoiceDetailsTableBodyLine'
import { InvoiceDetailsTableFooter } from './InvoiceDetailsTableFooter'
import { InvoiceDetailsTableHeader } from './InvoiceDetailsTableHeader'
import { InvoiceDetailsTablePeriodLine } from './InvoiceDetailsTablePeriodLine'

gql`
  fragment FeeForInvoiceDetailsTable on Fee {
    id
    amountCents
    description
    feeType
    groupName
    invoiceDisplayName
    invoiceName
    itemName
    units
    preciseUnitAmount
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
      invoiceDisplayName
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

    ...FeeForInvoiceDetailsTableBodyLine
  }

  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency
    issuingDate
    versionNumber

    fees {
      id
      ...FeeForInvoiceDetailsTable
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
        subscription {
          id
          name
          plan {
            id
            name
            invoiceDisplayName
          }
        }
        ...FeeForInvoiceDetailsTable
      }

      ...InvoiceSubscriptionFormating
    }

    ...InvoiceForDetailsTableFooter
  }

  ${InvoiceSubscriptionFormatingFragmentDoc}
  ${InvoiceForDetailsTableFooterFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLineFragmentDoc}
`

interface InvoiceDetailsTableProps {
  customer: Customer
  invoice: InvoiceForDetailsTableFragment
}

export const InvoiceDetailsTable = memo(({ customer, invoice }: InvoiceDetailsTableProps) => {
  const { translate } = useInternationalization()
  const currency = invoice?.currency || CurrencyEnum.Usd
  const canHaveUnitPrice = invoice.versionNumber >= 4

  /******************
   * One-off invoice
   ******************/
  if (
    [InvoiceTypeEnum.AddOn, InvoiceTypeEnum.Credit, InvoiceTypeEnum.OneOff].includes(
      invoice.invoiceType,
    )
  ) {
    return (
      <InvoiceWrapper $canHaveUnitPrice={canHaveUnitPrice}>
        <table>
          <InvoiceDetailsTableHeader
            canHaveUnitPrice={canHaveUnitPrice}
            displayName={translate('text_6388b923e514213fed58331c')}
          />
          <tbody>
            {invoice.fees?.map((fee, i) => (
              <InvoiceDetailsTableBodyLine
                canHaveUnitPrice={canHaveUnitPrice}
                key={`one-off-fee-${i}`}
                currency={currency}
                displayName={
                  invoice.invoiceType === InvoiceTypeEnum.AddOn
                    ? translate('text_6388baa2e514213fed583611', { name: fee.itemName })
                    : invoice.invoiceType === InvoiceTypeEnum.OneOff
                      ? fee.invoiceDisplayName || fee.itemName
                      : translate('text_637ccf8133d2c9a7d11ce6e1')
                }
                fee={fee as TExtendedRemainingFee}
              />
            ))}
          </tbody>
          <InvoiceDetailsTableFooter invoice={invoice} />
        </table>
      </InvoiceWrapper>
    )
  }

  const newFormattedInvoiceItemsMap = groupAndFormatFees(
    invoice?.invoiceSubscriptions as InvoiceSubscription[],
  )

  /*********************
   * No fee placeholder
   *********************/
  if (!newFormattedInvoiceItemsMap?.metadata?.hasAnyFeeParsed) {
    return (
      <>
        {Object.entries(newFormattedInvoiceItemsMap.subscriptions).map(
          ([subscriptionId, subscription]) => {
            return (
              <InvoiceWrapper
                $canHaveUnitPrice={canHaveUnitPrice}
                key={`subscription-placeholder-for-${subscriptionId}`}
              >
                <table>
                  <InvoiceDetailsTableHeader
                    canHaveUnitPrice={canHaveUnitPrice}
                    displayName={subscription?.metadata?.subscriptionDisplayName}
                  />
                  <tbody>
                    <InvoiceDetailsTablePeriodLine
                      canHaveUnitPrice={canHaveUnitPrice}
                      period={translate('text_6499a4e4db5730004703f36b', {
                        from: formatDateToTZ(
                          subscription?.metadata?.fromDatetime,
                          customer?.applicableTimezone,
                          'LLL. dd, yyyy',
                        ),
                        to: formatDateToTZ(
                          subscription?.metadata?.toDatetime,
                          customer?.applicableTimezone,
                          'LLL. dd, yyyy',
                        ),
                      })}
                    />

                    <InvoiceDetailsTableBodyLine
                      canHaveUnitPrice={canHaveUnitPrice}
                      displayName={subscription?.metadata?.subscriptionDisplayName}
                      currency={currency}
                      fee={undefined}
                    />
                  </tbody>

                  <InvoiceDetailsTableFooter invoice={invoice} />
                </table>
              </InvoiceWrapper>
            )
          },
        )}
      </>
    )
  }

  /*************
   * Other fees
   *************/
  return (
    <InvoiceWrapper $canHaveUnitPrice={canHaveUnitPrice}>
      <MultipleSubscriptionWrapper>
        {Object.entries(newFormattedInvoiceItemsMap.subscriptions).map(
          ([subscriptionId, subscription]) => {
            return (
              <table key={`subscription-${subscriptionId}`}>
                <InvoiceDetailsTableHeader
                  canHaveUnitPrice={canHaveUnitPrice}
                  displayName={subscription?.metadata?.subscriptionDisplayName}
                />
                <tbody>
                  {/* Arrears */}
                  {subscription.feesInArrears.length > 0 && (
                    <>
                      <InvoiceDetailsTablePeriodLine
                        canHaveUnitPrice={canHaveUnitPrice}
                        period={translate('text_6499a4e4db5730004703f36b', {
                          from: formatDateToTZ(
                            subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                              ? subscription?.metadata?.chargesFromDatetime
                              : subscription?.metadata?.fromDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy',
                          ),
                          to: formatDateToTZ(
                            subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                              ? subscription?.metadata?.chargesToDatetime
                              : subscription?.metadata?.toDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy',
                          ),
                        })}
                      />
                      {subscription.feesInArrears.map((feeInArrear) => {
                        return (
                          <InvoiceDetailsTableBodyLine
                            key={`fee-in-arrears-${feeInArrear.id}`}
                            canHaveUnitPrice={canHaveUnitPrice}
                            displayName={feeInArrear?.metadata?.displayName}
                            currency={currency}
                            fee={feeInArrear}
                          />
                        )
                      })}
                    </>
                  )}
                  {/* Advance */}
                  {subscription.feesInAdvance.length > 0 && (
                    <>
                      <InvoiceDetailsTablePeriodLine
                        canHaveUnitPrice={canHaveUnitPrice}
                        period={translate('text_6499a4e4db5730004703f36b', {
                          from: formatDateToTZ(
                            subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                              ? subscription?.metadata.fromDatetime
                              : subscription?.metadata?.inAdvanceChargesFromDatetime ||
                                  subscription?.metadata?.chargesFromDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy',
                          ),
                          to: formatDateToTZ(
                            subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                              ? subscription?.metadata.toDatetime
                              : subscription?.metadata?.inAdvanceChargesToDatetime ||
                                  subscription?.metadata?.chargesToDatetime,
                            customer?.applicableTimezone,
                            'LLL. dd, yyyy',
                          ),
                        })}
                      />
                      {subscription.feesInAdvance.map((feeInAdvance) => {
                        return (
                          <InvoiceDetailsTableBodyLine
                            key={`fee-in-advance-${feeInAdvance.id}`}
                            canHaveUnitPrice={canHaveUnitPrice}
                            displayName={feeInAdvance?.metadata?.displayName}
                            currency={currency}
                            fee={feeInAdvance}
                          />
                        )
                      })}
                    </>
                  )}
                </tbody>
              </table>
            )
          },
        )}

        {/* Footer */}
        <table>
          <InvoiceDetailsTableFooter invoice={invoice} />
        </table>
      </MultipleSubscriptionWrapper>
    </InvoiceWrapper>
  )
})

InvoiceDetailsTable.displayName = 'InvoiceDetailsTable'

export const InvoiceWrapper = styled.section<{ $canHaveUnitPrice: boolean }>`
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    thead tr th,
    tbody tr td {
      overflow: hidden;
      text-align: right;

      &:not(:first-child) {
        line-break: anywhere;
      }

      &:not(:last-child) {
        padding-right: ${theme.spacing(8)};
        box-sizing: border-box;
      }

      ${({ $canHaveUnitPrice }) =>
        $canHaveUnitPrice
          ? css`
              &:nth-child(1) {
                width: 50%;
                text-align: left;
              }
              &:nth-child(2) {
                width: 10%;
              }
              &:nth-child(3) {
                width: 15%;
              }
              &:nth-child(4) {
                width: 10%;
              }
              &:nth-child(5) {
                width: 15%;
              }
            `
          : css`
              &:nth-child(1) {
                width: 50%;
                text-align: left;
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
            `};
    }

    thead tr th {
      position: sticky;
      top: 72px;
      background-color: ${theme.palette.common.white};
      z-index: 1;
      padding: ${theme.spacing(8)} 0 ${theme.spacing(3)} 0;
      box-sizing: border-box;
      box-shadow: ${theme.shadows[7]};
    }

    tbody tr {
      td {
        vertical-align: top;
        min-height: 44px;
        padding: ${theme.spacing(3)} 0;
        box-sizing: border-box;
        box-shadow: ${theme.shadows[7]};
      }

      &.has-details td {
        min-height: 24px;
        padding: ${theme.spacing(3)} ${theme.spacing(8)} ${theme.spacing(1)} 0;
        box-shadow: none;
      }

      &.details-line td {
        vertical-align: top;
        min-height: 24px;
        padding: ${theme.spacing(1)} ${theme.spacing(8)} ${theme.spacing(1)} ${theme.spacing(4)};
        box-sizing: border-box;
        box-shadow: initial;

        &:last-child {
          padding-right: 0;
        }
      }

      &.subtotal td {
        box-shadow: ${theme.shadows[7]};
        padding: ${theme.spacing(1)} ${theme.spacing(8)} ${theme.spacing(3)} ${theme.spacing(4)};
        &:last-child {
          padding-right: 0;
        }
      }
    }

    tfoot tr td {
      text-align: right;
      padding: ${theme.spacing(3)} 0;
      box-sizing: border-box;

      &:nth-child(1) {
        width: 50%;
      }
      &:nth-child(2) {
        width: 35%;
        text-align: left;
        box-shadow: ${theme.shadows[7]};
      }
      &:nth-child(3) {
        width: 15%;
        box-shadow: ${theme.shadows[7]};
      }
    }
  }
`

const MultipleSubscriptionWrapper = styled.div`
  > table:not(:nth-last-child(2)) {
    margin-bottom: ${theme.spacing(8)};
  }
`
