import { Stack } from '@mui/material'
import { Button, ConditionalWrapper, Icon, Typography } from 'lago-design-system'
import { Fragment } from 'react'
import { generatePath, Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Status, StatusProps, StatusType } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import {
  buildAnrokCreditNoteUrl,
  buildAvalaraObjectId,
  buildNetsuiteCreditNoteUrl,
  buildXeroCreditNoteUrl,
} from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import {
  AvalaraIntegration,
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
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

const { disablePdfGeneration, appEnv } = envGlobalVar()

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

export const CreditNoteDetailsOverview = () => {
  const { customerId, creditNoteId } = useParams()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  const { data, loading, error } = useGetCreditNoteQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId || !customerId,
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

  const { data: integrationsData } = useIntegrationsListForCreditNoteDetailsQuery({
    variables: { limit: 1000 },
    skip:
      !data?.creditNote?.customer?.netsuiteCustomer?.integrationId &&
      !data?.creditNote?.customer?.xeroCustomer?.integrationId &&
      !data?.creditNote?.customer?.anrokCustomer?.integrationId &&
      !data?.creditNote?.customer?.avalaraCustomer?.id,
  })
  const allNetsuiteIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allAvalaraIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AvalaraIntegration',
  ) as AvalaraIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) =>
      integration?.id === data?.creditNote?.customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const connectedAvalaraIntegration = allAvalaraIntegrations?.find(
    (integration) => integration?.id === data?.creditNote?.customer?.avalaraCustomer?.integrationId,
  ) as AvalaraIntegration

  const creditNote = data?.creditNote
  const billingEntity = data?.creditNote?.billingEntity
  const creditedFormattedStatus = creditedMapStatus(creditNote?.creditStatus)
  const consumedFormattedStatus = consumedMapStatus(creditNote?.refundStatus)
  const isRefunded = creditNote?.refundAmountCents > 0
  const status = isRefunded ? consumedFormattedStatus : creditedFormattedStatus

  const groupedData = formatCreditNotesItems(creditNote?.items as CreditNoteItem[])

  const customerName = creditNote?.customer?.displayName

  const isPrepaidCreditsInvoice = data?.creditNote?.invoice?.invoiceType === InvoiceTypeEnum.Credit

  const hasError = (!!error || !creditNote) && !loading

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
    <div>
      <SectionHeader variant="subhead">
        {translate('text_637655cb50f04bf1c8379cfa')}
        {!hasError && !loading && hasPermissions(['creditNotesView']) && !disablePdfGeneration && (
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

      {billingEntity && (
        <div className="box-border flex items-center gap-2 py-6 shadow-b">
          <div className="min-w-[140px]">
            <Typography className="text-sm text-grey-600">
              {translate('text_1743611497157teaa1zu8l24')}
            </Typography>
          </div>

          <Typography className="text-grey-700">
            {billingEntity.name || billingEntity.code}
          </Typography>
        </div>
      )}

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
                        !!creditNote?.customer.deletedAt && hasPermissions(['customersView'])
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
            ? subscription?.name || subscription.plan.invoiceDisplayName || subscription?.plan?.name
            : translate('text_6388b923e514213fed58331c')

          return (
            <Fragment key={`groupSubscriptionItem-${i}`}>
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
                        <Fragment key={`groupSubscriptionItem-${i}-list-item-${k}`}>
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
                                      ? item.fee.invoiceName || 'Minimum commitment - True up'
                                      : composeMultipleValuesWithSepator([
                                          item.fee?.invoiceName ||
                                            item?.fee?.charge?.billableMetric.name ||
                                            invoiceDisplayName,
                                          composeGroupedByDisplayName(item?.fee?.groupedBy),
                                          composeChargeFilterDisplayName(item.fee.chargeFilter),
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
                                          {intlFormatNumber(appliedTaxe.taxRate / 100 || 0, {
                                            style: 'percent',
                                          })}
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
                                  deserializeAmount(item.amountCents || 0, item.amountCurrency),
                                  {
                                    currencyDisplay: 'symbol',
                                    currency: item.amountCurrency,
                                  },
                                )}
                              </Typography>
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })
                  })}
                </tbody>
              </table>
            </Fragment>
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
        connectedAvalaraIntegration ||
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
                    <Typography variant="body" className="flex items-center gap-1 text-blue">
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
                        <Typography variant="body" className="flex items-center gap-1 text-blue">
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
                        <Typography variant="body">
                          {translate('text_1727068146263ztoat7i901x')}
                        </Typography>
                        <Typography variant="body">•</Typography>
                        <Link
                          className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                          to="#"
                          onClick={async () => {
                            await retryTaxSync()
                          }}
                        >
                          <Typography variant="body" className="text-blue">
                            {translate('text_17270681462632d46dh3r1vu')}
                          </Typography>
                        </Link>
                      </div>
                    }
                  />
                )}
              </div>
            )}

            {!!data?.creditNote?.customer?.avalaraCustomer?.id && !!connectedAvalaraIntegration && (
              <div>
                {!!data?.creditNote?.taxProviderId && (
                  <DetailsPage.OverviewLine
                    title={translate('text_1747408519913t2tehiclc5q')}
                    value={
                      <Link
                        className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        to={buildAvalaraObjectId({
                          accountId: connectedAvalaraIntegration?.accountId,
                          companyId: connectedAvalaraIntegration.companyId || '',
                          objectId: data?.creditNote?.taxProviderId,
                          isSandbox: appEnv !== AppEnvEnum.production,
                        })}
                      >
                        <Typography variant="body" className="flex items-center gap-1 text-blue">
                          {data?.creditNote?.taxProviderId} <Icon name="outside" />
                        </Typography>
                      </Link>
                    }
                  />
                )}

                {!!data?.creditNote?.taxProviderSyncable && (
                  <DetailsPage.OverviewLine
                    title={translate('text_1747408519913t2tehiclc5q')}
                    value={
                      <div className="flex items-center gap-2">
                        <Icon name="warning-filled" color="warning" />
                        <Typography variant="body">
                          {translate('text_1727068146263ztoat7i901x')}
                        </Typography>
                        <Typography variant="body">•</Typography>
                        <Link
                          className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                          to="#"
                          onClick={async () => {
                            await retryTaxSync()
                          }}
                        >
                          <Typography variant="body" className="text-blue">
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
  )
}

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
