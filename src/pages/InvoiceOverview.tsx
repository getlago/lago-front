import React from 'react'
import { generatePath, useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import _ from 'lodash'
import { DateTime } from 'luxon'

import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  AggregationTypeEnum,
  CountryCode,
  CreditNote,
  CreditNoteItem,
  CurrencyEnum,
  FeeTypesEnum,
  useDownloadInvoiceMutation,
  useGetAllInvoiceDetailsQuery,
} from '~/generated/graphql'
import { Typography, Skeleton, Button } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { SectionHeader } from '~/styles/customer'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import CountryCodes from '~/public/countryCode.json'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'

gql`
  query getAllInvoiceDetails($id: ID!) {
    invoice(id: $id) {
      id
      number
      issuingDate
      vatAmountCents
      vatAmountCurrency
      totalAmountCents
      totalAmountCurrency
      walletTransactionAmountCents
      subtotalBeforePrepaidCredits
      creditAmountCents
      creditAmountCurrency
      customer {
        id
        currency
        name
        legalName
        email
        addressLine1
        addressLine2
        state
        country
        city
        zipcode
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
  }

  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }
`

export const InvoiceOverview = () => {
  const { translate } = useInternationalization()
  const { invoiceId } = useParams()
  const { data, loading, error } = useGetAllInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })
  const invoice = data?.invoice
  const customer = invoice?.customer
  const hasError = (!!error || !invoice) && !loading
  const formatedCreditNotes = invoice?.creditNotes?.reduce((acc, cur) => {
    const newItems = formatCreditNotesItems(cur.items as CreditNoteItem[])

    // @ts-ignore
    acc.push({ creditNote: cur, items: newItems })
    return acc
  }, [])

  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      const fileUrl = downloadInvoiceData?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

  if (hasError) {
    return (
      <ErrorPlaceholder
        title={translate('text_634812d6f16b31ce5cbf4126')}
        subtitle={translate('text_634812d6f16b31ce5cbf4128')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <SectionHeader variant="subhead">
        {translate('text_634687079be251fdb43833bf')}
        {!hasError && !loading && (
          <Button
            variant="quaternary"
            disabled={loadingInvoiceDownload}
            onClick={async () => {
              await downloadInvoice({
                variables: { input: { id: invoiceId || '' } },
              })
            }}
          >
            {translate('text_634687079be251fdb43833b9')}
          </Button>
        )}
      </SectionHeader>

      <Content>
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLine key={`key-skeleton-line-${i}`}>
                <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                <Skeleton variant="text" width="38%" height={12} marginRight="11.2%" />
                <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                <Skeleton variant="text" width="38%" height={12} marginRight="9.25%" />
              </SkeletonLine>
            ))}
          </>
        ) : (
          <>
            <InfoSection>
              <div>
                {customer?.name && (
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {translate('text_634687079be251fdb43833cb')}
                    </Typography>
                    <Link
                      to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                        id: customer.id,
                      })}
                    >
                      <Typography variant="body" color="grey700">
                        {customer?.name}
                      </Typography>
                    </Link>
                  </InfoLine>
                )}
                {customer?.legalName && (
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {translate('text_634687079be251fdb43833d7')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {customer?.legalName}
                    </Typography>
                  </InfoLine>
                )}
                {customer?.email && (
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {translate('text_634687079be251fdb43833e3')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {customer?.email}
                    </Typography>
                  </InfoLine>
                )}
                {(customer?.addressLine1 ||
                  customer?.addressLine2 ||
                  customer?.state ||
                  customer?.country ||
                  customer?.city ||
                  customer?.zipcode) && (
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {translate('text_634687079be251fdb43833ef')}
                    </Typography>
                    <div>
                      {customer?.addressLine1 && (
                        <Typography variant="body" color="grey700">
                          {customer?.addressLine1}
                        </Typography>
                      )}
                      {customer?.addressLine2 && (
                        <Typography variant="body" color="grey700">
                          {customer?.addressLine2}
                        </Typography>
                      )}
                      {(customer?.zipcode || customer?.city || customer?.state) && (
                        <Typography variant="body" color="grey700">
                          {customer?.zipcode} {customer?.city} {customer?.state}
                        </Typography>
                      )}
                      {customer?.country && (
                        <Typography variant="body" color="grey700">
                          {CountryCodes[customer?.country as CountryCode]}
                        </Typography>
                      )}
                    </div>
                  </InfoLine>
                )}
              </div>
              <div>
                {data?.invoice?.number && (
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {translate('text_634687079be251fdb43833fb')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {data?.invoice?.number}
                    </Typography>
                  </InfoLine>
                )}
                {data?.invoice?.issuingDate && (
                  <>
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_634687079be251fdb4383407')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {DateTime.fromISO(data?.invoice?.issuingDate).toFormat('LLL. dd, yyyy')}
                      </Typography>
                    </InfoLine>
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_634687079be251fdb4383413')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {DateTime.fromISO(data?.invoice?.issuingDate).toFormat('LLL. dd, yyyy')}
                      </Typography>
                    </InfoLine>
                  </>
                )}
              </div>
            </InfoSection>
            <TableSection>
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
                        {intlFormatNumber(
                          Number(invoice?.subtotalBeforePrepaidCredits) * 100 || 0,
                          {
                            currencyDisplay: 'symbol',
                            currency: customer?.currency || CurrencyEnum.Usd,
                          }
                        )}
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
            </TableSection>
            {!!formatedCreditNotes?.length && (
              <>
                <CreditNotesSection>
                  {formatedCreditNotes.map(
                    (
                      formatedCreditNote: {
                        creditNote: CreditNote
                        items: CreditNoteItem[]
                      },
                      i
                    ) => {
                      const creditNote = formatedCreditNote.creditNote
                      const substractRemainingAmount = (
                        initialValue: number,
                        valueToRemove: number
                      ) => {
                        return initialValue - valueToRemove
                      }
                      let remainingAmountAfterCreditNote = invoice?.totalAmountCents || 0

                      for (let l = 0; l < i + 1; l++) {
                        const element = formatedCreditNotes[l]

                        remainingAmountAfterCreditNote = substractRemainingAmount(
                          remainingAmountAfterCreditNote,
                          // @ts-ignore
                          Number(element.creditNote.creditAmountCents)
                        )
                      }

                      return formatedCreditNote?.items.map((subscriptionItem, j) => {
                        // @ts-ignore
                        const subscription = subscriptionItem[0][0]
                          ? // @ts-ignore
                            subscriptionItem[0][0].fee.subscription
                          : []
                        const creditNoteDisplayName = !!subscription
                          ? // @ts-ignore
                            subscription?.name || subscription?.plan?.name
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
                                        link: generatePath(
                                          CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
                                          {
                                            id: customer?.id,
                                            invoiceId,
                                            creditNoteId: creditNote.id,
                                          }
                                        ),
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
                                {/* @ts-ignore */}
                                {subscriptionItem?.map((charge, k) => {
                                  const groupDimension = charge[0].fee.group
                                    ? charge[0].fee.group.key
                                      ? 2
                                      : 1
                                    : 0

                                  // @ts-ignore
                                  return charge.map((item, l) => {
                                    return (
                                      <React.Fragment
                                        key={`formatedCreditNote-${i}-subscriptionItem-${j}-charge-${k}-item-${l}`}
                                      >
                                        {groupDimension !== 0 && k === 0 && (
                                          <tr
                                            key={`formatedCreditNote-${i}-parent-charge-${j}-item-${k}`}
                                          >
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
                                            creditNote?.subTotalVatExcludedAmountCurrency ||
                                            CurrencyEnum.Usd,
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
                                        currency:
                                          creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
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
                                        currency:
                                          creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                                      })}
                                    </Typography>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </React.Fragment>
                        )
                      })
                    }
                  )}
                </CreditNotesSection>
              </>
            )}
          </>
        )}
      </Content>
    </>
  )
}

InvoiceOverview.displayName = 'InvoiceOverview'

const Content = styled.div`
  padding-top: ${theme.spacing(6)};
`

const ErrorPlaceholder = styled(GenericPlaceholder)`
  padding-top: ${theme.spacing(12)};
`

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

const Section = styled.section`
  margin-bottom: ${theme.spacing(6)};
`

const InfoSection = styled(Section)`
  display: flex;
  > * {
    flex: 1;

    &:not(:last-child) {
      margin-right: ${theme.spacing(8)};
    }
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(4)};

  > div:first-child {
    min-width: 140px;
    margin-top: ${theme.spacing(1)};
  }

  > div:last-child {
    width: 100%;
  }

  > a {
    color: ${theme.palette.primary[600]};

    > * {
      color: inherit;
    }
  }
`

const TableSection = styled(Section)`
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

const CreditNotesSection = styled(Section)`
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

const PaddedTd = styled.td`
  padding-left: ${theme.spacing(8)};
`

const TD = styled.td<{ $pad?: boolean }>`
  padding-left: ${({ $pad }) => ($pad ? theme.spacing(8) : 0)};
`

const InlineTh = styled.th`
  display: flex;
  align-items: center;
`

export default InvoiceOverview
