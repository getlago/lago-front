import React, { useRef } from 'react'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'
import { useParams, generatePath } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import {
  Typography,
  Button,
  Skeleton,
  Popper,
  ButtonLink,
  Avatar,
  Icon,
  Status,
  StatusEnum,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTES_LIST_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
} from '~/core/router'
import {
  CreditNoteCreditStatusEnum,
  CreditNoteItem,
  CreditNoteRefundStatusEnum,
  CurrencyEnum,
  useDownloadCreditNoteMutation,
  useGetCreditNoteQuery,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme, PageHeader, MenuPopper, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import { SectionHeader } from '~/styles/customer'

import { CustomerDetailsTabsOptions } from './CustomerDetails'

gql`
  query getCreditNote($id: ID!) {
    creditNote(id: $id) {
      id
      canBeVoided
      createdAt
      creditAmountCents
      creditAmountCurrency
      creditStatus
      number
      refundAmountCents
      refundedAt
      refundStatus
      subTotalVatExcludedAmountCents
      subTotalVatExcludedAmountCurrency
      totalAmountCents
      totalAmountCurrency
      vatAmountCents
      vatAmountCurrency
      customer {
        id
        name
      }
      invoice {
        id
        number
      }
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

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }
`

const creditedMapStatus = (type?: CreditNoteCreditStatusEnum | null | undefined) => {
  switch (type) {
    case CreditNoteCreditStatusEnum.Consumed:
      return {
        type: StatusEnum.error,
        label: 'text_6376641a2a9c70fff5bddcd1',
      }
    case CreditNoteCreditStatusEnum.Voided:
      return {
        type: StatusEnum.error,
        label: 'text_6376641a2a9c70fff5bddcd5',
      }
    default:
      return {
        type: StatusEnum.running,
        label: 'text_637655cb50f04bf1c8379d0c',
      }
  }
}

const consumedMapStatus = (type?: CreditNoteRefundStatusEnum | null | undefined) => {
  switch (type) {
    case CreditNoteRefundStatusEnum.Succeeded:
      return {
        type: StatusEnum.running,
        label: 'text_637656ef3d876b0269edc79d',
      }
    case CreditNoteRefundStatusEnum.Failed:
      return {
        type: StatusEnum.failed,
        label: 'text_637656ef3d876b0269edc7a1',
      }
    default:
      return {
        type: StatusEnum.paused,
        label: 'text_637656ef3d876b0269edc799',
      }
  }
}

const CreditNoteDetails = () => {
  const { translate } = useInternationalization()
  const { id: customerId, invoiceId, creditNoteId } = useParams()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const [downloadCreditNote, { loading: loadingInvoiceDownload }] = useDownloadCreditNoteMutation({
    onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
      const fileUrl = downloadCreditNoteData?.fileUrl

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

  const { data, loading, error } = useGetCreditNoteQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId,
  })
  const creditNote = data?.creditNote
  const creditedFormattedStatus = creditedMapStatus(creditNote?.creditStatus)
  const consumedFormattedStatus = consumedMapStatus(creditNote?.refundStatus)
  const isRefunded = creditNote?.refundAmountCents > 0
  const status = isRefunded ? consumedFormattedStatus : creditedFormattedStatus
  const hasError = (!!error || !creditNote) && !loading

  const groupedData = formatCreditNotesItems(creditNote?.items as CreditNoteItem[])

  return (
    <>
      <PageHeader $withSide>
        <HeaderLeft>
          <ButtonLink
            to={
              !!invoiceId
                ? generatePath(CUSTOMER_INVOICE_CREDIT_NOTES_LIST_ROUTE, {
                    id: customerId,
                    invoiceId,
                  })
                : generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                    id: customerId,
                    tab: CustomerDetailsTabsOptions.creditNotes,
                  })
            }
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {creditNote?.number}
            </Typography>
          )}
        </HeaderLeft>

        {!hasError && !loading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_637655cb50f04bf1c8379ce8')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={!!loadingInvoiceDownload}
                  onClick={async () => {
                    await downloadCreditNote({
                      variables: { input: { id: creditNote?.id || '' } },
                    })
                    closePopper()
                  }}
                >
                  {translate('text_637655cb50f04bf1c8379cea')}
                </Button>
                {creditNote?.canBeVoided && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={async () => {
                      voidCreditNoteDialogRef.current?.openDialog({
                        id: creditNote?.id,
                        totalAmountCents: creditNote?.totalAmountCents,
                        totalAmountCurrency: creditNote?.totalAmountCurrency,
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_637655cb50f04bf1c8379cec')}
                  </Button>
                )}
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigator.clipboard.writeText(creditNote?.id || '')
                    addToast({
                      severity: 'info',
                      translateKey: 'text_63766b1c4eeb35667c48f26d',
                    })
                    closePopper()
                  }}
                >
                  {translate('text_637655cb50f04bf1c8379cee')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader>
      {hasError ? (
        <GenericPlaceholder
          title={translate('text_634812d6f16b31ce5cbf4111')}
          subtitle={translate('text_634812d6f16b31ce5cbf411f')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <Content>
          {loading ? (
            <MainInfos>
              <Skeleton variant="connectorAvatar" size="large" />
              <div>
                <Skeleton variant="text" height={12} width={200} marginBottom={theme.spacing(5)} />
                <Skeleton variant="text" height={12} width={128} />
              </div>
            </MainInfos>
          ) : (
            <MainInfos>
              <ConnectorAvatar variant="connector">
                <Icon name="document" color="dark" size="large" />
              </ConnectorAvatar>
              <div>
                <MainInfoLine>
                  <Typography variant="headline" color="grey700">
                    {creditNote?.number}
                  </Typography>
                  <Status
                    type={status.type}
                    label={translate(status.label, {
                      date: DateTime.fromISO(creditNote?.refundedAt).toFormat('LLL. dd, yyyy'),
                    })}
                  />
                </MainInfoLine>
                <MainInfoLine>
                  <InlineTripleTypography variant="body" color="grey600">
                    <span>
                      {translate('text_637655cb50f04bf1c8379cf2', {
                        amount: intlFormatNumber(creditNote?.totalAmountCents || 0, {
                          currencyDisplay: 'symbol',
                          currency: creditNote?.totalAmountCurrency || CurrencyEnum.Usd,
                        }),
                      })}
                    </span>
                    <span>•</span>
                    <span>{creditNote?.id}</span>
                  </InlineTripleTypography>
                </MainInfoLine>
              </div>
            </MainInfos>
          )}
          <>
            <SectionHeader variant="subhead">
              {translate('text_637655cb50f04bf1c8379cfa')}
              {!hasError && !loading && (
                <Button
                  variant="quaternary"
                  disabled={loadingInvoiceDownload}
                  onClick={async () => {
                    await downloadCreditNote({
                      variables: { input: { id: creditNoteId || '' } },
                    })
                  }}
                >
                  {translate('text_637655cb50f04bf1c8379cf8')}
                </Button>
              )}
            </SectionHeader>

            {!!loading && !error ? (
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
              <InfoSection>
                <div>
                  {creditNote?.customer?.name && (
                    <>
                      <InfoLine>
                        <Typography variant="caption" color="grey600" noWrap>
                          {translate('text_637655cb50f04bf1c8379cfe')}
                        </Typography>
                        <Link
                          to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                            id: creditNote?.customer?.id,
                          })}
                        >
                          <Typography variant="body" color="grey700">
                            {creditNote?.customer?.name}
                          </Typography>
                        </Link>
                      </InfoLine>
                      {creditNote?.invoice?.number && (
                        <InfoLine>
                          <Typography variant="caption" color="grey600" noWrap>
                            {translate('text_637655cb50f04bf1c8379d02')}
                          </Typography>
                          <Link
                            to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                              id: creditNote?.customer?.id,
                              invoiceId: creditNote?.invoice.id,
                            })}
                          >
                            <Typography variant="body" color="grey700">
                              {creditNote?.invoice?.number}
                            </Typography>
                          </Link>
                        </InfoLine>
                      )}
                    </>
                  )}
                  {creditNote?.createdAt && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_637655cb50f04bf1c8379d06')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {DateTime.fromISO(creditNote?.createdAt).toFormat('LLL. dd, yyyy')}
                      </Typography>
                    </InfoLine>
                  )}
                </div>
                <div>
                  {!isRefunded && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_637655cb50f04bf1c8379d0a')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {intlFormatNumber(creditNote?.creditAmountCents || 0, {
                          currencyDisplay: 'symbol',
                          currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                        })}
                      </Typography>
                    </InfoLine>
                  )}
                  <InfoLine>
                    <Typography variant="caption" color="grey600" noWrap>
                      {isRefunded
                        ? translate('text_637656ef3d876b0269edc79f')
                        : translate('text_637655cb50f04bf1c8379d0e')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      <Status type={status.type} label={translate(status.label)} />
                    </Typography>
                  </InfoLine>
                </div>
              </InfoSection>
            )}

            <TableSection></TableSection>

            <TableSection>
              {groupedData.map((groupSubscriptionItem, i) => {
                const subscription =
                  groupSubscriptionItem[0] && groupSubscriptionItem[0][0]
                    ? groupSubscriptionItem[0][0].fee.subscription
                    : []
                const invoiceDisplayName = !!subscription
                  ? // @ts-ignore
                    subscription?.name || subscription?.plan?.name
                  : ''

                return (
                  <React.Fragment key={`groupSubscriptionItem-${i}`}>
                    <table className="main-table">
                      <thead>
                        <tr>
                          <th>
                            <Typography variant="bodyHl" color="grey500">
                              {invoiceDisplayName}
                            </Typography>
                          </th>
                          <th>
                            <Typography variant="bodyHl" color="grey500">
                              {translate('text_637655cb50f04bf1c8379d12')}
                            </Typography>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupSubscriptionItem.map((charge, j) => {
                          const groupDimension = charge[0].fee.group
                            ? charge[0].fee.group.key
                              ? 2
                              : 1
                            : 0

                          return charge.map((item, k) => {
                            return (
                              <React.Fragment key={`groupSubscriptionItem-${i}-list-item-${k}`}>
                                {groupDimension !== 0 && k === 0 && (
                                  <tr
                                    key={`groupSubscriptionItem-${i}-parent-charge-${j}-item-${k}`}
                                  >
                                    <td>
                                      <Typography variant="body" color="grey700">
                                        {charge[0].fee.charge?.billableMetric.name}
                                      </Typography>
                                    </td>
                                    <td></td>
                                  </tr>
                                )}
                                <tr key={`groupSubscriptionItem-${i}-charge-${j}-item-${k}`}>
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
                    </table>
                  </React.Fragment>
                )
              })}
              {!loading && (
                <table>
                  <tfoot>
                    <tr>
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_637655cb50f04bf1c8379d20')}
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
                          {translate('text_637655cb50f04bf1c8379d24')}
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
                    {!!creditNote?.creditAmountCents && (
                      <tr>
                        <td>
                          <Typography variant="bodyHl" color="grey700">
                            {translate('text_637655cb50f04bf1c8379d28')}
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
                    )}
                    {!!creditNote?.refundAmountCents && (
                      <tr>
                        <td>
                          <Typography variant="bodyHl" color="grey700">
                            {translate('text_637de077dca2f885da839287')}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="body" color="success600">
                            {intlFormatNumber(creditNote?.refundAmountCents || 0, {
                              currencyDisplay: 'symbol',
                              currency: creditNote?.creditAmountCurrency || CurrencyEnum.Usd,
                            })}
                          </Typography>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_637655cb50f04bf1c8379d2c')}
                        </Typography>
                      </td>
                      <td>
                        <Typography variant="body" color="success600">
                          {intlFormatNumber(Number(creditNote?.totalAmountCents) || 0, {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.totalAmountCurrency || CurrencyEnum.Usd,
                          })}
                        </Typography>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </TableSection>
          </>
        </Content>
      )}
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </>
  )
}

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Content = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)} ${theme.spacing(20)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(8)};

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const ConnectorAvatar = styled(Avatar)`
  padding: ${theme.spacing(3)};
`

const MainInfoLine = styled.div`
  display: flex;
  align-items: center;

  &:first-child {
    margin-bottom: ${theme.spacing(1)};
  }

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const InlineTripleTypography = styled(Typography)`
  > span:nth-child(2) {
    margin: 0 ${theme.spacing(2)};
  }
`

const Section = styled.section`
  margin: ${theme.spacing(6)} 0;
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
        width: 70%;
      }
      &:nth-child(2) {
        width: 30%;
      }
    }

    > tfoot > tr > td {
      &:nth-child(2) {
        text-align: right;
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

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

const TD = styled.td<{ $pad?: boolean }>`
  padding-left: ${({ $pad }) => ($pad ? theme.spacing(8) : 0)};
`

export default CreditNoteDetails
