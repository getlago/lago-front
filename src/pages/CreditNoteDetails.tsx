import { gql } from '@apollo/client'
import React, { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import {
  Avatar,
  Button,
  Icon,
  Popper,
  Skeleton,
  Status,
  StatusEnum,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { addToast } from '~/core/apolloClient'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CreditNoteCreditStatusEnum,
  CreditNoteItem,
  CreditNoteRefundStatusEnum,
  CurrencyEnum,
  FeeTypesEnum,
  useDownloadCreditNoteMutation,
  useGetCreditNoteQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

import { CustomerDetailsTabsOptions } from './CustomerDetails'

gql`
  query getCreditNote($id: ID!) {
    creditNote(id: $id) {
      id
      balanceAmountCents
      canBeVoided
      couponsAdjustmentAmountCents
      createdAt
      creditAmountCents
      creditStatus
      currency
      number
      refundAmountCents
      refundedAt
      refundStatus
      subTotalExcludingTaxesAmountCents
      totalAmountCents
      customer {
        id
        name
        deletedAt
        applicableTimezone
      }
      invoice {
        id
        number
      }
      appliedTaxes {
        id
        amountCents
        baseAmountCents
        taxRate
        taxName
      }
      items {
        amountCents
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
  const { goBack } = useLocationHistory()
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
    skip: !creditNoteId || !customerId,
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
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(
                !!invoiceId
                  ? generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                      id: customerId as string,
                      invoiceId,
                      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                    })
                  : generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      id: customerId as string,
                      tab: CustomerDetailsTabsOptions.creditNotes,
                    })
              )
            }
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
                        currency: creditNote?.currency,
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
                    copyToClipboard(creditNote?.id || '')
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
                      date: formatDateToTZ(
                        creditNote?.refundedAt,
                        creditNote?.customer.applicableTimezone
                      ),
                    })}
                  />
                </MainInfoLine>
                <MainInfoLine>
                  <InlineTripleTypography variant="body" color="grey600">
                    <span>
                      {translate('text_637655cb50f04bf1c8379cf2', {
                        amount: intlFormatNumber(
                          deserializeAmount(
                            creditNote?.totalAmountCents || 0,
                            creditNote?.currency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          }
                        ),
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
                        <ConditionalWrapper
                          condition={!!creditNote?.customer.deletedAt}
                          validWrapper={(children) => <>{children}</>}
                          invalidWrapper={(children) => (
                            <Link
                              to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                                id: creditNote?.customer?.id,
                              })}
                            >
                              {children}
                            </Link>
                          )}
                        >
                          <Typography variant="body" color="grey700">
                            {creditNote?.customer?.name}
                          </Typography>
                        </ConditionalWrapper>
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
                              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
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
                        {formatDateToTZ(
                          creditNote?.createdAt,
                          creditNote?.customer.applicableTimezone
                        )}
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
                        {intlFormatNumber(
                          deserializeAmount(
                            creditNote?.balanceAmountCents || 0,
                            creditNote?.currency || CurrencyEnum.Usd
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          }
                        )}
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
                      <Status
                        type={status.type}
                        label={translate(status.label, {
                          date: formatDateToTZ(
                            creditNote?.refundedAt,
                            creditNote?.customer.applicableTimezone
                          ),
                        })}
                      />
                    </Typography>
                  </InfoLine>
                </div>
              </InfoSection>
            )}

            <TableSection>
              {groupedData.map((groupSubscriptionItem, i) => {
                const subscription =
                  groupSubscriptionItem[0] && groupSubscriptionItem[0][0]
                    ? groupSubscriptionItem[0][0].fee.subscription
                    : undefined
                const invoiceDisplayName = !!subscription
                  ? subscription?.name || subscription?.plan?.name
                  : translate('text_6388b923e514213fed58331c')

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
                              {translate('text_636bedf292786b19d3398f06')}
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
                            const isTrueUp = !!item?.fee?.trueUpParentFee?.id

                            return (
                              <React.Fragment key={`groupSubscriptionItem-${i}-list-item-${k}`}>
                                <tr key={`groupSubscriptionItem-${i}-charge-${j}-item-${k}`}>
                                  <td>
                                    <Typography variant="body" color="grey700">
                                      {groupDimension === 0 || !!isTrueUp ? (
                                        <>
                                          {item?.fee?.feeType === FeeTypesEnum.AddOn
                                            ? item?.fee?.itemName
                                            : `${
                                                item?.fee?.charge?.billableMetric.name ||
                                                invoiceDisplayName
                                              }${
                                                item?.fee?.trueUpParentFee?.id
                                                  ? ` • ${translate(
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
                                              }${item.fee.group?.key} • `}
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
                                              {intlFormatNumber(appliedTaxe.tax.rate / 100 || 0, {
                                                maximumFractionDigits: 2,
                                                style: 'percent',
                                              })}
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
                                          item.amountCents || 0,
                                          item.amountCurrency
                                        ),
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
                          {translate('text_637655cb50f04bf1c8379d20')}
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
                    {!!creditNote?.appliedTaxes?.length ? (
                      <>
                        {creditNote?.appliedTaxes.map((appliedTax) => (
                          <tr key={`creditNote-${creditNote.id}-applied-tax-${appliedTax.id}`}>
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
                                      creditNote?.currency || CurrencyEnum.Usd
                                    ),
                                    {
                                      currencyDisplay: 'symbol',
                                      currency: creditNote?.currency || CurrencyEnum.Usd,
                                    }
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
                            {`${translate('text_637655cb50f04bf1c8379d24')} (0%)`}
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

                    {Number(creditNote?.creditAmountCents || 0) > 0 && (
                      <tr>
                        <td></td>
                        <td>
                          <Typography variant="bodyHl" color="grey700">
                            {translate('text_637655cb50f04bf1c8379d28')}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="body" color="success600">
                            -
                            {intlFormatNumber(
                              deserializeAmount(
                                creditNote?.creditAmountCents || 0,
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
                    {Number(creditNote?.refundAmountCents || 0) > 0 && (
                      <tr>
                        <td></td>
                        <td>
                          <Typography variant="bodyHl" color="grey700">
                            {translate('text_637de077dca2f885da839287')}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="body" color="success600">
                            -
                            {intlFormatNumber(
                              deserializeAmount(
                                creditNote?.refundAmountCents || 0,
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
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_637655cb50f04bf1c8379d2c')}
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

const InfoSection = styled.section`
  display: flex;
  padding: ${theme.spacing(6)} 0;
  box-shadow: ${theme.shadows[7]};

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
  margin-bottom: ${theme.spacing(2)};

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

const TableSection = styled.section`
  .main-table:not(:first-child) {
    margin-top: ${theme.spacing(10)};
  }

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

    > thead > tr > th {
      height: ${NAV_HEIGHT}px;
      padding: ${theme.spacing(8)} 0 ${theme.spacing(3)} 0;
      box-sizing: border-box;
      box-shadow: ${theme.shadows[7]};
    }

    > tbody > tr > td {
      vertical-align: top;
      min-height: 44px;
      padding: ${theme.spacing(3)} 0;
      box-shadow: ${theme.shadows[7]};
    }
  }
`

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

export default CreditNoteDetails
