import { gql } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect, useRef } from 'react'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import { CustomerActivityLogs } from '~/components/customers/CustomerActivityLogs'
import { CustomerCreditNotesList } from '~/components/customers/CustomerCreditNotesList'
import { CustomerInvoicesTab } from '~/components/customers/CustomerInvoicesTab'
import { CustomerMainInfos } from '~/components/customers/CustomerMainInfos'
import { CustomerPaymentsTab } from '~/components/customers/CustomerPaymentsTab'
import { CustomerSettings } from '~/components/customers/CustomerSettings'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { CustomerCoupons } from '~/components/customers/overview/CustomerCoupons'
import { CustomerSubscriptionsList } from '~/components/customers/overview/CustomerSubscriptionsList'
import { CustomerUsage } from '~/components/customers/usage/CustomerUsage'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { StatusType } from '~/components/designSystem/Status'
import {
  GlobalHeader,
  GlobalHeaderAction,
  GlobalHeaderDropdownItem,
  GlobalHeaderTab,
  useGlobalHeaderTabContent,
} from '~/components/GlobalHeader'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CustomerWalletsList } from '~/components/wallets/CustomerWalletList'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import {
  CREATE_INVOICE_ROUTE,
  CREATE_SUBSCRIPTION,
  CREATE_WALLET_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_REQUEST_OVERDUE_PAYMENT_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  UPDATE_CUSTOMER_ROUTE,
} from '~/core/router'
import {
  AddCustomerDrawerFragmentDoc,
  CustomerAccountTypeEnum,
  CustomerMainInfosFragmentDoc,
  LagoApiError,
  useGenerateCustomerPortalUrlMutation,
  useGetCustomerQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDownloadFile } from '~/hooks/useDownloadFile'
import { useIsCustomerReadyForOverduePayment } from '~/hooks/useIsCustomerReadyForOverduePayment'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment CustomerDetails on Customer {
    id
    customerType
    name
    displayName
    firstname
    lastname
    externalId
    hasActiveWallet
    currency
    hasCreditNotes
    creditNotesCreditsAvailableCount
    creditNotesBalanceAmountCents
    applicableTimezone
    hasOverdueInvoices
    accountType
    ...AddCustomerDrawer
    ...CustomerMainInfos
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  mutation generateCustomerPortalUrl($input: GenerateCustomerPortalUrlInput!) {
    generateCustomerPortalUrl(input: $input) {
      url
    }
  }

  ${AddCustomerDrawerFragmentDoc}
  ${CustomerMainInfosFragmentDoc}
`

export const REQUEST_OVERDUE_PAYMENT_BUTTON_TEST_ID = 'request-overdue-payment-button'
export const CUSTOMER_ACTIONS_BUTTON_TEST_ID = 'customer-actions'

const POLLING_INTERVAL = 1000
const MAX_POLLING_ATTEMPTS = 3

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const pollingAttemptsRef = useRef(0)
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()
  const { isPremium } = useCurrentUser()
  const { organization } = useOrganizationInfos()
  const { customerId } = useParams()
  const { handleDownloadFile } = useDownloadFile()

  const shouldPollIntegrations = (location.state as { shouldPollIntegrations?: boolean })
    ?.shouldPollIntegrations

  const { isCustomerReadyForOverduePayment, loading: isPaymentProcessingStatusLoading } =
    useIsCustomerReadyForOverduePayment()

  const { data, loading, error, startPolling, stopPolling } = useGetCustomerQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const customer = data?.customer
  const isNotFoundError = hasDefinedGQLError('NotFound', error)
  const hasAnyIntegrationCustomer =
    !!customer?.netsuiteCustomer ||
    !!customer?.anrokCustomer ||
    !!customer?.xeroCustomer ||
    !!customer?.hubspotCustomer ||
    !!customer?.salesforceCustomer

  // Start polling when coming from edit page with integrations (backend may process them async)
  useEffect(() => {
    if (shouldPollIntegrations && !hasAnyIntegrationCustomer) {
      pollingAttemptsRef.current = 0
      startPolling(POLLING_INTERVAL)
    }

    return () => {
      stopPolling()
    }
    // Only run on mount when shouldPollIntegrations is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPollIntegrations])

  // Stop polling when integrations are loaded or max attempts reached
  useEffect(() => {
    if (!shouldPollIntegrations) return

    pollingAttemptsRef.current += 1

    if (hasAnyIntegrationCustomer || pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
      stopPolling()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [shouldPollIntegrations, hasAnyIntegrationCustomer, stopPolling, navigate, location.pathname])

  // When customer is not found (404), redirect to customers list with error toast
  useEffect(() => {
    if (loading || !isNotFoundError) return

    captureException(new Error('Customer not found'), {
      extra: {
        customerId,
        organizationId: organization?.id,
        url: location.pathname,
      },
    })

    addToast({
      severity: 'info',
      translateKey: 'text_17701996981731m5uguxyg8b',
    })
    navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
  }, [loading, isNotFoundError, customerId, navigate, location.pathname, organization?.id])

  const [generatePortalUrl] = useGenerateCustomerPortalUrlMutation({
    onCompleted({ generateCustomerPortalUrl }) {
      handleDownloadFile(generateCustomerPortalUrl?.url)
    },
  })
  const {
    creditNotesCreditsAvailableCount,
    creditNotesBalanceAmountCents,
    externalId,
    hasActiveWallet,
    hasCreditNotes,
    hasOverdueInvoices,
    applicableTimezone,
  } = customer || {}

  const customerName = customer?.displayName
  const isPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  const safeTimezone = applicableTimezone
  const hasAnyActionsPermission =
    hasPermissions(['subscriptionsCreate']) ||
    hasPermissions(['invoicesCreate']) ||
    hasPermissions(['couponsAttach']) ||
    hasPermissions(['walletsCreate']) ||
    hasPermissions(['customersUpdate']) ||
    hasPermissions(['customersDelete'])

  const headerActions: GlobalHeaderAction[] = [
    {
      type: 'action',
      label: translate('text_641b1b19d6e64300632ca60c'),
      variant: 'inline',
      startIcon: 'outside',
      onClick: async () => {
        await generatePortalUrl({
          variables: { input: { id: customerId as string } },
        })
      },
    },
    ...(hasAnyActionsPermission
      ? [
          {
            type: 'dropdown' as const,
            label: translate('text_626162c62f790600f850b6fe'),
            dataTest: CUSTOMER_ACTIONS_BUTTON_TEST_ID,
            items: [
              {
                label: translate('text_66b25adfd834ed0104345eb7'),
                hidden: !hasOverdueInvoices,
                disabled: isPaymentProcessingStatusLoading || !isCustomerReadyForOverduePayment,
                dataTest: REQUEST_OVERDUE_PAYMENT_BUTTON_TEST_ID,
                onClick: (closePopper) => {
                  navigate(
                    generatePath(CUSTOMER_REQUEST_OVERDUE_PAYMENT_ROUTE, {
                      customerId: customerId as string,
                    }),
                  )
                  closePopper()
                },
              },
              {
                label: translate('text_626162c62f790600f850b70c'),
                hidden: !hasPermissions(['subscriptionsCreate']),
                onClick: (closePopper) => {
                  navigate(
                    generatePath(CREATE_SUBSCRIPTION, {
                      customerId: customerId as string,
                    }),
                  )
                  closePopper()
                },
              },
              {
                label: translate('text_6453819268763979024ad083'),
                hidden: !hasPermissions(['invoicesCreate']),
                dataTest: 'create-invoice-action',
                onClick: (closePopper) => {
                  navigate(
                    generatePath(CREATE_INVOICE_ROUTE, {
                      customerId: customerId as string,
                    }),
                  )
                  closePopper()
                },
              },
              {
                label: translate('text_628b8dc14c71840130f8d8a1'),
                hidden: !hasPermissions(['couponsAttach']),
                dataTest: 'apply-coupon-action',
                onClick: (closePopper) => {
                  addCouponDialogRef.current?.openDialog()
                  closePopper()
                },
              },
              {
                label: translate('text_62d175066d2dbf1d50bc93a5'),
                hidden: !hasPermissions(['walletsCreate']),
                disabled: !!hasActiveWallet,
                onClick: (closePopper) => {
                  navigate(
                    generatePath(CREATE_WALLET_ROUTE, {
                      customerId: customerId as string,
                    }),
                  )
                  closePopper()
                },
              },
              {
                label: translate('text_626162c62f790600f850b718'),
                hidden: !hasPermissions(['customersUpdate']),
                onClick: (closePopper) => {
                  navigate(
                    generatePath(UPDATE_CUSTOMER_ROUTE, {
                      customerId: customerId as string,
                    }),
                  )
                  closePopper()
                },
              },
              {
                label: translate('text_626162c62f790600f850b726'),
                hidden: !hasPermissions(['customersDelete']),
                onClick: (closePopper) => {
                  deleteDialogRef.current?.openDialog({
                    onDeleted: () => navigate(CUSTOMERS_LIST_ROUTE),
                    customer: data?.customer ?? undefined,
                  })
                  closePopper()
                },
              },
            ] satisfies GlobalHeaderDropdownItem[],
          },
        ]
      : []),
  ]

  // Determine entity configuration for the header
  const headerEntity = data?.customer
    ? {
        viewName: customerName || translate('text_62f272a7a60b4d7fadad911a'),
        metadata: externalId,
        badges: isPartner
          ? [{ label: translate('text_1738322099641hkzihmx9qyw'), type: StatusType.default }]
          : undefined,
      }
    : undefined

  // Unified tab definitions — single source of truth for bar metadata AND content
  const customerTabs: GlobalHeaderTab[] = [
    {
      title: translate('text_628cf761cbe6820138b8f2e4'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.overview,
      }),
      match: [
        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          customerId: customerId as string,
          tab: CustomerDetailsTabsOptions.overview,
        }),
        generatePath(CUSTOMER_DETAILS_ROUTE, {
          customerId: customerId as string,
        }),
      ],
      content: (
        <div className="flex flex-col gap-12">
          <CustomerCoupons />
          <CustomerSubscriptionsList />
        </div>
      ),
    },
    {
      title: translate('text_62d175066d2dbf1d50bc937c'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.wallet,
      }),
      content: (
        <CustomerWalletsList customerId={customerId as string} customerTimezone={safeTimezone} />
      ),
      dataTest: 'wallet-tab',
    },
    {
      title: translate('text_6553885df387fd0097fd7384'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.usage,
      }),
      hidden: !hasPermissions(['analyticsView']),
      content: <CustomerUsage premiumWarningDialogRef={premiumWarningDialogRef} />,
    },
    {
      title: translate('text_628cf761cbe6820138b8f2e6'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.invoices,
      }),
      content: (
        <CustomerInvoicesTab
          externalId={externalId}
          userCurrency={data?.customer?.currency || undefined}
          customerId={customerId as string}
          customerTimezone={safeTimezone}
          isPartner={isPartner}
        />
      ),
    },
    {
      title: translate('text_6672ebb8b1b50be550eccbed'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.payments,
      }),
      content: <CustomerPaymentsTab externalCustomerId={externalId as string} />,
    },
    {
      title: translate('text_63725b30957fd5b26b308dd3'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.creditNotes,
      }),
      hidden: !hasCreditNotes,
      content: (
        <CustomerCreditNotesList
          customerId={customerId as string}
          creditNotesCreditsAvailableCount={creditNotesCreditsAvailableCount}
          creditNotesBalanceAmountCents={creditNotesBalanceAmountCents}
          userCurrency={data?.customer?.currency || undefined}
          customerTimezone={safeTimezone}
        />
      ),
    },
    {
      title: translate('text_17376404438209bh9jk7xa2s'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.information,
      }),
      content: (
        <CustomerMainInfos
          loading={loading}
          customer={data?.customer}
          onEdit={() =>
            navigate(
              generatePath(UPDATE_CUSTOMER_ROUTE, {
                customerId: customerId as string,
              }),
            )
          }
        />
      ),
    },
    {
      title: translate('text_638dff9779fb99299bee9126'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.settings,
      }),
      content: <CustomerSettings customerId={customerId as string} />,
      hidden: !hasPermissions(['customersView']),
    },
    {
      title: translate('text_1747314141347qq6rasuxisl'),
      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId: customerId as string,
        tab: CustomerDetailsTabsOptions.activityLogs,
      }),
      content: <CustomerActivityLogs externalCustomerId={externalId || ''} />,
      hidden: !externalId || !isPremium || !hasPermissions(['auditLogsView']),
    },
  ]

  const activeTabContent = useGlobalHeaderTabContent()

  return (
    <div>
      {/* Header */}
      <GlobalHeader.Configure
        breadcrumb={[{ label: 'Customers', path: CUSTOMERS_LIST_ROUTE }]}
        title={customerName}
        actions={headerActions}
        entity={headerEntity}
        tabs={data?.customer ? customerTabs : undefined}
        isLoading={loading}
      />

      {/* Tab content */}
      {activeTabContent && <div className="p-12">{activeTabContent}</div>}

      {/* Error state (non-404) */}
      {!!error && !isNotFoundError && (
        <div className="px-12 pb-20 pt-12">
          <GenericPlaceholder
            title={translate('text_6250304370f0f700a8fdc270')}
            subtitle={translate('text_6250304370f0f700a8fdc274')}
            buttonTitle={translate('text_6250304370f0f700a8fdc278')}
            buttonVariant="primary"
            buttonAction={() => window.location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        </div>
      )}

      <DeleteCustomerDialog ref={deleteDialogRef} />
      <AddCouponToCustomerDialog ref={addCouponDialogRef} customer={data?.customer} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default CustomerDetails
