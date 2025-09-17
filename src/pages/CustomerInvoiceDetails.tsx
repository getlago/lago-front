import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { Avatar, Icon } from 'lago-design-system'
import { useCallback, useMemo, useRef } from 'react'
import { generatePath, Outlet, useNavigate, useParams } from 'react-router-dom'

import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import {
  Alert,
  Button,
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
import { InvoiceActivityLogs } from '~/components/invoices/InvoiceActivityLogs'
import { InvoiceCreditNoteList } from '~/components/invoices/InvoiceCreditNoteList'
import { InvoicePaymentList } from '~/components/invoices/InvoicePaymentList'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast, hasDefinedGQLError, LagoGQLError } from '~/core/apolloClient'
import { LocalTaxProviderErrorsEnum } from '~/core/constants/form'
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
  CUSTOMER_INVOICE_VOID_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile, openNewTab } from '~/core/utils/downloadFiles'
import { regeneratePath } from '~/core/utils/regenerateUtils'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  AvalaraIntegration,
  AvalaraIntegrationInfosForInvoiceOverviewFragmentDoc,
  CurrencyEnum,
  Customer,
  CustomerForInvoiceOverviewFragmentDoc,
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
  InvoiceSubscriptionForInvoiceDetailsTableFragmentDoc,
  InvoiceTaxStatusTypeEnum,
  LagoApiError,
  NetsuiteIntegration,
  NetsuiteIntegrationInfosForInvoiceOverviewFragmentDoc,
  SalesforceIntegration,
  SalesforceIntegrationInfosForInvoiceOverviewFragmentDoc,
  useDownloadInvoiceMutation,
  useGeneratePaymentUrlMutation,
  useGetInvoiceCustomerQuery,
  useGetInvoiceDetailsQuery,
  useGetInvoiceFeesQuery,
  useGetInvoiceSubscriptionsQuery,
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
import { useCustomerHasActiveWallet } from '~/hooks/customer/useCustomerHasActiveWallet'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'
import InvoiceOverview from '~/pages/InvoiceOverview'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PageHeader } from '~/styles'

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
    voidedAt
    voidedInvoiceId
    regeneratedInvoiceId
    errorDetails {
      errorCode
      errorDetails
    }
    customer {
      id
    }

    ...InvoiceDetailsForInvoiceOverview
    ...InvoiceForCreditNotesTable
    ...InvoiceForDetailsTable
    ...InvoiceForInvoiceInfos
    ...InvoiceForFinalizeInvoice
    ...InvoiceForUpdateInvoicePaymentStatus
  }

  fragment CustomerForInvoiceDetails on Customer {
    id
    name
    paymentProvider
    avalaraCustomer {
      id
      integrationId
    }
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

  query getInvoiceDetails($id: ID!) {
    invoice(id: $id) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  query getInvoiceFees($id: ID!) {
    invoice(id: $id) {
      id
      fees {
        ...FeeForInvoiceDetailsTable
      }
    }
  }

  query getInvoiceSubscriptions($id: ID!) {
    invoice(id: $id) {
      id
      invoiceSubscriptions {
        ...InvoiceSubscriptionForInvoiceDetailsTable
      }
    }
  }

  query getInvoiceCustomer($id: ID!) {
    customer(id: $id) {
      id
      ...CustomerForInvoiceDetails
      ...CustomerForInvoiceOverview
    }
  }

  query getInvoiceNumber($id: ID!) {
    invoice(id: $id) {
      id
      number
    }
  }

  query getInvoiceStatus($id: ID!) {
    invoice(id: $id) {
      id
      status
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

        ... on AvalaraIntegration {
          __typename
          id
          ...AvalaraIntegrationInfosForInvoiceOverview
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
  ${AvalaraIntegrationInfosForInvoiceOverviewFragmentDoc}
  ${CustomerForInvoiceOverviewFragmentDoc}
  ${InvoiceSubscriptionForInvoiceDetailsTableFragmentDoc}
`

const getErrorMessageFromErrorDetails = (
  errors: AllInvoiceDetailsForCustomerInvoiceDetailsFragment['errorDetails'],
): string | undefined => {
  if (!errors || errors.length === 0) {
    return undefined
  }

  const [{ errorCode, errorDetails }] = errors

  if (errorCode === ErrorCodesEnum.TaxError) {
    if (
      // Anrok
      errorDetails === LagoApiError.CurrencyCodeNotSupported ||
      // Avalara
      errorDetails === LagoApiError.InvalidEnumValue
    ) {
      return LocalTaxProviderErrorsEnum.CurrencyCodeNotSupported
    }

    if (
      // Anrok
      errorDetails === LagoApiError.CustomerAddressCouldNotResolve ||
      errorDetails === LagoApiError.CustomerAddressCountryNotSupported ||
      // Avalara
      errorDetails === LagoApiError.MissingAddress ||
      errorDetails === LagoApiError.NotEnoughAddressesInfo ||
      errorDetails === LagoApiError.InvalidAddress ||
      errorDetails === LagoApiError.InvalidPostalCode ||
      errorDetails === LagoApiError.AddressLocationNotFound
    ) {
      return LocalTaxProviderErrorsEnum.CustomerAddressError
    }

    if (
      // Anrok
      errorDetails === LagoApiError.ProductExternalIdUnknown ||
      // Avalara
      errorDetails === LagoApiError.TaxCodeAssociatedWithItemCodeNotFound ||
      errorDetails === LagoApiError.EntityNotFoundError
    ) {
      return LocalTaxProviderErrorsEnum.ProductExternalIdUnknown
    }

    return LocalTaxProviderErrorsEnum.GenericErrorMessage
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

  const { data, loading, error, refetch } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })
  const {
    data: feesData,
    loading: feesLoading,
    error: feesError,
  } = useGetInvoiceFeesQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })
  const {
    data: invoiceSubscriptionData,
    loading: invoiceSubscriptionLoading,
    error: invoiceSubscriptionError,
  } = useGetInvoiceSubscriptionsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
    notifyOnNetworkStatusChange: true,
  })
  const invoice = data?.invoice
  const invoiceFees = feesData?.invoice?.fees
  const invoiceSubscriptions = invoiceSubscriptionData?.invoice?.invoiceSubscriptions

  const { data: customerData, loading: customerLoading } = useGetInvoiceCustomerQuery({
    variables: { id: invoice?.customer?.id as string },
    skip: !invoice?.customer?.id,
    context: {
      // NOTE: This call is not critical, it aims to get the customer infos for display purpose.
      // It can happen the customer have been deleted meanwhile hence having a not found error.
      // We just don't want to display an error in this case.
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const customer = customerData?.customer

  const hasActiveWallet = useCustomerHasActiveWallet({
    customerId: customer?.id,
  })

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

  const [generatePaymentUrl] = useGeneratePaymentUrlMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted({ generatePaymentUrl: generatedPaymentUrl }) {
      if (generatedPaymentUrl?.paymentUrl) {
        openNewTab(generatedPaymentUrl.paymentUrl)
      }
    },
    onError(resError) {
      if (hasDefinedGQLError('MissingPaymentProviderCustomer', resError)) {
        addToast({
          severity: 'danger',
          translateKey: 'text_1756225393560tonww8d3bgq',
        })
      }
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
            translateKey: !!customer?.netsuiteCustomer
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

  const { data: integrationsData } = useIntegrationsListForCustomerInvoiceDetailsQuery({
    variables: { limit: 1000 },
    skip:
      !customer?.netsuiteCustomer?.integrationId &&
      !customer?.xeroCustomer?.integrationId &&
      !customer?.hubspotCustomer?.integrationId &&
      !customer?.salesforceCustomer?.integrationId &&
      !customer?.avalaraCustomer?.integrationId,
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

  const allAvalaraIntegration = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AvalaraIntegration',
  ) as AvalaraIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) => integration?.id === customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const connectedHubspotIntegration = allHubspotIntegrations?.find(
    (integration) => integration?.id === customer?.hubspotCustomer?.integrationId,
  ) as HubspotIntegration

  const connectedSalesforceIntegration = allSalesforceIntegration?.find(
    (integration) => integration?.id === customer?.salesforceCustomer?.integrationId,
  ) as SalesforceIntegration

  const connectedAvalaraIntegration = allAvalaraIntegration?.find(
    (integration) => integration?.id === customer?.avalaraCustomer?.integrationId,
  ) as AvalaraIntegration

  const {
    invoiceType,
    number,
    paymentStatus,
    totalAmountCents,
    totalPaidAmountCents,
    currency,
    status,
    taxStatus,
    creditableAmountCents,
    refundableAmountCents,
    errorDetails,
    taxProviderVoidable,
    associatedActiveWalletPresent,
    paymentDisputeLostAt,
    integrationSyncable,
    integrationHubspotSyncable,
    regeneratedInvoiceId,
  } = (invoice as AllInvoiceDetailsForCustomerInvoiceDetailsFragment) || {}

  const isPartiallyPaid =
    Number(totalPaidAmountCents) > 0 && Number(totalAmountCents) - Number(totalPaidAmountCents) > 0

  const canRecordPayment = !!invoice && actions.canRecordPayment(invoice)

  const isLoading = loading || customerLoading || feesLoading || invoiceSubscriptionLoading
  const hasError =
    (!!error || !!feesError || !!invoiceSubscriptionError || !data?.invoice) && !isLoading
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
            loading={isLoading}
            customer={customer}
            fees={invoiceFees}
            invoiceSubscriptions={invoiceSubscriptions}
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
            connectedAvalaraIntegration={connectedAvalaraIntegration}
            goToPreviousRoute={goToPreviousRoute}
            syncHubspotIntegrationInvoice={syncHubspotIntegrationInvoice}
            syncSalesforceIntegrationInvoice={syncSalesforceIntegrationInvoice}
            loadingSyncHubspotIntegrationInvoice={loadingSyncHubspotIntegrationInvoice}
            loadingSyncSalesforceIntegrationInvoice={loadingSyncSalesforceIntegrationInvoice}
          />
        ),
      },
    ]

    if (status === InvoiceStatusTypeEnum.Pending || status === InvoiceStatusTypeEnum.Finalized) {
      tabs.push({
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
          <InvoicePaymentList
            canRecordPayment={canRecordPayment}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />
        ),
      })
    }

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

    if (isPremium && hasPermissions(['auditLogsView'])) {
      tabs.push({
        title: translate('text_1747314141347qq6rasuxisl'),
        link: generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: customerId as string,
          invoiceId: invoiceId as string,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.activityLogs,
        }),
        match: [
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId: customerId as string,
            invoiceId: invoiceId as string,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.activityLogs,
          }),
        ],
        component: (
          <div className="pt-5">
            <InvoiceActivityLogs invoiceId={invoiceId as string} />
          </div>
        ),
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
    isLoading,
    customer,
    invoiceFees,
    invoiceSubscriptions,
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
    status,
    taxStatus,
    isPremium,
    hasPermissions,
    canRecordPayment,
  ])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button icon="arrow-left" variant="quaternary" onClick={() => goToPreviousRoute()} />
          {loading || customerLoading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {number}
            </Typography>
          )}
        </PageHeader.Group>
        {!hasError && !loading && !customerLoading && (
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
                  ) : actions.canFinalize({ status }) ? (
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
                  ) : actions.canDownload({ status, taxStatus }) ? (
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
                  ) : null}
                  {actions.canIssueCreditNote({ status }) && (
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
                  {actions.canGeneratePaymentUrl({
                    status,
                    paymentStatus,
                    customer: customer as Pick<Customer, 'paymentProvider'>,
                  }) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={async () => {
                        await generatePaymentUrl({
                          variables: { input: { invoiceId: invoiceId as string } },
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_1753384709668qrxbzpbskn8')}
                    </Button>
                  )}
                  {actions.canUpdatePaymentStatus({ status, taxStatus }) && (
                    <>
                      <Button
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          !!invoice &&
                            updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
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
                        customer?.netsuiteCustomer
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
                  {actions.canVoid({ status }) && (
                    <Button
                      className="w-full"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        if (customerId && invoiceId) {
                          navigate(
                            generatePath(CUSTOMER_INVOICE_VOID_ROUTE, {
                              customerId,
                              invoiceId,
                            }),
                          )
                        }
                      }}
                    >
                      {translate('text_1750678506388d4fr5etxbhh')}
                    </Button>
                  )}
                  {actions.canRegenerate(
                    { status, regeneratedInvoiceId, invoiceType },
                    hasActiveWallet,
                  ) && (
                    <Button
                      className="w-full"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        if (customerId && invoiceId) {
                          navigate(regeneratePath(data?.invoice as Invoice))
                        }
                      }}
                    >
                      {translate('text_1750678506388oynw9hd01l9')}
                    </Button>
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
                      {translate(
                        !!customer?.avalaraCustomer
                          ? 'text_17476469985998lthq87gwaq'
                          : 'text_1724702284063xef0c9kyhyl',
                      )}
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
        <div className="px-4 pb-20 pt-8 md:px-12">
          {loading ? (
            <div className="mb-8 flex items-center">
              <Skeleton className="mr-4" variant="connectorAvatar" size="large" />
              <div>
                <Skeleton variant="text" className="mb-5 w-50" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </div>
          ) : (
            <div className="mb-8 flex items-center">
              <Avatar className="mr-4" size="large" variant="connector">
                <Icon name="document" color="dark" size="large" />
              </Avatar>
              <div>
                <div className="mb-1 flex items-center">
                  <Typography className="mr-2" variant="headline" color="grey700">
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
                </div>
                <div className="flex items-center">
                  <Typography
                    className="mr-2 flex flex-wrap items-center gap-1"
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
                </div>
              </div>
            </div>
          )}
          <NavigationTab name="Invoice details tab switcher" tabs={tabsOptions} loading={loading} />
          <Outlet />
        </div>
      )}
      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
      <DisputeInvoiceDialog ref={disputeInvoiceDialogRef} />
      {!!invoice && <AddMetadataDrawer ref={addMetadataDrawerDialogRef} invoiceId={invoice.id} />}
    </>
  )
}

export default CustomerInvoiceDetails
