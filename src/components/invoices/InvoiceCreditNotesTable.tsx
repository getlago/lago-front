import React, { memo } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { CreditNote, CreditNoteItem, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'

gql`
  fragment InvoiceForCreditNotesTable on Invoice {
    id
    totalAmountCents
    customer {
      id
    }
    creditNotes {
      id
      creditAmountCents
      creditAmountCurrency
      number
      subTotalVatExcludedAmountCents
      subTotalVatExcludedAmountCurrency
      vatAmountCents
      vatAmountCurrency
      items {
        amountCents
        fee {
          id
          amountCents
          amountCurrency
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
  totalAmountCents: number
}

export const InvoiceCreditNotesTable = memo(
  ({
    customerId,
    formatedCreditNotes,
    invoiceId,
    totalAmountCents,
  }: InvoiceCreditNotesTableProps) => {
    const { translate } = useInternationalization()

    return (
      <Wrapper>
        {formatedCreditNotes.map((formatedCreditNote, i) => {
          const creditNote = formatedCreditNote.creditNote
          const substractRemainingAmount = (initialValue: number, valueToRemove: number) => {
            return initialValue - valueToRemove
          }
          let remainingAmountAfterCreditNote = totalAmountCents || 0

          for (let l = 0; l < i + 1; l++) {
            const element = formatedCreditNotes[l]

            remainingAmountAfterCreditNote = substractRemainingAmount(
              remainingAmountAfterCreditNote,

              Number(element.creditNote.creditAmountCents)
            )
          }

          return formatedCreditNote?.items.map((subscriptionItem, j) => {
            const subscription = subscriptionItem[0][0]
              ? subscriptionItem[0][0].fee.subscription
              : undefined
            const creditNoteDisplayName = !!subscription
              ? subscription?.name || subscription?.plan?.name
              : ''

            return (
              <React.Fragment key={`formatedCreditNote-${i}-subscriptionItem-${j}`}>
                <table className="main-table">
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

                      return charge.map((item, l) => {
                        return (
                          <React.Fragment
                            key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}-item-${l}`}
                          >
                            {groupDimension !== 0 && k === 0 && (
                              <tr key={`formatedCreditNote-${i}-parent-charge-${j}-item-${k}`}>
                                <td>
                                  <Typography variant="body" color="grey700">
                                    {charge[k].fee.charge?.billableMetric.name}
                                  </Typography>
                                </td>
                                <td></td>
                              </tr>
                            )}
                            <tr key={`formatedCreditNote-${i}-charge-${j}-item-${k}`}>
                              <TD $pad={groupDimension > 0}>
                                <Typography variant="body" color="grey700">
                                  {groupDimension === 0 ? (
                                    item.fee.charge?.billableMetric.name
                                  ) : (
                                    <>
                                      <span>
                                        {groupDimension === 2 && `${item.fee.group?.key} • `}
                                      </span>
                                      <span>{item.fee.group?.value}</span>
                                    </>
                                  )}
                                </Typography>
                              </TD>
                              <td>
                                <Typography variant="body" color="success600">
                                  {intlFormatNumber(item.amountCents || 0, {
                                    currencyDisplay: 'symbol',
                                    currency: item.fee.amountCurrency,
                                  })}
                                </Typography>
                              </td>
                            </tr>
                          </React.Fragment>
                        )
                      })
                    })}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_637ccf8133d2c9a7d11ce73d')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="success600">
                          {intlFormatNumber(
                            Number(creditNote?.subTotalVatExcludedAmountCents) || 0,
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
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_637ccf8133d2c9a7d11ce741')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="success600">
                          {intlFormatNumber(creditNote?.vatAmountCents || 0, {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.vatAmountCurrency || CurrencyEnum.Usd,
                          })}
                        </Typography>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_637ccf8133d2c9a7d11ce745')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="success600">
                          {intlFormatNumber(creditNote?.creditAmountCents || 0, {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                          })}
                        </Typography>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_637ccf8133d2c9a7d11ce749', {
                            creditNotePrefix: creditNote.number.split('-').at(-1),
                          })}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="grey700">
                          {intlFormatNumber(remainingAmountAfterCreditNote || 0, {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                          })}
                        </Typography>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </React.Fragment>
            )
          })
        })}
      </Wrapper>
    )
  }
)

InvoiceCreditNotesTable.displayName = 'InvoiceCreditNotesTable'

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
        width: 80%;
      }
      &:nth-child(2) {
        width: 20%;
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

const TD = styled.td<{ $pad?: boolean }>`
  padding-left: ${({ $pad }) => ($pad ? theme.spacing(8) : 0)};
`

const InlineTh = styled.th`
  display: flex;
  align-items: center;
`
