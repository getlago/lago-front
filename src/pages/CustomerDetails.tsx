import { gql } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CUSTOMERS_LIST_ROUTE } from '~/core/router'
import {
  AddCustomerDrawerFragmentDoc,
  CustomerMainInfosFragmentDoc,
  LagoApiError,
  useGetCustomerQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerDetailsHeaderActions } from '~/hooks/customer/useCustomerDetailsHeaderActions'
import { useCustomerDetailsHeaderEntity } from '~/hooks/customer/useCustomerDetailsHeaderEntity'
import { useCustomerDetailsHeaderTabs } from '~/hooks/customer/useCustomerDetailsHeaderTabs'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
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

const POLLING_INTERVAL = 1000
const MAX_POLLING_ATTEMPTS = 3

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const pollingAttemptsRef = useRef(0)
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const location = useLocation()
  const { organization } = useOrganizationInfos()
  const { customerId } = useParams()

  const shouldPollIntegrations = (location.state as { shouldPollIntegrations?: boolean })
    ?.shouldPollIntegrations

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

  const actions = useCustomerDetailsHeaderActions({
    customerId: customerId as string,
    customer,
    deleteDialogRef,
    addCouponDialogRef,
  })

  const entity = useCustomerDetailsHeaderEntity({ customer })

  const tabs = useCustomerDetailsHeaderTabs({
    customerId: customerId as string,
    customer,
    loading,
    premiumWarningDialogRef,
  })

  const activeTabContent = useMainHeaderTabContent()

  return (
    <div>
      {/* Header */}
      <MainHeader.Configure
        breadcrumb={[{ label: 'Customer', path: CUSTOMERS_LIST_ROUTE }]}
        actions={actions}
        entity={entity}
        tabs={tabs}
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
      <AddCouponToCustomerDialog ref={addCouponDialogRef} customer={customer} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

export default CustomerDetails
