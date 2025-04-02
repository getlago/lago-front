import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import React, { useRef } from 'react'
import { generatePath, Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import CreditNoteBadge from '~/components/creditNote/CreditNoteBadge'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import {
  Button,
  Icon,
  Popper,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import {
  buildAnrokCreditNoteUrl,
  buildNetsuiteCreditNoteUrl,
  buildXeroCreditNoteUrl,
} from '~/core/constants/externalUrls'
import {
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import {
  CreditNote,
  CreditNoteCreditStatusEnum,
  CreditNoteItem,
  CreditNoteRefundStatusEnum,
  CurrencyEnum,
  FeeTypesEnum,
  InvoiceTypeEnum,
  NetsuiteIntegration,
  useDownloadCreditNoteMutation,
  useGetCreditNoteQuery,
  useIntegrationsListForCreditNoteDetailsQuery,
  useRetryTaxReportingMutation,
  useSyncIntegrationCreditNoteMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PageHeader, theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

const { disablePdfGeneration } = envGlobalVar()

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
      integrationSyncable
      taxProviderSyncable
      taxProviderId
      externalIntegrationId
      customer {
        id
        name
        displayName
        deletedAt
        applicableTimezone
        netsuiteCustomer {
          id
          integrationId
        }
        xeroCustomer {
          id
          integrationId
        }
        anrokCustomer {
          id
          integrationId
          externalAccountId
        }
      }
      invoice {
        id
        invoiceType
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
        amountCurrency
        fee {
          id
          amountCents
          eventsCount
          units
          feeType
          itemName
          groupedBy
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

  query integrationsListForCreditNoteDetails($limit: Int) {
    integrations(limit: $limit) {
      collection {
        ... on NetsuiteIntegration {
          __typename
          id
          accountId
          name
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

  mutation syncIntegrationCreditNote($input: SyncIntegrationCreditNoteInput!) {
    syncIntegrationCreditNote(input: $input) {
      creditNoteId
    }
  }

  mutation retryTaxReporting($input: RetryTaxReportingInput!) {
    retryTaxReporting(input: $input) {
      id
    }
  }
`

const creditedMapStatus = (type?: CreditNoteCreditStatusEnum | null | undefined): StatusProps => {
  switch (type) {
    case CreditNoteCreditStatusEnum.Consumed:
      return {
        type: StatusType.danger,
        label: 'consumed',
      }
    case CreditNoteCreditStatusEnum.Voided:
      return {
        type: StatusType.danger,
        label: 'voided',
      }
    default:
      return {
        type: StatusType.success,
        label: 'available',
      }
  }
}

const consumedMapStatus = (type?: CreditNoteRefundStatusEnum | null | undefined): StatusProps => {
  switch (type) {
    case CreditNoteRefundStatusEnum.Succeeded:
      return {
        type: StatusType.success,
        label: 'refunded',
      }
    case CreditNoteRefundStatusEnum.Failed:
      return {
        type: StatusType.warning,
        label: 'failed',
      }
    default:
      return {
        type: StatusType.default,
        label: 'pending',
      }
  }
}

const CreditNoteDetails = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const { customerId, invoiceId, creditNoteId } = useParams()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)

  const [syncIntegrationCreditNote, { loading: loadingSyncIntegrationCreditNote }] =
    useSyncIntegrationCreditNoteMutation({
      variables: { input: { creditNoteId: creditNoteId || '' } },
      onCompleted({ syncIntegrationCreditNote: syncIntegrationCreditNoteResult }) {
        if (syncIntegrationCreditNoteResult?.creditNoteId) {
          addToast({
            severity: 'success',
            translateKey: !!data?.creditNote?.customer.netsuiteCustomer
              ? 'text_6655a88569eed300ee8c4d44'
              : 'text_17268445285571pwim3q27vl',
          })
        }
      },
    })

  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
        handleDownloadFile(downloadCreditNoteData?.fileUrl)
      },
    })

  const [retryTaxReporting] = useRetryTaxReportingMutation({
    onCompleted() {
      addToast({
        severity: 'success',
        translateKey: 'text_1727068261852148l97frl5q',
      })
    },
    refetchQueries: ['getCreditNote'],
  })

  const { data, loading, error } = useGetCreditNoteQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId || !customerId,
  })
  const { data: integrationsData } = useIntegrationsListForCreditNoteDetailsQuery({
    variables: { limit: 1000 },
    skip:
      !data?.creditNote?.customer?.netsuiteCustomer?.integrationId &&
      !data?.creditNote?.customer?.xeroCustomer?.integrationId &&
      !data?.creditNote?.customer?.anrokCustomer?.integrationId,
  })

  const allNetsuiteIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) =>
      integration?.id === data?.creditNote?.customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const creditNote = data?.creditNote
  const creditedFormattedStatus = creditedMapStatus(creditNote?.creditStatus)
  const consumedFormattedStatus = consumedMapStatus(creditNote?.refundStatus)
  const isRefunded = creditNote?.refundAmountCents > 0
  const status = isRefunded ? consumedFormattedStatus : creditedFormattedStatus
  const hasError = (!!error || !creditNote) && !loading

  const groupedData = formatCreditNotesItems(creditNote?.items as CreditNoteItem[])

  const customerName = creditNote?.customer?.displayName

  const isPrepaidCreditsInvoice = data?.creditNote?.invoice?.invoiceType === InvoiceTypeEnum.Credit

  const retryTaxSync = async () => {
    if (!data?.creditNote?.id) return

    await retryTaxReporting({
      variables: {
        input: {
          id: data.creditNote.id,
        },
      },
    })
  }

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(
                !!invoiceId
                  ? generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                      customerId: customerId as string,
                      invoiceId,
                      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                    })
                  : generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.creditNotes,
                    }),
                { exclude: [CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE] },
              )
            }
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {creditNote?.number}
            </Typography>
          )}
        </PageHeader.Group>

        {!hasError && !loading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_637655cb50f04bf1c8379ce8')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                {hasPermissions(['creditNotesView']) && !disablePdfGeneration && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={!!loadingCreditNoteDownload}
                    onClick={async () => {
                      await downloadCreditNote({
                        variables: { input: { id: creditNote?.id || '' } },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_637655cb50f04bf1c8379cea')}
                  </Button>
                )}
                {creditNote?.canBeVoided && hasPermissions(['creditNotesVoid']) && (
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
                {!!data?.creditNote?.integrationSyncable && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={loadingSyncIntegrationCreditNote}
                    onClick={async () => {
                      await syncIntegrationCreditNote()

                      closePopper()
                    }}
                  >
                    {translate(
                      !!data.creditNote.customer.netsuiteCustomer
                        ? 'text_665d742ee9853200e3a6be7f'
                        : 'text_66911d4b4b3c3e005c62ab49',
                    )}
                  </Button>
                )}

                {!!data?.creditNote?.taxProviderSyncable && (
                  <Button
                    variant="quaternary"
                    align="left"
                    disabled={loadingSyncIntegrationCreditNote}
                    onClick={async () => {
                      await retryTaxSync()

                      closePopper()
                    }}
                  >
                    {translate('text_17270681462632d46dh3r1vu')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      {hasError && (
        <GenericPlaceholder
          title={translate('text_634812d6f16b31ce5cbf4111')}
          subtitle={translate('text_634812d6f16b31ce5cbf411f')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      )}

      {!hasError && (
        <>
          <DetailsPage.Header
            className="shadow-none shadow-inherit"
            isLoading={loading}
            icon="document"
            title={
              <div className="flex flex-row gap-2">
                <Typography variant="headline" color="grey700">
                  {creditNote?.number}
                </Typography>

                <CreditNoteBadge creditNote={creditNote as CreditNote} />
              </div>
            }
            description={`${translate('text_637655cb50f04bf1c8379cf2', {
              amount: intlFormatNumber(
                deserializeAmount(
                  creditNote?.totalAmountCents || 0,
                  creditNote?.currency || CurrencyEnum.Usd,
                ),
                {
                  currencyDisplay: 'symbol',
                  currency: creditNote?.currency || CurrencyEnum.Usd,
                },
              ),
            })} • ${creditNote?.id}`}
          />

          <DetailsPage.Container className="max-w-none">
            <div>
              <SectionHeader variant="subhead">
                {translate('text_637655cb50f04bf1c8379cfa')}
                {!hasError &&
                  !loading &&
                  hasPermissions(['creditNotesView']) &&
                  !disablePdfGeneration && (
                    <Button
                      variant="quaternary"
                      disabled={loadingCreditNoteDownload}
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

              <DetailsPage.Overview
                isLoading={loading}
                leftColumn={
                  <>
                    {creditNote?.customer?.name && (
                      <>
                        <DetailsPage.OverviewLine
                          title={translate('text_637655cb50f04bf1c8379cfe')}
                          value={
                            <ConditionalWrapper
                              condition={
                                !!creditNote?.customer.deletedAt &&
                                hasPermissions(['customersView'])
                              }
                              validWrapper={(children) => <>{children}</>}
                              invalidWrapper={(children) => (
                                <Link
                                  className="visited:text-blue"
                                  to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                                    customerId: creditNote?.customer?.id,
                                  })}
                                >
                                  {children}
                                </Link>
                              )}
                            >
                              {customerName}
                            </ConditionalWrapper>
                          }
                        />
                        {creditNote?.invoice?.number && (
                          <DetailsPage.OverviewLine
                            title={translate('text_637655cb50f04bf1c8379d02')}
                            value={
                              <Link
                                className="visited:text-blue"
                                to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                                  customerId: creditNote?.customer?.id,
                                  invoiceId: creditNote?.invoice.id,
                                  tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                                })}
                              >
                                {creditNote?.invoice?.number}
                              </Link>
                            }
                          />
                        )}
                      </>
                    )}
                    {creditNote?.createdAt && (
                      <DetailsPage.OverviewLine
                        title={translate('text_637655cb50f04bf1c8379d06')}
                        value={formatDateToTZ(
                          creditNote?.createdAt,
                          creditNote?.customer.applicableTimezone,
                        )}
                      />
                    )}
                  </>
                }
                rightColumn={
                  <>
                    {!isRefunded && (
                      <DetailsPage.OverviewLine
                        title={translate('text_637655cb50f04bf1c8379d0a')}
                        value={intlFormatNumber(
                          deserializeAmount(
                            creditNote?.balanceAmountCents || 0,
                            creditNote?.currency || CurrencyEnum.Usd,
                          ),
                          {
                            currencyDisplay: 'symbol',
                            currency: creditNote?.currency || CurrencyEnum.Usd,
                          },
                        )}
                      />
                    )}
                    <DetailsPage.OverviewLine
                      title={
                        isRefunded
                          ? translate('text_637656ef3d876b0269edc79f')
                          : translate('text_637655cb50f04bf1c8379d0e')
                      }
                      value={
                        <Status
                          {...status}
                          labelVariables={{
                            date: formatDateToTZ(
                              creditNote?.refundedAt,
                              creditNote?.customer.applicableTimezone,
                            ),
                          }}
                        />
                      }
                    />
                  </>
                }
              />

              <TableSection>
                {groupedData.map((groupSubscriptionItem, i) => {
                  const subscription =
                    groupSubscriptionItem[0] && groupSubscriptionItem[0][0]
                      ? groupSubscriptionItem[0][0].fee.subscription
                      : undefined
                  const invoiceDisplayName = !!subscription
                    ? subscription?.name ||
                      subscription.plan.invoiceDisplayName ||
                      subscription?.plan?.name
                    : translate('text_6388b923e514213fed58331c')

                  return (
                    <React.Fragment key={`groupSubscriptionItem-${i}`}>
                      {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
                      <table className="main-table">
                        <thead>
                          <tr>
                            <th>
                              <Typography variant="captionHl" color="grey600">
                                {invoiceDisplayName}
                              </Typography>
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
                                {translate('text_637655cb50f04bf1c8379d12')}
                              </Typography>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupSubscriptionItem.map((charge, j) => {
                            return charge.map((item, k) => {
                              return (
                                <React.Fragment key={`groupSubscriptionItem-${i}-list-item-${k}`}>
                                  <tr key={`groupSubscriptionItem-${i}-charge-${j}-item-${k}`}>
                                    <td>
                                      {isPrepaidCreditsInvoice ? (
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
                                                    item?.fee?.charge?.billableMetric.name ||
                                                    invoiceDisplayName,
                                                  composeGroupedByDisplayName(item?.fee?.groupedBy),
                                                  composeChargeFilterDisplayName(
                                                    item.fee.chargeFilter,
                                                  ),
                                                  item?.fee?.trueUpParentFee?.id
                                                    ? ` - ${translate('text_64463aaa34904c00a23be4f7')}`
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
                                            item.amountCents || 0,
                                            item.amountCurrency,
                                          ),
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
                              {translate('text_637655cb50f04bf1c8379d20')}
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
                        </>
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
                )}
              </TableSection>

              {(connectedNetsuiteIntegration ||
                data?.creditNote?.customer?.xeroCustomer?.integrationId ||
                data?.creditNote?.taxProviderId ||
                data?.creditNote?.taxProviderSyncable) &&
                creditNote?.id && (
                  <Stack marginTop={8} gap={6}>
                    <SectionHeader variant="subhead">
                      {translate('text_6650b36fc702a4014c878996')}
                    </SectionHeader>
                    {!!connectedNetsuiteIntegration && creditNote?.externalIntegrationId && (
                      <DetailsPage.OverviewLine
                        title={translate('text_6684044e95fa220048a145a7')}
                        value={
                          <Link
                            className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            to={buildNetsuiteCreditNoteUrl(
                              connectedNetsuiteIntegration?.accountId,
                              creditNote?.externalIntegrationId,
                            )}
                          >
                            <Typography variant="body" className="text-blue">
                              {creditNote?.externalIntegrationId} <Icon name="outside" />
                            </Typography>
                          </Link>
                        }
                      />
                    )}
                    {!!data?.creditNote?.customer?.xeroCustomer?.integrationId &&
                      creditNote?.externalIntegrationId && (
                        <DetailsPage.OverviewLine
                          title={translate('text_66911ce41415f40090d053ce')}
                          value={
                            <Link
                              className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              to={buildXeroCreditNoteUrl(creditNote?.externalIntegrationId)}
                            >
                              <Typography variant="body" className="text-blue">
                                {creditNote?.externalIntegrationId} <Icon name="outside" />
                              </Typography>
                            </Link>
                          }
                        />
                      )}

                    {!!data?.creditNote?.customer?.anrokCustomer?.integrationId && (
                      <div>
                        {!!data?.creditNote?.taxProviderId && (
                          <DetailsPage.OverviewLine
                            title={translate('text_1727068146263345gopo39sm')}
                            value={
                              <Link
                                className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                to={buildAnrokCreditNoteUrl(
                                  data?.creditNote?.customer?.anrokCustomer?.externalAccountId,
                                  data?.creditNote?.taxProviderId,
                                )}
                              >
                                <Typography variant="caption" className="text-blue">
                                  {data?.creditNote?.taxProviderId} <Icon name="outside" />
                                </Typography>
                              </Link>
                            }
                          />
                        )}

                        {!!data?.creditNote?.taxProviderSyncable && (
                          <DetailsPage.OverviewLine
                            title={translate('text_1727068146263345gopo39sm')}
                            value={
                              <div className="flex items-center gap-2">
                                <Icon name="warning-filled" color="warning" />
                                <Typography variant="caption">
                                  {translate('text_1727068146263ztoat7i901x')}
                                </Typography>
                                <Typography variant="caption">•</Typography>
                                <Link
                                  className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                                  to="#"
                                  onClick={async () => {
                                    await retryTaxSync()
                                  }}
                                >
                                  <Typography variant="caption" className="text-blue">
                                    {translate('text_17270681462632d46dh3r1vu')}
                                  </Typography>
                                </Link>
                              </div>
                            }
                          />
                        )}
                      </div>
                    )}
                  </Stack>
                )}
            </div>
          </DetailsPage.Container>
        </>
      )}

      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </>
  )
}

export default CreditNoteDetails

const TableSection = styled.section`
  .main-table:not(:first-child) {
    margin-top: ${theme.spacing(10)};
  }

  > table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    > thead > tr > th,
    > tbody > tr > td {
      overflow: hidden;
      line-break: anywhere;
      text-align: right;

      &:nth-child(1) {
        width: 70%;
        text-align: left;
      }
      &:nth-child(2) {
        width: 10%;
      }
      &:nth-child(3) {
        width: 20%;
      }

      &:not(:last-child) {
        padding-right: ${theme.spacing(3)};
      }
    }

    > thead > tr > th {
      position: sticky;
      top: 72px;
      background-color: ${theme.palette.common.white};
      z-index: 1;
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

    > tfoot > tr > td {
      text-align: right;
      padding: ${theme.spacing(3)} 0;

      &:nth-child(1) {
        width: 50%;
      }
      &:nth-child(2) {
        width: 35%;
        box-shadow: ${theme.shadows[7]};
        text-align: left;
      }
      &:nth-child(3) {
        width: 15%;
        box-shadow: ${theme.shadows[7]};
        /* Allow huge amount to be displayed on 2 lines */
        line-break: anywhere;
      }
    }
  }
`
