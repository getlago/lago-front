import { gql } from '@apollo/client'
import React, { memo } from 'react'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CreditNote, CreditNoteItem, CurrencyEnum, FeeTypesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment InvoiceForCreditNotesTable on Invoice {
    id
    customer {
      id
    }
    creditNotes {
      id
      couponsAdjustmentAmountCents
      number
      subTotalExcludingTaxesAmountCents
      currency
      totalAmountCents
      appliedTaxes {
        id
        amountCents
        baseAmountCents
        taxRate
        taxName
      }
      items {
        amountCents
        amountCurrency
        fee {
          id
          amountCents
          eventsCount
          units
          feeType
          groupedBy
          itemName
          invoiceName
          appliedTaxes {
            id
            tax {
              id
              rate
            }
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
          subscription {
            id
            name
            plan {
              id
              name
              invoiceDisplayName
            }
          }
          chargeFilter {
            invoiceDisplayName
            values
          }
        }
      }
    }
  }
`

interface InvoiceCreditNotesTableProps {
  customerId: string
  invoiceId: string
  formatedCreditNotes: {
    creditNote: CreditNote
    items: CreditNoteItem[][][]
  }[]
}

export const InvoiceCreditNotesTable = memo(
  ({ customerId, formatedCreditNotes, invoiceId }: InvoiceCreditNotesTableProps) => {
    const { translate } = useInternationalization()

    return (
      <Wrapper>
        {formatedCreditNotes.map((formatedCreditNote, i) => {
          const creditNote = formatedCreditNote.creditNote

          return (
            <React.Fragment key={`formatedCreditNote-${i}`}>
              {formatedCreditNote?.items.map((subscriptionItem, j) => {
                const subscription = subscriptionItem[0][0]
                  ? subscriptionItem[0][0]?.fee.subscription
                  : undefined
                const creditNoteDisplayName =
                  subscription?.name ||
                  subscription?.plan.invoiceDisplayName ||
                  subscription?.plan?.name

                return (
                  <React.Fragment key={`formatedCreditNote-${i}-subscriptionItem-${j}`}>
                    <table>
                      <thead>
                        <tr>
                          <th>
                            <Typography
                              variant="captionHl"
                              color="grey600"
                              html={translate('text_659522c816b5850068729025', {
                                link: generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                                  customerId,
                                  invoiceId,
                                  creditNoteId: creditNote.id,
                                }),
                                CreditNoteNumber: creditNote.number,
                              })}
                              noWrap
                            />
                          </th>
                          <th>
                            <Typography variant="captionHl" color="grey600">
                              {translate('text_636bedf292786b19d3398f06')}
                            </Typography>
                          </th>
                          <th>
                            <Typography variant="captionHl" color="grey600">
                              {translate('text_637cd81348c50c26dd05a769')}
                            </Typography>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {subscriptionItem?.map((charge, k) => {
                          return (
                            <React.Fragment
                              key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}`}
                            >
                              {charge.map((item, l) => {
                                return (
                                  <React.Fragment
                                    key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}-item-${l}`}
                                  >
                                    <tr key={`formatedCreditNote-${i}-charge-${j}-item-${k}`}>
                                      <td>
                                        <Typography variant="bodyHl" color="grey700">
                                          {item?.fee?.feeType === FeeTypesEnum.AddOn
                                            ? translate('text_6388baa2e514213fed583611', {
                                                name: item.fee.invoiceName || item?.fee?.itemName,
                                              })
                                            : item?.fee?.feeType === FeeTypesEnum.Commitment
                                              ? item.fee.invoiceName ||
                                                'Minimum commitment - True up'
                                              : composeMultipleValuesWithSepator([
                                                  item.fee?.invoiceName ||
                                                    item.fee.charge?.billableMetric.name ||
                                                    creditNoteDisplayName,
                                                  composeGroupedByDisplayName(item.fee.groupedBy),
                                                  composeChargeFilterDisplayName(
                                                    item.fee.chargeFilter,
                                                  ),
                                                  item?.fee?.trueUpParentFee?.id
                                                    ? ` - ${translate(
                                                        'text_64463aaa34904c00a23be4f7',
                                                      )}`
                                                    : '',
                                                ])}
                                        </Typography>
                                      </td>
                                      <td>
                                        <Typography variant="body" color="grey700">
                                          {item.fee.appliedTaxes?.length
                                            ? item.fee.appliedTaxes?.map((appliedTaxe) => (
                                                <Typography
                                                  key={`fee-${item.fee.id}-applied-taxe-${appliedTaxe.id}`}
                                                  variant="body"
                                                  color="grey700"
                                                >
                                                  {intlFormatNumber(
                                                    appliedTaxe.tax.rate / 100 || 0,
                                                    {
                                                      maximumFractionDigits: 2,
                                                      style: 'percent',
                                                    },
                                                  )}
                                                </Typography>
                                              ))
                                            : '0%'}
                                        </Typography>
                                      </td>
                                      <td>
                                        <Typography variant="body" color="success600">
                                          -
                                          {intlFormatNumber(
                                            deserializeAmount(
                                              item.amountCents,
                                              item.amountCurrency,
                                            ) || 0,
                                            {
                                              currencyDisplay: 'symbol',
                                              currency: item.amountCurrency,
                                            },
                                          )}
                                        </Typography>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                )
                              })}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </React.Fragment>
                )
              })}

              <table>
                <tfoot>
                  {Number(creditNote?.couponsAdjustmentAmountCents || 0) > 0 && (
                    <tr>
                      <td></td>
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_644b9f17623605a945cafdbb')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="grey700">
                          {intlFormatNumber(
                            deserializeAmount(
                              creditNote?.couponsAdjustmentAmountCents || 0,
                              creditNote?.currency || CurrencyEnum.Usd,
                            ),
                            {
                              currencyDisplay: 'symbol',
                              currency: creditNote?.currency || CurrencyEnum.Usd,
                            },
                          )}
                        </Typography>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_637ccf8133d2c9a7d11ce73d')}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="success600">
                        -
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.subTotalExcludingTaxesAmountCents || 0,
                            creditNote?.currency || CurrencyEnum.Usd,
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          },
                        )}
                      </Typography>
                    </td>
                  </tr>
                  {!!creditNote.appliedTaxes?.length ? (
                    <>
                      {creditNote.appliedTaxes.map((appliedTax) => (
                        <tr key={`formatedCreditNote-${i}-applied-tax-${appliedTax.id}`}>
                          <td></td>
                          <td>
                            <Typography variant="bodyHl" color="grey600">
                              {translate('text_64c013a424ce2f00dffb7f4d', {
                                name: appliedTax.taxName,
                                rate: intlFormatNumber(appliedTax.taxRate / 100 || 0, {
                                  maximumFractionDigits: 2,
                                  style: 'percent',
                                }),
                                amount: intlFormatNumber(
                                  deserializeAmount(
                                    appliedTax.baseAmountCents || 0,
                                    creditNote?.currency || CurrencyEnum.Usd,
                                  ),
                                  {
                                    currencyDisplay: 'symbol',
                                    currency: creditNote?.currency || CurrencyEnum.Usd,
                                  },
                                ),
                              })}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="success600">
                              -
                              {intlFormatNumber(
                                deserializeAmount(
                                  appliedTax.amountCents || 0,
                                  creditNote?.currency || CurrencyEnum.Usd,
                                ),
                                {
                                  currencyDisplay: 'symbol',
                                  currency: creditNote?.currency || CurrencyEnum.Usd,
                                },
                              )}
                            </Typography>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td></td>
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_637ccf8133d2c9a7d11ce741')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="success600">
                          -
                          {intlFormatNumber(0, {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          })}
                        </Typography>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_637ccf8133d2c9a7d11ce745')}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="success600">
                        -
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.totalAmountCents || 0,
                            creditNote?.currency || CurrencyEnum.Usd,
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          },
                        )}
                      </Typography>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </React.Fragment>
          )
        })}
      </Wrapper>
    )
  },
)

InvoiceCreditNotesTable.displayName = 'InvoiceCreditNotesTable'

const Wrapper = styled.section`
  > table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    > thead > tr > th,
    > tbody > tr > td {
      overflow: hidden;
      text-align: right;

      &:not(:first-child) {
        line-break: anywhere;
      }

      &:not(:last-child) {
        padding-right: ${theme.spacing(8)};
        box-sizing: border-box;
      }

      &:nth-child(1) {
        width: 75%;
        text-align: left;
      }
      &:nth-child(2) {
        width: 10%;
      }
      &:nth-child(3) {
        width: 15%;
      }
    }

    > thead > tr > th {
      position: sticky;
      top: 72px;
      background-color: ${theme.palette.common.white};
      padding: ${theme.spacing(8)} 0 ${theme.spacing(3)} 0;
      box-sizing: border-box;
      box-shadow: ${theme.shadows[7]};
    }

    > tbody > tr > td {
      vertical-align: top;
      min-height: 44px;
      padding: ${theme.spacing(3)} 0;
      box-sizing: border-box;
      box-shadow: ${theme.shadows[7]};
    }

    > tfoot > tr > td {
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
