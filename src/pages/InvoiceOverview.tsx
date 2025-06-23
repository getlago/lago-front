import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { Icon } from 'lago-design-system'
import { memo, useRef } from 'react'
import { Link, LinkProps, useParams } from 'react-router-dom'

import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  DeleteAdjustedFeeDialog,
  DeleteAdjustedFeeDialogRef,
} from '~/components/invoices/details/DeleteAdjustedFeeDialog'
import { EditFeeDrawer, EditFeeDrawerRef } from '~/components/invoices/details/EditFeeDrawer'
import {
  InvoiceDetailsTable,
  InvoiceTableSection,
} from '~/components/invoices/details/InvoiceDetailsTable'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { InvoiceCreditNotesTable } from '~/components/invoices/InvoiceCreditNotesTable'
import { InvoiceCustomerInfos } from '~/components/invoices/InvoiceCustomerInfos'
import { Metadatas } from '~/components/invoices/Metadatas'
import { envGlobalVar } from '~/core/apolloClient'
import {
  buildAnrokInvoiceUrl,
  buildAvalaraObjectId,
  buildHubspotInvoiceUrl,
  buildNetsuiteInvoiceUrl,
  buildSalesforceUrl,
  buildXeroInvoiceUrl,
} from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import formatCreditNotesItems from '~/core/formats/formatCreditNotesItems'
import { formatDateToTZ } from '~/core/timezone'
import {
  AvalaraIntegrationInfosForInvoiceOverviewFragment,
  CreditNote,
  CreditNoteItem,
  Customer,
  CustomerAccountTypeEnum,
  DownloadInvoiceItemMutationFn,
  HubspotIntegrationInfosForInvoiceOverviewFragment,
  Invoice,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  NetsuiteIntegrationInfosForInvoiceOverviewFragment,
  RefreshInvoiceMutationFn,
  RetryInvoiceMutationFn,
  RetryTaxProviderVoidingMutationFn,
  SalesforceIntegrationInfosForInvoiceOverviewFragment,
  SyncHubspotIntegrationInvoiceMutationFn,
  SyncSalesforceInvoiceMutationFn,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { SectionHeader } from '~/styles/customer'
import { tw } from '~/styles/utils'

const { disablePdfGeneration, appEnv } = envGlobalVar()

gql`
  fragment InvoiceDetailsForInvoiceOverview on Invoice {
    id
    invoiceType
    status
    taxStatus
    issuingDate
    externalIntegrationId
    taxProviderId
    taxProviderVoidable
    integrationHubspotSyncable
    externalHubspotIntegrationId
    integrationSalesforceSyncable
    externalSalesforceIntegrationId
    fees {
      id
    }
    customer {
      id
      applicableTimezone
      accountType
      anrokCustomer {
        id
        externalAccountId
      }
      avalaraCustomer {
        id
        externalCustomerId
      }
      netsuiteCustomer {
        externalCustomerId
      }
      xeroCustomer {
        externalCustomerId
      }
      hubspotCustomer {
        externalCustomerId
      }
      salesforceCustomer {
        externalCustomerId
      }
    }
    billingEntity {
      name
      code
    }
  }

  fragment NetsuiteIntegrationInfosForInvoiceOverview on NetsuiteIntegration {
    id
    accountId
    name
  }

  fragment HubspotIntegrationInfosForInvoiceOverview on HubspotIntegration {
    id
    portalId
    invoicesObjectTypeId
  }

  fragment SalesforceIntegrationInfosForInvoiceOverview on SalesforceIntegration {
    id
    name
    instanceId
  }

  fragment AvalaraIntegrationInfosForInvoiceOverview on AvalaraIntegration {
    id
    accountId
    companyId
  }
`

interface InvoiceOverviewProps {
  downloadInvoice: DownloadInvoiceItemMutationFn
  hasError: boolean
  hasTaxProviderError: boolean
  invoice: Invoice
  loading: boolean
  loadingInvoiceDownload: boolean
  loadingRefreshInvoice: boolean
  loadingRetryInvoice: boolean
  loadingRetryTaxProviderVoiding: boolean
  refreshInvoice: RefreshInvoiceMutationFn
  retryInvoice: RetryInvoiceMutationFn
  retryTaxProviderVoiding: RetryTaxProviderVoidingMutationFn
  connectedNetsuiteIntegration: NetsuiteIntegrationInfosForInvoiceOverviewFragment | undefined
  connectedHubspotIntegration: HubspotIntegrationInfosForInvoiceOverviewFragment | undefined
  connectedSalesforceIntegration: SalesforceIntegrationInfosForInvoiceOverviewFragment | undefined
  connectedAvalaraIntegration: AvalaraIntegrationInfosForInvoiceOverviewFragment | undefined
  goToPreviousRoute?: () => void
  syncHubspotIntegrationInvoice: SyncHubspotIntegrationInvoiceMutationFn
  syncSalesforceIntegrationInvoice: SyncSalesforceInvoiceMutationFn
  loadingSyncHubspotIntegrationInvoice: boolean
  loadingSyncSalesforceIntegrationInvoice: boolean
}

const InlineLink = ({ children, ...props }: LinkProps) => {
  return (
    <Link className="!w-fit line-break-anywhere hover:underline" {...props}>
      {children}
    </Link>
  )
}

const InfoLine = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mb-3 flex items-start first-child:mr-3 first-child:min-w-58 first-child:leading-7 last-child:w-full last-child:line-break-anywhere">
      {children}
    </div>
  )
}

const InvoiceOverview = memo(
  ({
    downloadInvoice,
    hasError,
    hasTaxProviderError,
    invoice,
    loading,
    loadingInvoiceDownload,
    loadingRefreshInvoice,
    loadingRetryInvoice,
    loadingRetryTaxProviderVoiding,
    refreshInvoice,
    retryInvoice,
    retryTaxProviderVoiding,
    connectedNetsuiteIntegration,
    connectedHubspotIntegration,
    connectedSalesforceIntegration,
    connectedAvalaraIntegration,
    goToPreviousRoute,
    syncHubspotIntegrationInvoice,
    syncSalesforceIntegrationInvoice,
    loadingSyncHubspotIntegrationInvoice,
    loadingSyncSalesforceIntegrationInvoice,
  }: InvoiceOverviewProps) => {
    const { translate } = useInternationalization()
    const { invoiceId } = useParams()
    const customer = invoice?.customer
    const billingEntity = invoice?.billingEntity
    const deleteAdjustedFeeDialogRef = useRef<DeleteAdjustedFeeDialogRef>(null)
    const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
    const editFeeDrawerRef = useRef<EditFeeDrawerRef>(null)
    const formattedCreditNotes = invoice?.creditNotes
      ?.reduce<{ creditNote: CreditNote; items: CreditNoteItem[][][] }[]>((acc, cur) => {
        const newItems = formatCreditNotesItems(cur.items as CreditNoteItem[])

        acc.push({ creditNote: cur, items: newItems })
        return acc
      }, [])
      .sort((a, b) => (a.creditNote.number < b.creditNote.number ? -1 : 1))

    if (hasError) {
      return (
        <GenericPlaceholder
          className="pt-12"
          title={translate('text_634812d6f16b31ce5cbf4126')}
          subtitle={translate('text_634812d6f16b31ce5cbf4128')}
          buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      )
    }
    const isInvoiceFinalizedOrVoided =
      invoice?.status === InvoiceStatusTypeEnum.Finalized ||
      invoice?.status === InvoiceStatusTypeEnum.Voided

    const showXeroSection =
      !!customer?.xeroCustomer?.externalCustomerId && !!invoice?.externalIntegrationId

    const showNetsuiteSection =
      !!connectedNetsuiteIntegration?.accountId && !!invoice?.externalIntegrationId

    const showTaxProviderReSyncButton = invoice?.taxProviderVoidable
    const showAnrokLink = isInvoiceFinalizedOrVoided && !!customer?.anrokCustomer?.externalAccountId
    const showAnrokSection =
      (showTaxProviderReSyncButton || showAnrokLink) && !!invoice?.fees?.length

    const showAvalaraLink =
      isInvoiceFinalizedOrVoided &&
      !!customer?.avalaraCustomer?.externalCustomerId &&
      !!connectedAvalaraIntegration?.companyId &&
      !!connectedAvalaraIntegration?.accountId &&
      !!invoice?.taxProviderId

    const showAvalaraSection =
      (showAvalaraLink || showTaxProviderReSyncButton) && !!invoice?.fees?.length

    const showHubspotReSyncButton = invoice?.integrationHubspotSyncable
    const showHubspotLink =
      !!customer?.hubspotCustomer?.externalCustomerId &&
      !!invoice?.externalHubspotIntegrationId &&
      !!connectedHubspotIntegration?.portalId &&
      isInvoiceFinalizedOrVoided
    const showHubspotSection = showHubspotLink || showHubspotReSyncButton

    const showSalesforceReSyncButton = invoice?.integrationSalesforceSyncable
    const showSalesforceLink =
      customer?.salesforceCustomer?.externalCustomerId &&
      connectedSalesforceIntegration?.instanceId &&
      !!invoice.externalSalesforceIntegrationId &&
      isInvoiceFinalizedOrVoided

    const showSalesforceSection = showSalesforceLink || showSalesforceReSyncButton

    const showExternalAppsSection =
      showAvalaraSection ||
      showXeroSection ||
      showNetsuiteSection ||
      showAnrokSection ||
      showHubspotSection ||
      showSalesforceSection

    const isTaxStatusPending = invoice?.taxStatus === InvoiceTaxStatusTypeEnum.Pending

    const isDraft = invoice?.status === InvoiceStatusTypeEnum.Draft
    const customerIsPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

    return (
      <>
        <SectionHeader variant="subhead">
          {translate('text_634687079be251fdb43833bf')}
          <div className="flex gap-3">
            {invoice?.status === InvoiceStatusTypeEnum.Draft ? (
              <>
                <Button
                  variant="quaternary"
                  startIcon="reload"
                  disabled={loading || loadingRefreshInvoice || isTaxStatusPending}
                  onClick={async () => {
                    await refreshInvoice()
                  }}
                >
                  {translate('text_63a41a8eabb9ae67047c1c06')}
                </Button>
                <Button
                  variant="quaternary"
                  disabled={loading || isTaxStatusPending}
                  onClick={() => {
                    finalizeInvoiceRef.current?.openDialog(invoice, goToPreviousRoute)
                  }}
                >
                  {translate('text_638f4d756d899445f18a4a10')}
                </Button>
              </>
            ) : hasTaxProviderError ? (
              <Button
                variant="quaternary"
                disabled={loading || loadingRetryInvoice || isTaxStatusPending}
                onClick={async () => {
                  await retryInvoice()
                }}
              >
                {translate('text_1724164767403kyknbaw13mg')}
              </Button>
            ) : (
              !hasError &&
              !loading &&
              !disablePdfGeneration && (
                <Button
                  variant="quaternary"
                  disabled={loadingInvoiceDownload || isTaxStatusPending}
                  onClick={async () => {
                    await downloadInvoice({
                      variables: { input: { id: invoiceId || '' } },
                    })
                  }}
                >
                  {translate('text_634687079be251fdb43833b9')}
                </Button>
              )
            )}
          </div>
        </SectionHeader>
        <>
          {loading ? (
            <>
              <div className="pb-7 shadow-b">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={`key-skeleton-line-${i}`} className="mt-7 flex">
                    <Skeleton variant="text" className="mr-[6.4%]" />
                    <Skeleton variant="text" className="mr-[11.2%]" />
                    <Skeleton variant="text" className="mr-[6.4%]" />
                    <Skeleton variant="text" className="mr-[9.25%]" />
                  </div>
                ))}
              </div>
              <InvoiceTableSection
                className="[&_table_tbody_tr_td]:py-5"
                isDraftInvoice={false}
                canHaveUnitPrice={true}
              >
                <table>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <tr key={`invoice-details-loading-${k}`}>
                        <td>
                          <Skeleton variant="text" className="w-60" />
                        </td>
                        <td>
                          <Skeleton className="float-right" variant="text" />
                        </td>
                        <td>
                          <Skeleton className="float-right" variant="text" />
                        </td>
                        <td>
                          <Skeleton className="float-right" variant="text" />
                        </td>
                        <td>
                          <Skeleton className="float-right" variant="text" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {[1, 2, 3].map((i) => (
                      <tr key={`invoice-details-table-footer-loading-${i}`}>
                        <td></td>
                        <td className="py-3" colSpan={3}>
                          <Skeleton variant="text" className="w-40" />
                        </td>
                        <td className="py-3">
                          <Skeleton className="float-right w-30" variant="text" />
                        </td>
                      </tr>
                    ))}
                  </tfoot>
                </table>
              </InvoiceTableSection>
            </>
          ) : (
            <>
              {isDraft && (
                <div className="pt-6">
                  <Alert type="info">
                    {translate(
                      hasTaxProviderError
                        ? 'text_1724170152395tr7v0f15xsv'
                        : 'text_63a41a8eabb9ae67047c1c0c',
                      {
                        issuingDate: formatDateToTZ(
                          invoice.issuingDate,
                          customer?.applicableTimezone,
                          "LLL. dd, yyyy U'T'CZ",
                        ),
                      },
                    )}
                  </Alert>
                </div>
              )}
              {customerIsPartner && (
                <div className={tw(isDraft ? 'pt-3' : 'pt-6')}>
                  <Alert type="info">
                    <Typography variant="body" color="grey700">
                      {translate(
                        isDraft ? 'text_1738593143437uebmu9jwtc4' : 'text_1738605383523lme9aweoipp',
                      )}
                    </Typography>

                    <Typography variant="caption" color="grey600">
                      {translate('text_1738593143438173lt8105a5')}
                    </Typography>
                  </Alert>
                </div>
              )}
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
              <InvoiceCustomerInfos invoice={invoice} />
              <InvoiceDetailsTable
                customer={customer as Customer}
                invoice={invoice as Invoice}
                editFeeDrawerRef={editFeeDrawerRef}
                deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
              />
              {!!formattedCreditNotes?.length &&
                invoice?.status !== InvoiceStatusTypeEnum.Draft &&
                !loadingRefreshInvoice && (
                  <InvoiceCreditNotesTable
                    customerId={customer?.id || ''}
                    formatedCreditNotes={formattedCreditNotes}
                    invoiceId={invoiceId || ''}
                    invoiceType={invoice?.invoiceType}
                  />
                )}
              {showExternalAppsSection && (
                <Stack marginTop={8} gap={6}>
                  <SectionHeader variant="subhead">
                    {translate('text_6650b36fc702a4014c878996')}
                  </SectionHeader>

                  {showAnrokSection && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_1724772240299r3u9nouqflf')}
                      </Typography>
                      {showAnrokLink ? (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildAnrokInvoiceUrl(
                            customer?.anrokCustomer?.externalAccountId,
                            invoice?.id,
                          )}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.id} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Icon name="warning-filled" color="warning" />
                          <Typography variant="body" color="grey600" noWrap>
                            {translate('text_1724773425162ehwcxw6ynrp')}
                          </Typography>
                          <span>•</span>
                          <InlineLink
                            to={'#'}
                            onClick={(e) => {
                              e.preventDefault()
                              retryTaxProviderVoiding()
                            }}
                          >
                            <Typography variant="body" color="info600">
                              {translate('text_1724774217640gd4bmfl8ne3')}
                            </Typography>
                          </InlineLink>
                          {loadingRetryTaxProviderVoiding && (
                            <Icon name="processing" color="info" size="small" animation="spin" />
                          )}
                        </Stack>
                      )}
                    </InfoLine>
                  )}

                  {showAvalaraSection && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_1747408519913t2tehiclc5m')}
                      </Typography>

                      {showAvalaraLink ? (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildAvalaraObjectId({
                            companyId: connectedAvalaraIntegration?.companyId || '',
                            accountId: connectedAvalaraIntegration?.accountId,
                            objectId: String(invoice?.taxProviderId || ''),
                            isSandbox: appEnv !== AppEnvEnum.production,
                          })}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.taxProviderId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Icon name="warning-filled" color="warning" />
                          <Typography variant="body" color="grey600" noWrap>
                            {translate('text_17476431340829ugsayepaod')}
                          </Typography>
                          <span>•</span>
                          <InlineLink
                            to={'#'}
                            onClick={(e) => {
                              e.preventDefault()
                              retryTaxProviderVoiding()
                            }}
                          >
                            <Typography variant="body" color="info600">
                              {translate('text_1747643192782icyo9o1yjgy')}
                            </Typography>
                          </InlineLink>
                          {loadingRetryTaxProviderVoiding && (
                            <Icon name="processing" color="info" size="small" animation="spin" />
                          )}
                        </Stack>
                      )}
                    </InfoLine>
                  )}

                  {showNetsuiteSection && (
                    <div>
                      <InfoLine>
                        <Typography variant="caption" color="grey600" noWrap>
                          {translate('text_6650b36fc702a4014c87899a')}
                        </Typography>
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildNetsuiteInvoiceUrl(
                            connectedNetsuiteIntegration?.accountId,
                            invoice?.externalIntegrationId,
                          )}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.externalIntegrationId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      </InfoLine>
                    </div>
                  )}

                  {showXeroSection && (
                    <div>
                      <InfoLine>
                        <Typography variant="caption" color="grey600" noWrap>
                          {translate('text_6691221aa754dc00d250d4c0')}
                        </Typography>
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildXeroInvoiceUrl(invoice?.externalIntegrationId)}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.externalIntegrationId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      </InfoLine>
                    </div>
                  )}

                  {showHubspotSection && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_1729613902412cy033eh4vvt')}
                      </Typography>

                      {showHubspotLink ? (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildHubspotInvoiceUrl({
                            portalId: connectedHubspotIntegration?.portalId,
                            resourceId: connectedHubspotIntegration?.invoicesObjectTypeId,
                            externalHubspotIntegrationId: invoice?.externalHubspotIntegrationId,
                          })}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.externalHubspotIntegrationId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Icon name="warning-filled" color="warning" />
                          <Typography variant="body" color="grey600" noWrap>
                            {translate('text_1729678728144lfukq2wzred')}
                          </Typography>
                          <span>•</span>
                          <InlineLink
                            to={'#'}
                            onClick={(e) => {
                              e.preventDefault()
                              syncHubspotIntegrationInvoice()
                            }}
                          >
                            <Typography variant="body" color="info600">
                              {translate('text_1729679289432l7pa9bgih1v')}
                            </Typography>
                          </InlineLink>
                          {loadingSyncHubspotIntegrationInvoice && (
                            <Icon name="processing" color="info" size="small" animation="spin" />
                          )}
                        </Stack>
                      )}
                    </InfoLine>
                  )}

                  {showSalesforceSection && (
                    <InfoLine>
                      <Typography variant="caption" color="grey600" noWrap>
                        {translate('text_17316852355256pb6ga10vb4')}
                      </Typography>

                      {showSalesforceLink ? (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildSalesforceUrl({
                            externalCustomerId:
                              customer.salesforceCustomer?.externalCustomerId ?? '',
                            instanceId: connectedSalesforceIntegration.instanceId,
                          })}
                        >
                          <Typography
                            className="flex items-center gap-1"
                            variant="body"
                            color="info600"
                          >
                            {invoice?.externalSalesforceIntegrationId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Icon name="warning-filled" color="warning" />
                          <Typography variant="body" color="grey600" noWrap>
                            {translate('text_1731685304648t5kyi5j9fju')}
                          </Typography>
                          <span>•</span>
                          <InlineLink
                            to={'#'}
                            onClick={(e) => {
                              e.preventDefault()
                              syncSalesforceIntegrationInvoice()
                            }}
                          >
                            <Typography variant="body" color="info600">
                              {translate('text_1731685235525jazy82715wh')}
                            </Typography>
                          </InlineLink>
                          {loadingSyncSalesforceIntegrationInvoice && (
                            <Icon name="processing" color="info" size="small" animation="spin" />
                          )}
                        </Stack>
                      )}
                    </InfoLine>
                  )}
                </Stack>
              )}
              {invoice?.status !== InvoiceStatusTypeEnum.Draft && <Metadatas />}
            </>
          )}
        </>
        <DeleteAdjustedFeeDialog ref={deleteAdjustedFeeDialogRef} />
        <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
        <EditFeeDrawer ref={editFeeDrawerRef} />
      </>
    )
  },
)

InvoiceOverview.displayName = 'InvoiceOverview'

export default InvoiceOverview
