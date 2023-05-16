import React, { memo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { CreditNote, CreditNoteItem, CurrencyEnum, FeeTypesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

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
        tax {
          id
          name
          rate
        }
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
          itemName
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
                const creditNoteDisplayName = !!subscription
                  ? subscription?.name || subscription?.plan?.name
                  : translate('text_649ab559e86bd6005ba9d725')

                return (
                  <React.Fragment key={`formatedCreditNote-${i}-subscriptionItem-${j}`}>
                    <table>
                      <thead>
                        <tr>
                          <InlineTh>
                            <Typography
                              variant="bodyHl"
                              color="grey500"
                              html={translate('text_637cd81348c50c26dd05a767', {
                                link: generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                                  id: customerId,
                                  invoiceId,
                                  creditNoteId: creditNote.id,
                                }),
                                CreditNoteNumber: creditNote.number,
                                displayName: creditNoteDisplayName,
                              })}
                              noWrap
                            />
                          </InlineTh>
                          <th>
                            <Typography variant="bodyHl" color="grey500">
                              {translate('text_636bedf292786b19d3398f06')}
                            </Typography>
                          </th>
                          <th>
                            <Typography variant="bodyHl" color="grey500">
                              {translate('text_637cd81348c50c26dd05a769')}
                            </Typography>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {subscriptionItem?.map((charge, k) => {
                          const groupDimension = charge[0]?.fee?.group
                            ? charge[0].fee.group?.key
                              ? 2
                              : 1
                            : 0

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
                                        <Typography variant="body" color="grey700">
                                          {groupDimension === 0 ? (
                                            <>
                                              {item?.fee?.feeType === FeeTypesEnum.AddOn
                                                ? translate('text_6388baa2e514213fed583611', {
                                                    name: item?.fee?.itemName,
                                                  })
                                                : `${
                                                    item.fee.charge?.billableMetric.name ||
                                                    creditNoteDisplayName
                                                  }${
                                                    item?.fee?.trueUpParentFee?.id
                                                      ? ` - ${translate(
                                                          'text_64463aaa34904c00a23be4f7'
                                                        )}`
                                                      : ''
                                                  }`}
                                            </>
                                          ) : (
                                            <>
                                              <span>
                                                {groupDimension === 2 &&
                                                  `${
                                                    item.fee.charge?.billableMetric?.name
                                                      ? `${item.fee.charge?.billableMetric?.name} • `
                                                      : ''
                                                  } ${item.fee.group?.key} • `}
                                              </span>
                                              <span>{item.fee.group?.value}</span>
                                            </>
                                          )}
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
                                                    }
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
                                              item.amountCurrency
                                            ) || 0,
                                            {
                                              currencyDisplay: 'symbol',
                                              currency: item.amountCurrency,
                                            }
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
                              creditNote?.currency || CurrencyEnum.Usd
                            ),
                            {
                              currencyDisplay: 'symbol',
                              currency: creditNote?.currency || CurrencyEnum.Usd,
                            }
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
                            creditNote?.currency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          }
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
                              {`${appliedTax.tax.name} (${intlFormatNumber(
                                appliedTax.tax.rate / 100 || 0,
                                {
                                  maximumFractionDigits: 2,
                                  style: 'percent',
                                }
                              )})`}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="body" color="success600">
                              -
                              {intlFormatNumber(
                                deserializeAmount(
                                  appliedTax.amountCents || 0,
                                  creditNote?.currency || CurrencyEnum.Usd
                                ),
                                {
                                  currencyDisplay: 'symbol',
                                  currency: creditNote?.currency || CurrencyEnum.Usd,
                                }
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
                            creditNote?.currency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          }
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
  }
)

InvoiceCreditNotesTable.displayName = 'InvoiceCreditNotesTable'

const Wrapper = styled.section`
  > table {
    width: 100%;
    border-collapse: collapse;

    > thead > tr > th,
    > tbody > tr > td {
      &:nth-child(1) {
        width: 70%;
      }
      &:nth-child(2) {
        width: 10%;
      }
      &:nth-child(3) {
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

      &:first-child {
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

    > thead > tr {
      height: ${NAV_HEIGHT}px;
      box-shadow: ${theme.shadows[7]};
    }

    > thead > tr > th {
      height: ${NAV_HEIGHT}px;
      box-sizing: border-box;
      padding: ${theme.spacing(8)} 0 ${theme.spacing(3)} 0;
    }

    > tbody > tr > td {
      vertical-align: top;
      min-height: 44px;
      padding: ${theme.spacing(3)} 0;
      box-shadow: ${theme.shadows[7]};
    }
  }
`

const InlineTh = styled.th`
  display: flex;
  align-items: center;
`
