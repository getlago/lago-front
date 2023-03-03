import React, { memo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { CreditNote, CreditNoteItem, CurrencyEnum, FeeTypesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

gql`
  fragment InvoiceForCreditNotesTable on Invoice {
    id
    subTotalVatExcludedAmountCents
    customer {
      id
    }
    creditNotes {
      id
      creditAmountCurrency
      number
      subTotalVatExcludedAmountCents
      subTotalVatExcludedAmountCurrency
      totalAmountCents
      vatAmountCents
      vatAmountCurrency
      items {
        amountCents
        amountCurrency
        fee {
          id
          amountCents
          amountCurrency
          eventsCount
          units
          feeType
          itemName
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
  subTotalVatExcludedAmountCents: number
}

export const InvoiceCreditNotesTable = memo(
  ({
    customerId,
    formatedCreditNotes,
    invoiceId,
    subTotalVatExcludedAmountCents,
  }: InvoiceCreditNotesTableProps) => {
    const { translate } = useInternationalization()

    return (
      <Wrapper>
        {formatedCreditNotes.map((formatedCreditNote, i) => {
          const creditNote = formatedCreditNote.creditNote
          let remainingAmountAfterCreditNote = subTotalVatExcludedAmountCents || 0

          for (let l = 0; l < i + 1; l++) {
            const element = formatedCreditNotes[l]

            remainingAmountAfterCreditNote =
              remainingAmountAfterCreditNote -
              Number(element.creditNote.subTotalVatExcludedAmountCents)
          }

          return (
            <React.Fragment key={`formatedCreditNote-${i}`}>
              {formatedCreditNote?.items.map((subscriptionItem, j) => {
                const subscription = subscriptionItem[0][0]
                  ? subscriptionItem[0][0]?.fee.subscription
                  : undefined
                const creditNoteDisplayName = !!subscription
                  ? subscription?.name || subscription?.plan?.name
                  : ''

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
                              {translate('text_637cd81348c50c26dd05a769')}
                            </Typography>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {subscriptionItem?.map((charge, k) => {
                          const groupDimension = charge[0].fee.group
                            ? charge[0].fee.group.key
                              ? 2
                              : 1
                            : 0

                          return (
                            <React.Fragment
                              key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}`}
                            >
                              {groupDimension !== 0 && (
                                <tr key={`formatedCreditNote-${i}-parent-charge-${j}-item-${k}`}>
                                  <td>
                                    <Typography variant="body" color="grey700">
                                      {charge[k].fee.charge?.billableMetric.name}
                                    </Typography>
                                  </td>
                                  <td></td>
                                </tr>
                              )}
                              {charge.map((item, l) => {
                                return (
                                  <React.Fragment
                                    key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}-item-${l}`}
                                  >
                                    <tr key={`formatedCreditNote-${i}-charge-${j}-item-${k}`}>
                                      <TD $pad={groupDimension > 0}>
                                        <Typography variant="body" color="grey700">
                                          {groupDimension === 0 ? (
                                            <>
                                              {item?.fee?.feeType === FeeTypesEnum.AddOn
                                                ? translate('text_6388baa2e514213fed583611', {
                                                    name: item?.fee?.itemName,
                                                  })
                                                : item.fee.charge?.billableMetric.name ||
                                                  creditNoteDisplayName}
                                            </>
                                          ) : (
                                            <>
                                              <span>
                                                {groupDimension === 2 &&
                                                  `${item.fee.group?.key} • `}
                                              </span>
                                              <span>{item.fee.group?.value}</span>
                                            </>
                                          )}
                                        </Typography>
                                      </TD>
                                      <td>
                                        <Typography variant="body" color="success600">
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
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_637ccf8133d2c9a7d11ce73d')}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="success600">
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.subTotalVatExcludedAmountCents || 0,
                            creditNote?.subTotalVatExcludedAmountCurrency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency:
                              creditNote?.subTotalVatExcludedAmountCurrency || CurrencyEnum.Usd,
                          }
                        )}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_637ccf8133d2c9a7d11ce741')}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="success600">
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.vatAmountCents || 0,
                            creditNote?.creditAmountCurrency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                          }
                        )}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_637ccf8133d2c9a7d11ce745')}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="success600">
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.totalAmountCents || 0,
                            creditNote?.creditAmountCurrency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                          }
                        )}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_637ccf8133d2c9a7d11ce749', {
                          creditNotePrefix: creditNote.number.split('-').at(-1),
                        })}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="body" color="grey700">
                        {intlFormatNumber(
                          deserializeAmount(
                            remainingAmountAfterCreditNote || 0,
                            creditNote?.creditAmountCurrency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
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
  margin-bottom: ${theme.spacing(6)};

  > table {
    width: 100%;
    border-collapse: collapse;

    > thead > tr > th,
    > tbody > tr > td {
      &:nth-child(1) {
        width: 80%;
      }
      &:nth-child(2) {
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

    > thead > tr > th {
      height: ${HEADER_TABLE_HEIGHT}px;
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

const TD = styled.td<{ $pad?: boolean }>`
  padding-left: ${({ $pad }) => ($pad ? theme.spacing(8) : 0)};
`

const InlineTh = styled.th`
  display: flex;
  align-items: center;
`
