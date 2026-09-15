import { ApolloQueryResult } from '@apollo/client'
import { useEffect, useRef } from 'react'

import {
  INTEGRATION_POLLING_INTERVAL,
  MAX_INTEGRATION_POLLING_ATTEMPTS,
  MAX_INTEGRATION_POLLING_LOADING_WAITS,
} from '~/core/constants/integrationPolling'
import { useLocation, useNavigate } from '~/core/router'
import { GetCustomerQuery } from '~/generated/graphql'

type UseCustomerIntegrationPollingProps = {
  customerId: string | undefined
  customer: GetCustomerQuery['customer'] | undefined
  loading: boolean
  refetch: () => Promise<ApolloQueryResult<GetCustomerQuery>>
}

const hasIntegrationCustomer = (customer: GetCustomerQuery['customer'] | undefined): boolean =>
  !!customer?.integrationCustomers?.length

export const useCustomerIntegrationPolling = ({
  customerId,
  customer,
  loading,
  refetch,
}: UseCustomerIntegrationPollingProps): void => {
  const navigate = useNavigate()
  const location = useLocation()

  const shouldPollIntegrations = (location.state as { shouldPollIntegrations?: boolean })
    ?.shouldPollIntegrations

  const pollingContextRef = useRef({ customer, loading, navigate })

  useEffect(() => {
    pollingContextRef.current = { customer, loading, navigate }
  }, [customer, loading, navigate])

  useEffect(() => {
    if (!shouldPollIntegrations || !customerId) return

    let cancelled = false
    let completedPolls = 0
    let loadingWaits = 0
    let timeout: ReturnType<typeof setTimeout>

    const finishPolling = (): void => {
      pollingContextRef.current.navigate(location.pathname, { replace: true, state: {} })
    }

    const poll = async (): Promise<void> => {
      const currentQuery = pollingContextRef.current

      if (currentQuery.loading) {
        loadingWaits += 1

        if (loadingWaits >= MAX_INTEGRATION_POLLING_LOADING_WAITS) {
          finishPolling()
          return
        }

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

        integrationFound = hasIntegrationCustomer(result.data?.customer)
      } catch {
        // `errorPolicy: 'all'` (apolloClient/init.ts) resolves GraphQL errors with no data,
        // so only network failures reject here and the query's error state surfaces them.
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
}
