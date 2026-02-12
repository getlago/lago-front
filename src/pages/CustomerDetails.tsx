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
import { computeCustomerInitials } from '~/components/customers/utils'
import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
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
import { MenuPopper, PageHeader } from '~/styles'

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
  const { customerId, tab } = useParams()
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
  const customerInitials = computeCustomerInitials(customer)
  const isPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  const safeTimezone = applicableTimezone
  const hasAnyActionsPermission =
    hasPermissions(['subscriptionsCreate']) ||
    hasPermissions(['invoicesCreate']) ||
    hasPermissions(['couponsAttach']) ||
    hasPermissions(['walletsCreate']) ||
    hasPermissions(['customersUpdate']) ||
    hasPermissions(['customersDelete'])

  return (
    <div>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="-m-1 overflow-hidden p-1">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => navigate(CUSTOMERS_LIST_ROUTE)}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="customer-details-name"
            >
              {customerName}
            </Typography>
          )}
        </PageHeader.Group>

        <PageHeader.Group className="shrink-0">
          <Button
            className="shrink-0"
            startIcon="outside"
            variant="inline"
            onClick={async () => {
              await generatePortalUrl({ variables: { input: { id: customerId as string } } })
            }}
          >
            {translate('text_641b1b19d6e64300632ca60c')}
          </Button>

          {hasAnyActionsPermission && (
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={
                <Button endIcon="chevron-down" data-test={CUSTOMER_ACTIONS_BUTTON_TEST_ID}>
                  {translate('text_626162c62f790600f850b6fe')}
                </Button>
              }
            >
              {({ closePopper }) => (
                <MenuPopper>
                  {hasOverdueInvoices && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={
                        isPaymentProcessingStatusLoading || !isCustomerReadyForOverduePayment
                      }
                      onClick={() => {
                        navigate(
                          generatePath(CUSTOMER_REQUEST_OVERDUE_PAYMENT_ROUTE, {
                            customerId: customerId as string,
                          }),
                        )
                        closePopper()
                      }}
                      data-test={REQUEST_OVERDUE_PAYMENT_BUTTON_TEST_ID}
                    >
                      {translate('text_66b25adfd834ed0104345eb7')}
                    </Button>
                  )}

                  {hasPermissions(['subscriptionsCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_SUBSCRIPTION, {
                            customerId: customerId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_626162c62f790600f850b70c')}
                    </Button>
                  )}

                  {hasPermissions(['invoicesCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_INVOICE_ROUTE, { customerId: customerId as string }),
                        )

                        closePopper()
                      }}
                      data-test="create-invoice-action"
                    >
                      {translate('text_6453819268763979024ad083')}
                    </Button>
                  )}

                  {hasPermissions(['couponsAttach']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        addCouponDialogRef.current?.openDialog()
                        closePopper()
                      }}
                      data-test="apply-coupon-action"
                    >
                      {translate('text_628b8dc14c71840130f8d8a1')}
                    </Button>
                  )}

                  {hasPermissions(['walletsCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={!!hasActiveWallet}
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_WALLET_ROUTE, {
                            customerId: customerId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_62d175066d2dbf1d50bc93a5')}
                    </Button>
                  )}

                  {hasPermissions(['customersUpdate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(UPDATE_CUSTOMER_ROUTE, {
                            customerId: customerId as string,
                          }),
                        )
                      }}
                    >
                      {translate('text_626162c62f790600f850b718')}
                    </Button>
                  )}

                  {hasPermissions(['customersDelete']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      fullWidth
                      onClick={() => {
                        deleteDialogRef.current?.openDialog({
                          onDeleted: () => navigate(CUSTOMERS_LIST_ROUTE),
                          customer: data?.customer ?? undefined,
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_626162c62f790600f850b726')}
                    </Button>
                  )}
                </MenuPopper>
              )}
            </Popper>
          )}
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <div className="px-12 pb-20 pt-12">
        {!!error && !isNotFoundError ? (
          <GenericPlaceholder
            title={translate('text_6250304370f0f700a8fdc270')}
            subtitle={translate('text_6250304370f0f700a8fdc274')}
            buttonTitle={translate('text_6250304370f0f700a8fdc278')}
            buttonVariant="primary"
            buttonAction={() => window.location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : (
          <>
            <div className="flex flex-col gap-12">
              {loading || !data?.customer ? (
                <div className="flex gap-4">
                  <Skeleton variant="userAvatar" size="large" className="rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-32" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex gap-4">
                    <Avatar
                      size="large"
                      variant="user"
                      identifier={customerName || ''}
                      initials={customerInitials}
                    />
                    <div>
                      <Typography
                        className="mb-1"
                        color="textSecondary"
                        variant="headline"
                        forceBreak
                      >
                        {customerName || translate('text_62f272a7a60b4d7fadad911a')}
                      </Typography>
                      <Typography>{externalId}</Typography>
                    </div>
                  </div>

                  {isPartner && (
                    <div>
                      <Chip label={translate('text_1738322099641hkzihmx9qyw')} />
                    </div>
                  )}
                </div>
              )}

              {!loading && !error && data?.customer && (
                <div data-test="customer-navigation-wrapper">
                  <NavigationTab
                    className="mb-12"
                    tabs={[
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
                        component: (
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
                        component: (
                          <CustomerWalletsList
                            customerId={customerId as string}
                            customerTimezone={safeTimezone}
                          />
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
                        component: (
                          <CustomerUsage premiumWarningDialogRef={premiumWarningDialogRef} />
                        ),
                      },
                      {
                        title: translate('text_628cf761cbe6820138b8f2e6'),
                        link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                          customerId: customerId as string,
                          tab: CustomerDetailsTabsOptions.invoices,
                        }),
                        component: (
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
                        component: (
                          <CustomerPaymentsTab externalCustomerId={externalId as string} />
                        ),
                      },
                      {
                        title: translate('text_63725b30957fd5b26b308dd3'),
                        link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                          customerId: customerId as string,
                          tab: CustomerDetailsTabsOptions.creditNotes,
                        }),
                        hidden: !hasCreditNotes,
                        component: (
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
                        component: (
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
                        component: <CustomerSettings customerId={customerId as string} />,
                        hidden: !hasPermissions(['customersView']),
                      },
                      {
                        title: translate('text_1747314141347qq6rasuxisl'),
                        link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                          customerId: customerId as string,
                          tab: CustomerDetailsTabsOptions.activityLogs,
                        }),
                        component: <CustomerActivityLogs externalCustomerId={externalId || ''} />,
                        hidden: !externalId || !isPremium || !hasPermissions(['auditLogsView']),
                      },
                    ]}
                    loading={
                      ![
                        CustomerDetailsTabsOptions.overview,
                        CustomerDetailsTabsOptions.usage,
                      ].includes(tab as CustomerDetailsTabsOptions) && loading
                    }
                  />
                </div>
              )}
            </div>

            <DeleteCustomerDialog ref={deleteDialogRef} />
            <AddCouponToCustomerDialog ref={addCouponDialogRef} customer={data?.customer} />
          </>
        )}
        <PremiumWarningDialog ref={premiumWarningDialogRef} />
      </div>
    </div>
  )
}

export default CustomerDetails
