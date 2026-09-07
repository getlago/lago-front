import { gql } from '@apollo/client'
import { ReactElement, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { useAddCouponToCustomerDialog } from '~/components/customers/AddCouponToCustomerDialog'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { hasDefinedGQLError } from '~/core/apolloClient'
import {
  INTEGRATION_POLLING_INTERVAL,
  MAX_INTEGRATION_POLLING_ATTEMPTS,
} from '~/core/constants/integrationPolling'
import { CUSTOMERS_LIST_ROUTE, useLocation, useNavigate } from '~/core/router'
import {
  AddCustomerDrawerFragmentDoc,
  CustomerMainInfosFragmentDoc,
  GetCustomerQuery,
  LagoApiError,
  useGetCustomerQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerDetailsHeaderActions } from '~/hooks/customer/useCustomerDetailsHeaderActions'
import { useCustomerDetailsHeaderEntity } from '~/hooks/customer/useCustomerDetailsHeaderEntity'
import { useCustomerDetailsHeaderTabs } from '~/hooks/customer/useCustomerDetailsHeaderTabs'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
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
    creditNotesBalances {
      currency
      billingEntityId
      amountCents
      creditsAvailableCount
    }
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

const hasIntegrationCustomer = (customer: GetCustomerQuery['customer'] | undefined): boolean =>
  !!customer?.integrationCustomers?.length

const CustomerDetails = (): ReactElement => {
  const { openAddCouponToCustomerDialog } = useAddCouponToCustomerDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const location = useLocation()
  const { customerId } = useParams()

  const shouldPollIntegrations = (location.state as { shouldPollIntegrations?: boolean })
    ?.shouldPollIntegrations

  const { data, loading, error, refetch } = useGetCustomerQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const customer = data?.customer
  const pollingContextRef = useRef({ customer, loading, navigate })

  useEffect(() => {
    pollingContextRef.current = { customer, loading, navigate }
  }, [customer, loading, navigate])

  useEffect(() => {
    if (!shouldPollIntegrations || !customerId) return

    let cancelled = false
    let completedPolls = 0
    let timeout: ReturnType<typeof setTimeout>

    const finishPolling = (): void => {
      pollingContextRef.current.navigate(location.pathname, { replace: true, state: {} })
    }

    const poll = async (): Promise<void> => {
      const currentQuery = pollingContextRef.current

      if (currentQuery.loading) {
        timeout = setTimeout(() => void poll(), INTEGRATION_POLLING_INTERVAL)
        return
      }

      if (
        currentQuery.customer?.id === customerId &&
        hasIntegrationCustomer(currentQuery.customer)
      ) {
        finishPolling()
        return
      }

      let integrationFound = false

      try {
        const result = await refetch()

        integrationFound = hasIntegrationCustomer(result.data.customer)
      } catch {
        // Apollo exposes refetch failures through the query's error state.
      }

      if (cancelled) return

      completedPolls += 1

      if (integrationFound || completedPolls >= MAX_INTEGRATION_POLLING_ATTEMPTS) {
        finishPolling()
        return
      }

      timeout = setTimeout(() => void poll(), INTEGRATION_POLLING_INTERVAL)
    }

    const initialCustomer = pollingContextRef.current.customer

    if (
      !pollingContextRef.current.loading &&
      initialCustomer?.id === customerId &&
      hasIntegrationCustomer(initialCustomer)
    ) {
      finishPolling()
    } else {
      timeout = setTimeout(() => void poll(), INTEGRATION_POLLING_INTERVAL)
    }

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [customerId, shouldPollIntegrations, refetch, location.pathname, location.key])

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: CUSTOMERS_LIST_ROUTE,
    translateKey: 'text_17701996981731m5uguxyg8b',
  })

  const actions = useCustomerDetailsHeaderActions({
    customerId: customerId as string,
    customer,
    openAddCouponToCustomerDialog: () =>
      openAddCouponToCustomerDialog({
        customer: customer
          ? { id: customer.id, displayName: customer.displayName ?? undefined }
          : null,
      }),
  })

  const entity = useCustomerDetailsHeaderEntity({ customer, loading })

  const tabs = useCustomerDetailsHeaderTabs({
    customerId: customerId as string,
    customer,
    loading,
  })

  const activeTabContent = useMainHeaderTabContent()

  return (
    <div>
      {/* Header */}
      <MainHeader.Configure
        breadcrumb={[
          { label: translate('text_624efab67eb2570101d117a5'), path: CUSTOMERS_LIST_ROUTE },
        ]}
        actions={{ items: actions, loading }}
        entity={entity}
        tabs={tabs}
      />

      {/* Tab content */}
      {activeTabContent && <div className="p-4 md:p-12">{activeTabContent}</div>}

      {/* Error state (non-404) */}
      {!!error && !hasDefinedGQLError('NotFound', error) && (
        <div className="px-4 pb-20 pt-12 md:px-12">
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
    </div>
  )
}

export default CustomerDetails
