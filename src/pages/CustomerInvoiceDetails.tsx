import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useCallback, useMemo, useRef } from 'react'
import { generatePath, Outlet, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import {
  Alert,
  Avatar,
  Button,
  Icon,
  NavigationTab,
  Popper,
  Skeleton,
  Status,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { AddMetadataDrawer, AddMetadataDrawerRef } from '~/components/invoices/AddMetadataDrawer'
import {
  DisputeInvoiceDialog,
  DisputeInvoiceDialogRef,
} from '~/components/invoices/DisputeInvoiceDialog'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { InvoiceCreditNoteList } from '~/components/invoices/InvoiceCreditNoteList'
import { InvoicePaymentList } from '~/components/invoices/InvoicePaymentList'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast, envGlobalVar, LagoGQLError } from '~/core/apolloClient'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import {
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CREATE_INVOICE_PAYMENT_ROUTE,
  CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  CurrencyEnum,
  ErrorCodesEnum,
  HubspotIntegration,
  HubspotIntegrationInfosForInvoiceOverviewFragmentDoc,
  Invoice,
  InvoiceDetailsForInvoiceOverviewFragmentDoc,
  InvoiceForCreditNotesTableFragmentDoc,
  InvoiceForDetailsTableFragmentDoc,
  InvoiceForFinalizeInvoiceFragment,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForInvoiceInfosFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  LagoApiError,
  NetsuiteIntegration,
  NetsuiteIntegrationInfosForInvoiceOverviewFragmentDoc,
  SalesforceIntegration,
  SalesforceIntegrationInfosForInvoiceOverviewFragmentDoc,
  useDownloadInvoiceMutation,
  useGetInvoiceDetailsQuery,
  useIntegrationsListForCustomerInvoiceDetailsQuery,
  useRefreshInvoiceMutation,
  useRetryInvoiceMutation,
  useRetryTaxProviderVoidingMutation,
  useSyncHubspotIntegrationInvoiceMutation,
  useSyncIntegrationInvoiceMutation,
  useSyncSalesforceInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'
import InvoiceOverview from '~/pages/InvoiceOverview'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PageHeader, theme } from '~/styles'

const { disablePdfGeneration } = envGlobalVar()

gql`
  fragment AllInvoiceDetailsForCustomerInvoiceDetails on Invoice {
    id
    invoiceType
    number
    paymentStatus
    status
    taxStatus
    totalAmountCents
    currency
    refundableAmountCents
    creditableAmountCents
    voidable
    paymentDisputeLostAt
    integrationSyncable
    externalIntegrationId
    taxProviderVoidable
    integrationHubspotSyncable
    associatedActiveWalletPresent
    errorDetails {
      errorCode
      errorDetails
    }
    customer {
      name
      displayName
      netsuiteCustomer {
        id
        integrationId
        externalCustomerId
      }
      xeroCustomer {
        id
        integrationId
      }
      hubspotCustomer {
        id
        integrationId
      }
      salesforceCustomer {
        id
        integrationId
      }
    }
    ...InvoiceDetailsForInvoiceOverview
    ...InvoiceForCreditNotesTable
    ...InvoiceForDetailsTable
    ...InvoiceForInvoiceInfos
    ...InvoiceForFinalizeInvoice
    ...InvoiceForUpdateInvoicePaymentStatus
  }

  query getInvoiceDetails($id: ID!) {
    invoice(id: $id) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  query integrationsListForCustomerInvoiceDetails($limit: Int) {
    integrations(limit: $limit) {
      collection {
        ... on NetsuiteIntegration {
          __typename
          id
          ...NetsuiteIntegrationInfosForInvoiceOverview
        }

        ... on HubspotIntegration {
          __typename
          id
          ...HubspotIntegrationInfosForInvoiceOverview
        }

        ... on SalesforceIntegration {
          __typename
          id
          ...SalesforceIntegrationInfosForInvoiceOverview
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

  mutation refreshInvoice($input: RefreshInvoiceInput!) {
    refreshInvoice(input: $input) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  mutation syncIntegrationInvoice($input: SyncIntegrationInvoiceInput!) {
    syncIntegrationInvoice(input: $input) {
      invoiceId
    }
  }

  mutation syncHubspotIntegrationInvoice($input: SyncHubspotIntegrationInvoiceInput!) {
    syncHubspotIntegrationInvoice(input: $input) {
      invoiceId
    }
  }

  mutation syncSalesforceInvoice($input: SyncSalesforceInvoiceInput!) {
    syncSalesforceInvoice(input: $input) {
      invoiceId
    }
  }

  mutation retryInvoice($input: RetryInvoiceInput!) {
    retryInvoice(input: $input) {
      id
    }
  }

  mutation retryTaxProviderVoiding($input: RetryTaxProviderVoidingInput!) {
    retryTaxProviderVoiding(input: $input) {
      id
    }
  }

  ${InvoiceForCreditNotesTableFragmentDoc}
  ${InvoiceForDetailsTableFragmentDoc}
  ${InvoiceForInvoiceInfosFragmentDoc}
  ${InvoiceDetailsForInvoiceOverviewFragmentDoc}
  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
  ${NetsuiteIntegrationInfosForInvoiceOverviewFragmentDoc}
  ${HubspotIntegrationInfosForInvoiceOverviewFragmentDoc}
  ${SalesforceIntegrationInfosForInvoiceOverviewFragmentDoc}
`

const getErrorMessageFromErrorDetails = (
  errors: AllInvoiceDetailsForCustomerInvoiceDetailsFragment['errorDetails'],
): string | undefined => {
  if (!errors || errors.length === 0) {
    return undefined
  }

  const [{ errorCode, errorDetails }] = errors

  if (errorCode === ErrorCodesEnum.TaxError) {
    if (errorDetails === LagoApiError.CurrencyCodeNotSupported) {
      return 'text_17238318811308wqpult4i7r'
    }

    if (
      errorDetails === LagoApiError.CustomerAddressCouldNotResolve ||
      errorDetails === LagoApiError.CustomerAddressCountryNotSupported
    ) {
      return 'text_1723831881130x4cfh6qr6o8'
    }

    if (errorDetails === LagoApiError.ProductExternalIdUnknown) {
      return 'text_1723831881130g8hv6qzqe57'
    }

    return 'text_17238318811307ghoc4v7mt9'
  }
}

const CustomerInvoiceDetails = () => {
  const { translate } = useInternationalization()
  const { customerId, invoiceId } = useParams()
  const navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const actions = usePermissionsInvoiceActions()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const addMetadataDrawerDialogRef = useRef<AddMetadataDrawerRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const disputeInvoiceDialogRef = useRef<DisputeInvoiceDialogRef>(null)

  const [refreshInvoice, { loading: loadingRefreshInvoice }] = useRefreshInvoiceMutation({
    variables: { input: { id: invoiceId || '' } },
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity, LagoApiError.InternalError],
    },
    onError: ({ graphQLErrors }) => {
      graphQLErrors.forEach((graphQLError) => {
        const { extensions } = graphQLError as LagoGQLError

        if (extensions.details?.taxError?.length) {
          addToast({
            severity: 'danger',
            translateKey: 'text_1724438705077s7oxv5be87m',
          })
        }
      })
    },
  })
  const [retryInvoice, { loading: loadingRetryInvoice }] = useRetryInvoiceMutation({
    variables: { input: { id: invoiceId || '' } },
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity, LagoApiError.InternalError],
    },
    onCompleted: async ({ retryInvoice: retryInvoiceResult }) => {
      if (retryInvoiceResult?.id) {
        await refetch()
      }
    },
    onError: ({ graphQLErrors }) => {
      graphQLErrors.forEach((graphQLError) => {
        const { extensions } = graphQLError as LagoGQLError

        if (extensions.details?.taxError?.length) {
          addToast({
            severity: 'danger',
            translateKey: 'text_1724438705077s7oxv5be87m',
          })
        }
      })
    },
  })

  const [retryTaxProviderVoiding, { loading: loadingRetryTaxProviderVoiding }] =
    useRetryTaxProviderVoidingMutation({
      variables: { input: { id: invoiceId || '' } },
      context: {
        silentErrorCodes: [LagoApiError.UnprocessableEntity, LagoApiError.InternalError],
      },
      onCompleted({ retryTaxProviderVoiding: retryTaxProviderVoidingResult }) {
        if (retryTaxProviderVoidingResult?.id) {
          addToast({
            severity: 'success',
            translateKey: 'text_172535279177716n7p2svtdb',
          })
        }
      },
    })

  const [syncIntegrationInvoice, { loading: loadingSyncIntegrationInvoice }] =
    useSyncIntegrationInvoiceMutation({
      variables: { input: { invoiceId: invoiceId || '' } },
      onCompleted({ syncIntegrationInvoice: syncIntegrationInvoiceResult }) {
        if (syncIntegrationInvoiceResult?.invoiceId) {
          addToast({
            severity: 'success',
            translateKey: !!data?.invoice?.customer.netsuiteCustomer
              ? 'text_6655a88569eed300ee8c4d44'
              : 'text_17268445285571pwim3q27vl',
          })
        }
      },
    })

  const [syncHubspotIntegrationInvoice, { loading: loadingSyncHubspotIntegrationInvoice }] =
    useSyncHubspotIntegrationInvoiceMutation({
      variables: { input: { invoiceId: invoiceId || '' } },
      onCompleted({ syncHubspotIntegrationInvoice: syncHubspotIntegrationInvoiceResult }) {
        if (syncHubspotIntegrationInvoiceResult?.invoiceId) {
          addToast({
            severity: 'success',
            translateKey: 'text_1729756690073w4jrdeesayy',
          })
        }
      },
    })

  const [syncSalesforceIntegrationInvoice, { loading: loadingSyncSalesforceIntegrationInvoice }] =
    useSyncSalesforceInvoiceMutation({
      variables: { input: { invoiceId: invoiceId || '' } },
      onCompleted({ syncSalesforceInvoice: syncSalesforceInvoiceResult }) {
        if (syncSalesforceInvoiceResult?.invoiceId) {
          addToast({
            severity: 'success',
            translateKey: 'text_17316853046485zk7ibjnwbb',
          })
        }
      },
    })

  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      handleDownloadFile(downloadInvoiceData?.fileUrl)
    },
  })

  const { data, loading, error, refetch } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const { data: integrationsData } = useIntegrationsListForCustomerInvoiceDetailsQuery({
    variables: { limit: 1000 },
    skip:
      !data?.invoice?.customer?.netsuiteCustomer?.integrationId &&
      !data?.invoice?.customer?.xeroCustomer?.integrationId &&
      !data?.invoice?.customer?.hubspotCustomer?.integrationId &&
      !data?.invoice?.customer?.salesforceCustomer?.integrationId,
  })

  const allNetsuiteIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allHubspotIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'HubspotIntegration',
  ) as HubspotIntegration[] | undefined

  const allSalesforceIntegration = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'SalesforceIntegration',
  ) as SalesforceIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) => integration?.id === data?.invoice?.customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const connectedHubspotIntegration = allHubspotIntegrations?.find(
    (integration) => integration?.id === data?.invoice?.customer?.hubspotCustomer?.integrationId,
  ) as HubspotIntegration

  const connectedSalesforceIntegration = allSalesforceIntegration?.find(
    (integration) => integration?.id === data?.invoice?.customer?.salesforceCustomer?.integrationId,
  ) as SalesforceIntegration

  const {
    invoiceType,
    number,
    paymentStatus,
    totalAmountCents,
    totalPaidAmountCents,
    totalDueAmountCents,
    currency,
    status,
    taxStatus,
    creditableAmountCents,
    refundableAmountCents,
    voidable,
    errorDetails,
    taxProviderVoidable,
    associatedActiveWalletPresent,
    paymentDisputeLostAt,
    integrationSyncable,
    integrationHubspotSyncable,
  } = (data?.invoice as AllInvoiceDetailsForCustomerInvoiceDetailsFragment) || {}

  const isPartiallyPaid =
    Number(totalPaidAmountCents) > 0 && Number(totalAmountCents) - Number(totalPaidAmountCents) > 0
  const canRecordPayment =
    Number(totalDueAmountCents) > 0 &&
    hasPermissions(['paymentsCreate']) &&
    Number(totalPaidAmountCents) < Number(totalAmountCents)

  const hasError = (!!error || !data?.invoice) && !loading
  const hasTaxProviderError = errorDetails?.find(
    ({ errorCode }) => errorCode === ErrorCodesEnum.TaxError,
  )
  const errorMessage = getErrorMessageFromErrorDetails(errorDetails)

  const { disabledIssueCreditNoteButton, disabledIssueCreditNoteButtonLabel } =
    createCreditNoteForInvoiceButtonProps({
      invoiceType,
      paymentStatus,
      creditableAmountCents,
      refundableAmountCents,
      associatedActiveWalletPresent,
    })

  const goToPreviousRoute = useCallback(
    () =>
      goBack(
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId as string,
          tab: CustomerDetailsTabsOptions.invoices,
        }),
        {
          exclude: [
            CUSTOMER_INVOICE_DETAILS_ROUTE,
            CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
            CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
            CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
          ],
        },
      ),
    [customerId, goBack],
  )

  const tabsOptions = useMemo(() => {
    const tabs = [
      {
        title: translate('text_634687079be251fdb43833b7'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: customerId as string,
          invoiceId: invoiceId as string,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId: invoiceId as string,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          }),
        ],
        component: (
          <InvoiceOverview
            downloadInvoice={downloadInvoice}
            hasError={hasError}
            hasTaxProviderError={!!hasTaxProviderError}
            invoice={data?.invoice as Invoice}
            loading={loading}
            loadingInvoiceDownload={loadingInvoiceDownload}
            loadingRefreshInvoice={loadingRefreshInvoice}
            loadingRetryInvoice={loadingRetryInvoice}
            loadingRetryTaxProviderVoiding={loadingRetryTaxProviderVoiding}
            refreshInvoice={refreshInvoice}
            retryInvoice={retryInvoice}
            retryTaxProviderVoiding={retryTaxProviderVoiding}
            connectedNetsuiteIntegration={connectedNetsuiteIntegration}
            connectedHubspotIntegration={connectedHubspotIntegration}
            connectedSalesforceIntegration={connectedSalesforceIntegration}
            goToPreviousRoute={goToPreviousRoute}
            syncHubspotIntegrationInvoice={syncHubspotIntegrationInvoice}
            syncSalesforceIntegrationInvoice={syncSalesforceIntegrationInvoice}
            loadingSyncHubspotIntegrationInvoice={loadingSyncHubspotIntegrationInvoice}
            loadingSyncSalesforceIntegrationInvoice={loadingSyncSalesforceIntegrationInvoice}
          />
        ),
      },
      {
        title: translate('text_6672ebb8b1b50be550eccbed'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: customerId as string,
          invoiceId: invoiceId as string,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.payments,
        }),
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId: invoiceId as string,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.payments,
          }),
        ],
        component: (
          <InvoicePaymentList invoiceTotalDueAmount={data?.invoice?.totalDueAmountCents} />
        ),
      },
    ]

    if (
      ![
        InvoiceStatusTypeEnum.Draft,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ].includes(status) &&
      taxStatus !== InvoiceTaxStatusTypeEnum.Pending
    ) {
      tabs.push({
        title: translate('text_636bdef6565341dcb9cfb125'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: customerId as string,
          invoiceId: invoiceId as string,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.creditNotes,
        }),
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId: invoiceId as string,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.creditNotes,
          }),
        ],
        component: <InvoiceCreditNoteList />,
      })
    }

    return tabs
  }, [
    translate,
    customerId,
    invoiceId,
    downloadInvoice,
    hasError,
    hasTaxProviderError,
    data?.invoice,
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
    goToPreviousRoute,
    syncHubspotIntegrationInvoice,
    syncSalesforceIntegrationInvoice,
    loadingSyncHubspotIntegrationInvoice,
    loadingSyncSalesforceIntegrationInvoice,
    status,
    taxStatus,
  ])

  // TODO: Compare this with src/hooks/usePermissionsInvoiceActions.ts:
  // We don't check the same permissions here, but we could refactor this to use the same logic
  const canFinalizeInvoice =
    status === InvoiceStatusTypeEnum.Draft &&
    taxStatus !== InvoiceTaxStatusTypeEnum.Pending &&
    hasPermissions(['draftInvoicesUpdate'])
  const canDownloadInvoice =
    (status !== InvoiceStatusTypeEnum.Pending || taxStatus !== InvoiceTaxStatusTypeEnum.Pending) &&
    !disablePdfGeneration

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button icon="arrow-left" variant="quaternary" onClick={() => goToPreviousRoute()} />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {number}
            </Typography>
          )}
        </PageHeader.Group>
        {!hasError && !loading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_634687079be251fdb438338f')}</Button>
            }
          >
            {({ closePopper }) => {
              return (
                <MenuPopper>
                  {hasTaxProviderError ? (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={!!loadingRetryInvoice}
                      loading={loadingRetryInvoice}
                      onClick={async () => {
                        await retryInvoice()
                        closePopper()
                      }}
                    >
                      {translate('text_1724164767403kyknbaw13mg')}
                    </Button>
                  ) : canFinalizeInvoice ? (
                    <>
                      <Button
                        variant="quaternary"
                        align="left"
                        onClick={async () => {
                          finalizeInvoiceRef.current?.openDialog(
                            data?.invoice as InvoiceForFinalizeInvoiceFragment,
                          )
                          closePopper()
                        }}
                      >
                        {translate('text_63a41a8eabb9ae67047c1c08')}
                      </Button>
                      <Button
                        variant="quaternary"
                        align="left"
                        disabled={!!loadingRefreshInvoice}
                        onClick={async () => {
                          refreshInvoice()
                          closePopper()
                        }}
                      >
                        {translate('text_63a41a8eabb9ae67047c1c06')}
                      </Button>
                    </>
                  ) : canDownloadInvoice ? (
                    <>
                      <Button
                        variant="quaternary"
                        align="left"
                        disabled={!!loadingInvoiceDownload}
                        onClick={async () => {
                          await downloadInvoice({
                            variables: { input: { id: invoiceId || '' } },
                          })
                          closePopper()
                        }}
                      >
                        {translate('text_634687079be251fdb4383395')}
                      </Button>
                      {status !== InvoiceStatusTypeEnum.Voided &&
                        hasPermissions(['creditNotesCreate']) && (
                          <>
                            {isPremium ? (
                              <Tooltip
                                PopperProps={{
                                  popperOptions: {
                                    modifiers: [
                                      {
                                        name: 'offset',
                                        options: {
                                          offset: [0, 8],
                                        },
                                      },
                                    ],
                                  },
                                }}
                                title={
                                  !isPartiallyPaid &&
                                  disabledIssueCreditNoteButtonLabel &&
                                  translate(disabledIssueCreditNoteButtonLabel)
                                }
                                placement="left"
                              >
                                <Button
                                  className="w-full"
                                  variant="quaternary"
                                  align="left"
                                  disabled={disabledIssueCreditNoteButton}
                                  onClick={async () => {
                                    navigate(
                                      generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, {
                                        customerId: customerId as string,
                                        invoiceId: invoiceId as string,
                                      }),
                                    )
                                  }}
                                >
                                  {translate('text_6386589e4e82fa85eadcaa7a')}
                                </Button>
                              </Tooltip>
                            ) : (
                              <Button
                                variant="quaternary"
                                onClick={() => premiumWarningDialogRef.current?.openDialog()}
                                endIcon="sparkles"
                              >
                                {translate('text_6386589e4e82fa85eadcaa7a')}
                              </Button>
                            )}
                          </>
                        )}
                    </>
                  ) : null}
                  {canRecordPayment && (
                    <Button
                      variant="quaternary"
                      align="left"
                      endIcon={isPremium ? undefined : 'sparkles'}
                      onClick={() => {
                        if (isPremium) {
                          navigate(
                            generatePath(CREATE_INVOICE_PAYMENT_ROUTE, {
                              invoiceId: invoiceId as string,
                            }),
                          )
                        } else {
                          premiumWarningDialogRef.current?.openDialog()
                        }
                        closePopper()
                      }}
                    >
                      {translate('text_1737471851634wpeojigr27w')}
                    </Button>
                  )}
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      copyToClipboard(invoiceId || '')

                      addToast({
                        severity: 'info',
                        translateKey: 'text_6253f11816f710014600ba1f',
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_634687079be251fdb438339b')}
                  </Button>
                  {actions.canUpdatePaymentStatus({ status, taxStatus }) && (
                    <>
                      <Button
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          !!data?.invoice &&
                            updateInvoicePaymentStatusDialog?.current?.openDialog(data.invoice)
                          closePopper()
                        }}
                      >
                        {translate('text_63eba8c65a6c8043feee2a01')}
                      </Button>
                      <Button
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          addMetadataDrawerDialogRef.current?.openDrawer()
                          closePopper()
                        }}
                      >
                        {translate('text_1739289860782ljvy21lcake')}
                      </Button>
                    </>
                  )}
                  {actions.canSyncAccountingIntegration({ integrationSyncable }) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={loadingSyncIntegrationInvoice}
                      onClick={async () => {
                        await syncIntegrationInvoice()
                        closePopper()
                      }}
                    >
                      {translate(
                        data?.invoice?.customer.netsuiteCustomer
                          ? 'text_6650b36fc702a4014c8788fd'
                          : 'text_6690ef918777230093114d90',
                      )}
                    </Button>
                  )}
                  {actions.canSyncCRMIntegration({ integrationHubspotSyncable }) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={loadingSyncHubspotIntegrationInvoice}
                      onClick={async () => {
                        await syncHubspotIntegrationInvoice()
                        closePopper()
                      }}
                    >
                      {translate('text_1729611609136sul07rowhfi')}
                    </Button>
                  )}
                  {actions.canDispute({ status, paymentDisputeLostAt }) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        disputeInvoiceDialogRef.current?.openDialog({
                          id: data?.invoice?.id || '',
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_66141e30699a0631f0b2ec71')}
                    </Button>
                  )}
                  {actions.canVoid({ status, paymentStatus }) && (
                    <Tooltip
                      title={!isPartiallyPaid && translate('text_65269c2e471133226211fdd0')}
                      {...(!!data?.invoice?.paymentDisputeLostAt && {
                        title: translate('text_66178d027e220e00dff9f67d'),
                      })}
                      placement="bottom-end"
                      disableHoverListener={voidable}
                    >
                      <Button
                        className="w-full"
                        variant="quaternary"
                        align="left"
                        disabled={!voidable}
                        onClick={() => {
                          voidInvoiceDialogRef?.current?.openDialog({ invoice: data?.invoice })
                          closePopper()
                        }}
                      >
                        {translate('text_65269b43d4d2b15dd929a259')}
                      </Button>
                    </Tooltip>
                  )}
                  {actions.canSyncTaxIntegration({ taxProviderVoidable }) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={loadingRetryTaxProviderVoiding}
                      onClick={async () => {
                        await retryTaxProviderVoiding()
                        closePopper()
                      }}
                    >
                      {translate('text_1724702284063xef0c9kyhyl')}
                    </Button>
                  )}
                </MenuPopper>
              )
            }}
          </Popper>
        )}
      </PageHeader.Wrapper>
      {!!errorMessage ? (
        <Alert fullWidth className="md:px-12" type="warning">
          <Stack>
            <Typography variant="body" color="grey700">
              {translate('text_1724165657161stcilcabm7x')}
            </Typography>

            <Typography variant="caption">{translate(errorMessage)}</Typography>
          </Stack>
        </Alert>
      ) : taxStatus === InvoiceTaxStatusTypeEnum.Pending ? (
        <Alert fullWidth className="md:px-12" type="info">
          <div className="flex flex-col">
            <Typography variant="body" color="grey700">
              {translate('text_1735045451930tezr0et3e6l')}
            </Typography>

            <Typography variant="caption" color="grey600">
              {translate('text_1735045451931zfgc6yvvcfm')}
            </Typography>
          </div>
        </Alert>
      ) : null}
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
                <Skeleton variant="text" className="mb-5 w-50" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </MainInfos>
          ) : (
            <MainInfos>
              <Avatar size="large" variant="connector">
                <Icon name="document" color="dark" size="large" />
              </Avatar>
              <div>
                <MainInfoLine>
                  <Typography variant="headline" color="grey700">
                    {number}
                  </Typography>
                  <Status
                    {...(status === InvoiceStatusTypeEnum.Finalized
                      ? paymentStatusMapping({ status, paymentStatus })
                      : invoiceStatusMapping({ status }))}
                    endIcon={
                      !!data?.invoice?.paymentDisputeLostAt ||
                      (!!data?.invoice?.errorDetails?.length &&
                        status !== InvoiceStatusTypeEnum.Failed) ||
                      taxProviderVoidable
                        ? 'warning-unfilled'
                        : undefined
                    }
                  />
                </MainInfoLine>
                <MainInfoLine>
                  <Typography
                    className="flex flex-wrap items-center gap-1"
                    variant="body"
                    color="grey600"
                  >
                    <span>
                      {translate('text_634687079be251fdb43833ad', {
                        totalAmount: intlFormatNumber(
                          deserializeAmount(totalAmountCents || 0, currency || CurrencyEnum.Usd),
                          {
                            currencyDisplay: 'symbol',
                            currency: currency || CurrencyEnum.Usd,
                          },
                        ),
                      })}
                    </span>
                    <span>•</span>
                    <span>{invoiceId}</span>
                  </Typography>
                </MainInfoLine>
              </div>
            </MainInfos>
          )}
          <NavigationTab name="Invoice details tab switcher" tabs={tabsOptions} loading={loading} />
          <Outlet />
        </Content>
      )}
      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
      <DisputeInvoiceDialog ref={disputeInvoiceDialogRef} />
      {!!data?.invoice && (
        <AddMetadataDrawer ref={addMetadataDrawerDialogRef} invoiceId={data.invoice.id} />
      )}
    </>
  )
}

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

export default CustomerInvoiceDetails
