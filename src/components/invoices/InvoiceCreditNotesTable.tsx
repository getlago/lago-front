import { gql } from '@apollo/client'
import React, { memo } from 'react'
import { generatePath } from 'react-router-dom'

import { CreditNoteTableSection } from '~/components/creditNote/CreditNoteDetailsOverviewTable'
import { Typography } from '~/components/designSystem'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNote,
  CreditNoteItem,
  CurrencyEnum,
  FeeTypesEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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
            taxRate
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
  invoiceType?: InvoiceTypeEnum
}

export const InvoiceCreditNotesTable = memo(
  ({ customerId, formatedCreditNotes, invoiceId, invoiceType }: InvoiceCreditNotesTableProps) => {
    const { translate } = useInternationalization()

    const isPrepaidCreditsInvoice = invoiceType === InvoiceTypeEnum.Credit

    return (
      <CreditNoteTableSection>
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
                    {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
                    <table className="main-table">
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
                          {!isPrepaidCreditsInvoice && (
                            <th>
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_636bedf292786b19d3398f06')}
                              </Typography>
                            </th>
                          )}
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
                                        {invoiceType === InvoiceTypeEnum.Credit ? (
                                          <Typography variant="bodyHl" color="grey700">
                                            {translate('text_1729262241097k3cnpci6p5j')}
                                          </Typography>
                                        ) : (
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
                                        )}
                                      </td>
                                      {!isPrepaidCreditsInvoice && (
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
                                                      appliedTaxe.taxRate / 100 || 0,
                                                      {
                                                        style: 'percent',
                                                      },
                                                    )}
                                                  </Typography>
                                                ))
                                              : '0%'}
                                          </Typography>
                                        </td>
                                      )}
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
                  {!isPrepaidCreditsInvoice &&
                    Number(creditNote?.couponsAdjustmentAmountCents || 0) > 0 && (
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
                  {!isPrepaidCreditsInvoice && (
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
                  )}
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
                    <>
                      {!isPrepaidCreditsInvoice && (
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
                    </>
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
      </CreditNoteTableSection>
    )
  },
)

InvoiceCreditNotesTable.displayName = 'InvoiceCreditNotesTable'
