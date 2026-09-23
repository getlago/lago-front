import { ApolloQueryResult } from '@apollo/client'
import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import
import { useLocation, useParams } from 'react-router'

import {
  INTEGRATION_POLLING_INTERVAL,
  MAX_INTEGRATION_POLLING_LOADING_WAITS,
} from '~/core/constants/integrationPolling'
import { GetCustomerQuery, IntegrationTypeEnum } from '~/generated/graphql'

import { useCustomerIntegrationPolling } from '../useCustomerIntegrationPolling'

const mockNavigate = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => mockNavigate),
  useLocation: jest.fn(),
}))

type PollingProps = Parameters<typeof useCustomerIntegrationPolling>[0]

const CUSTOMER_ID = 'test-customer-id'
const PATHNAME = '/acme/customers/test-customer-id/information'

const XERO_INTEGRATION_CUSTOMER = {
  __typename: 'XeroCustomer',
  id: 'xero-123',
  integrationType: IntegrationTypeEnum.Xero,
}

const buildCustomer = (
  integrationCustomers: unknown[] = [],
  id: string = CUSTOMER_ID,
): GetCustomerQuery['customer'] =>
  ({ id, integrationCustomers }) as unknown as GetCustomerQuery['customer']

const mockRefetch = jest.fn()

const buildProps = (overrides: Partial<PollingProps> = {}): PollingProps => ({
  customerId: CUSTOMER_ID,
  customer: buildCustomer(),
  loading: false,
  refetch: mockRefetch as unknown as PollingProps['refetch'],
  ...overrides,
})

const renderPolling = (overrides: Partial<PollingProps> = {}, options: { strict?: boolean } = {}) =>
  renderHook((props: PollingProps) => useCustomerIntegrationPolling(props), {
    initialProps: buildProps(overrides),
    ...(options.strict ? { wrapper: StrictMode } : {}),
  })

const advancePolling = async (milliseconds = INTEGRATION_POLLING_INTERVAL): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds)
  })
}

describe('useCustomerIntegrationPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.mocked(useParams).mockReturnValue({
      customerId: CUSTOMER_ID,
      organizationSlug: 'acme',
      tab: 'information',
    })
    jest.mocked(useLocation).mockReturnValue({
      pathname: PATHNAME,
      state: { shouldPollIntegrations: true },
      search: '',
      hash: '',
      key: 'polling-visit',
    })
    mockRefetch.mockResolvedValue({
      data: { customer: buildCustomer() },
    } as ApolloQueryResult<GetCustomerQuery>)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('counts three identical completed polls without consuming attempts on rerenders', async () => {
    const { rerender } = renderPolling()

    for (let renderCount = 0; renderCount < 5; renderCount += 1) {
      rerender(buildProps())
    }

    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()

    for (let pollCount = 1; pollCount < 3; pollCount += 1) {
      await advancePolling()
      expect(mockRefetch).toHaveBeenCalledTimes(pollCount)
      expect(mockNavigate).not.toHaveBeenCalled()
      rerender(buildProps())
    }

    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(PATHNAME, { replace: true, state: {} })

    rerender(buildProps())
    await advancePolling(10_000)
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('waits for the initial query without counting it as a poll', async () => {
    const { rerender } = renderPolling({ customer: undefined, loading: true })

    await advancePolling(5000)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()

    rerender(buildProps())
    await advancePolling(2000)
    expect(mockRefetch).toHaveBeenCalledTimes(2)
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('gives up and clears the flag when the initial query never settles', async () => {
    renderPolling({ customer: undefined, loading: true })

    await advancePolling(MAX_INTEGRATION_POLLING_LOADING_WAITS * INTEGRATION_POLLING_INTERVAL)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(PATHNAME, { replace: true, state: {} })

    await advancePolling(60_000)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('counts a refetch that resolves without data as a completed poll', async () => {
    // `errorPolicy: 'all'` resolves a GraphQL error with `data: undefined` instead of rejecting
    mockRefetch.mockResolvedValue({ data: undefined })
    renderPolling()

    await advancePolling(2000)
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    await advancePolling(5000)
    expect(mockRefetch).toHaveBeenCalledTimes(3)
  })

  it('stops without polling when the initial query returns an integration', async () => {
    const { rerender } = renderPolling({ customer: undefined, loading: true })

    await advancePolling()
    rerender(buildProps({ customer: buildCustomer([XERO_INTEGRATION_CUSTOMER]) }))
    await advancePolling(5000)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(PATHNAME, { replace: true, state: {} })
  })

  it('keeps a single polling loop when StrictMode replays effects', async () => {
    renderPolling({}, { strict: true })

    await advancePolling(3000)
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it.each([false, undefined])('does not poll when the navigation flag is %s', async (flag) => {
    jest.mocked(useLocation).mockReturnValue({
      ...useLocation(),
      state: flag === undefined ? null : { shouldPollIntegrations: flag },
    })
    renderPolling()

    await advancePolling(5000)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it.each([
    ['NetsuiteCustomer', IntegrationTypeEnum.Netsuite],
    ['AnrokCustomer', IntegrationTypeEnum.Anrok],
    ['AvalaraCustomer', IntegrationTypeEnum.Avalara],
    ['XeroCustomer', IntegrationTypeEnum.Xero],
    ['HubspotCustomer', IntegrationTypeEnum.Hubspot],
    ['SalesforceCustomer', IntegrationTypeEnum.Salesforce],
  ])(
    'clears the slug-prefixed route state when %s already exists',
    async (__typename, integrationType) => {
      renderPolling({
        customer: buildCustomer([{ __typename, id: 'integration-id', integrationType }]),
      })

      await advancePolling(5000)
      expect(mockRefetch).not.toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(PATHNAME, { replace: true, state: {} })
    },
  )

  it('stops when an integration appears in a completed poll', async () => {
    mockRefetch.mockResolvedValueOnce({
      data: { customer: buildCustomer([XERO_INTEGRATION_CUSTOMER]) },
    })
    renderPolling()

    await advancePolling()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(PATHNAME, { replace: true, state: {} })
    await advancePolling(5000)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('does not overlap requests or count a pending request as completed', async () => {
    let completePoll!: (result: unknown) => void

    mockRefetch.mockReturnValueOnce(
      new Promise((resolve) => {
        completePoll = resolve
      }),
    )
    const { rerender } = renderPolling()

    await advancePolling(10_000)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()

    rerender(buildProps({ loading: true }))
    rerender(buildProps())
    await act(async () => {
      completePoll({ data: { customer: buildCustomer() } })
    })
    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(2)
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('bounds rejected refetches and clears state after the third failure', async () => {
    mockRefetch.mockRejectedValue(new Error('Network unavailable'))
    renderPolling()

    await advancePolling(2000)
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    await advancePolling(5000)
    expect(mockRefetch).toHaveBeenCalledTimes(3)
  })

  it('cancels the scheduled poll on unmount', async () => {
    const { unmount } = renderPolling()

    unmount()
    await advancePolling(5000)
    expect(mockRefetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('ignores an in-flight completion after unmount', async () => {
    let completePoll!: (result: unknown) => void

    mockRefetch.mockReturnValueOnce(
      new Promise((resolve) => {
        completePoll = resolve
      }),
    )
    const { unmount } = renderPolling()

    await advancePolling()
    unmount()
    await act(async () => {
      completePoll({ data: { customer: buildCustomer([XERO_INTEGRATION_CUSTOMER]) } })
    })
    await advancePolling(5000)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('cancels polling when navigation removes the flag', async () => {
    const { rerender } = renderPolling()

    await advancePolling()
    jest.mocked(useLocation).mockReturnValue({ ...useLocation(), state: {} })
    rerender(buildProps())
    await advancePolling(5000)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('ignores the previous customer response and resets attempts on a new route', async () => {
    let completeOldPoll!: (result: unknown) => void

    mockRefetch.mockReturnValueOnce(
      new Promise((resolve) => {
        completeOldPoll = resolve
      }),
    )
    const { rerender } = renderPolling()

    await advancePolling()
    jest.mocked(useParams).mockReturnValue({
      customerId: 'other-customer',
      organizationSlug: 'other-org',
      tab: 'information',
    })
    const nextPathname = '/other-org/customers/other-customer/information'

    jest.mocked(useLocation).mockReturnValue({
      ...useLocation(),
      pathname: nextPathname,
      key: 'next-visit',
    })
    rerender(
      buildProps({
        customerId: 'other-customer',
        customer: buildCustomer([], 'other-customer'),
      }),
    )
    await act(async () => {
      completeOldPoll({
        data: {
          customer: buildCustomer([{ ...XERO_INTEGRATION_CUSTOMER, id: 'old-integration' }]),
        },
      })
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling(2000)
    expect(mockRefetch).toHaveBeenCalledTimes(3)
    expect(mockNavigate).not.toHaveBeenCalled()
    await advancePolling()
    expect(mockRefetch).toHaveBeenCalledTimes(4)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(nextPathname, { replace: true, state: {} })
  })
})
