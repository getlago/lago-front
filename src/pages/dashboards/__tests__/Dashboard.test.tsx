import { screen, waitFor } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { getItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { CreateSupersetGuestTokenDocument, SupersetDashboardsDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import Dashboard, { DASHBOARD_MOUNT_TEST_ID } from '../Dashboard'

// --- Superset SDK -----------------------------------------------------------
const mockUnmount = jest.fn()
const mockObserveDataMask = jest.fn()
const mockEmbedDashboard = jest.fn()

jest.mock('@superset-ui/embedded-sdk', () => ({
  embedDashboard: (...args: unknown[]) => mockEmbedDashboard(...args),
}))

// `~/main.css` resolves to the real stylesheet (the `~/` alias wins over the
// css→styleMock mapper), which Jest can't parse — stub it out.
jest.mock('~/main.css', () => ({}))

// FinanceAssistantAnalyticsCta needs AiAgentProvider (mounted at App level, not in this tree)
jest.mock('~/components/aiAgent/FinanceAssistantAnalyticsCta', () => ({
  FinanceAssistantAnalyticsCta: () => null,
}))

// --- Feature flags ----------------------------------------------------------
const mockIsFeatureFlagActive = jest.fn()

jest.mock('~/core/utils/featureFlags', () => ({
  FeatureFlags: { SUPERSET_PERSISTENT_FILTERS: 'superset_persistent_filters' },
  isFeatureFlagActive: (...args: unknown[]) => mockIsFeatureFlagActive(...args),
}))

// --- Current user (org for the filter key) ----------------------------------
jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ currentMembership: { organization: { id: 'org-1' } } }),
}))

// --- i18n -------------------------------------------------------------------
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

// --- localStorage helpers -----------------------------------------------------
// The mock fns live inside the factory (not in module-scope consts): the module
// is loaded during other imports' init (e.g. authTokenVar reads the LS token at
// module scope), which runs before this file's const initializers.
jest.mock('~/core/utils/localStorage', () => ({
  ...jest.requireActual('~/core/utils/localStorage'),
  getItemFromLS: jest.fn(),
  setItemFromLS: jest.fn(),
  removeItemFromLS: jest.fn(),
}))

const mockGetItemFromLS = jest.mocked(getItemFromLS)
const mockSetItemFromLS = jest.mocked(setItemFromLS)

const ANALYTICS_FILTERS_KEY = 'superset-filters-org-1-lago-dashboard'
const REVENUE_FILTERS_KEY = 'superset-filters-org-1-revenue-recognition'

const dashboardsData = {
  supersetDashboards: [
    {
      id: 'dash-1',
      embeddedId: 'embed-1',
      dashboardTitle: 'Lago Dashboard',
      guestToken: 'token-1',
    },
    {
      id: 'dash-2',
      embeddedId: 'embed-2',
      dashboardTitle: 'Revenue Recognition',
      guestToken: 'token-2',
    },
  ],
}

const successMock: TestMocksType = [
  { request: { query: SupersetDashboardsDocument }, result: { data: dashboardsData } },
  {
    request: {
      query: CreateSupersetGuestTokenDocument,
      variables: { input: { dashboardId: 'dash-1' } },
    },
    // Deliberately different from the `guestToken` seeded by the dashboards query
    // above: if the two matched, an assertion on the fetched token would pass even
    // when the mutation never ran or threw and fell back to the seed.
    result: { data: { createSupersetGuestToken: { guestToken: 'refreshed-token' } } },
  },
]

const errorMock: TestMocksType = [
  { request: { query: SupersetDashboardsDocument }, error: new Error('boom') },
]

const renderAnalytics = (mocks: TestMocksType = successMock) =>
  render(
    <Dashboard
      contentTitle="Analytics title"
      dashboardTitle="Lago Dashboard"
      dashboardTitleTestKey="superset-dashboard-test-name-analytics"
    />,
    { mocks },
  )

const renderRevenue = (mocks: TestMocksType = successMock) =>
  render(
    <Dashboard
      contentTitle="Revenue title"
      dashboardTitle="Revenue Recognition"
      dashboardTitleTestKey="superset-dashboard-test-name-revenue-recognition"
    />,
    { mocks },
  )

// Whether `promise` has settled once microtasks and 0ms timers have flushed.
// Racing against an already-resolved sentinel instead would always pick the
// sentinel, so such an assertion could never fail.
const hasSettled = async (promise: Promise<unknown>): Promise<boolean> => {
  let settled = false

  promise.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    },
  )

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })

  return settled
}

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsFeatureFlagActive.mockReturnValue(false)
    mockGetItemFromLS.mockReturnValue(undefined)
    mockEmbedDashboard.mockResolvedValue({
      unmount: mockUnmount,
      observeDataMask: mockObserveDataMask,
    })
  })

  describe('GIVEN the dashboards query resolves', () => {
    it('THEN renders the content title and a per-dashboard mount node', async () => {
      renderAnalytics()

      expect(screen.getByText('Analytics title')).toBeInTheDocument()
      // Mount id is derived from the title, not a shared global "superset" id.
      expect(screen.getByTestId(DASHBOARD_MOUNT_TEST_ID).id).toBe('superset-lago-dashboard')
    })

    it('THEN embeds the resolved dashboard with the correct config', async () => {
      renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      const config = mockEmbedDashboard.mock.calls[0][0]

      expect(config.id).toBe('embed-1')
      expect(config.supersetDomain).toBe('https://localhost:8089')
      expect(config.mountPoint).toBe(document.getElementById('superset-lago-dashboard'))
      expect(config.dashboardUiConfig.hideTitle).toBe(true)
      // Proves the token came from the mutation, not from the query's seed.
      await expect(config.fetchGuestToken()).resolves.toBe('refreshed-token')
    })
  })

  describe('GIVEN the dashboards query errors', () => {
    it('THEN renders the error placeholder and does not embed', async () => {
      renderAnalytics(errorMock)

      expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      expect(mockEmbedDashboard).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN filter persistence is disabled', () => {
    it('THEN does not emit data masks nor observe filter changes', async () => {
      mockIsFeatureFlagActive.mockReturnValue(false)

      renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      expect(mockEmbedDashboard.mock.calls[0][0].dashboardUiConfig.emitDataMasks).toBe(false)
      expect(mockObserveDataMask).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN filter persistence is enabled', () => {
    beforeEach(() => {
      mockIsFeatureFlagActive.mockReturnValue(true)
    })

    it('THEN reads saved filters from a dashboard-scoped key (no cross-dashboard leak)', async () => {
      renderAnalytics()
      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))
      expect(mockGetItemFromLS).toHaveBeenCalledWith(ANALYTICS_FILTERS_KEY)
      expect(mockGetItemFromLS).not.toHaveBeenCalledWith(REVENUE_FILTERS_KEY)
    })

    it('THEN the other dashboard reads from its own key', async () => {
      renderRevenue()
      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))
      expect(mockGetItemFromLS).toHaveBeenCalledWith(REVENUE_FILTERS_KEY)
      expect(mockGetItemFromLS).not.toHaveBeenCalledWith(ANALYTICS_FILTERS_KEY)
    })

    it('THEN passes saved filters to Superset as rison-encoded url params', async () => {
      const savedFilters = { 'NATIVE_FILTER-abc': { filterState: { value: ['EUR'] } } }

      mockGetItemFromLS.mockImplementation((key: string) =>
        key === ANALYTICS_FILTERS_KEY ? savedFilters : undefined,
      )

      renderAnalytics()
      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      const config = mockEmbedDashboard.mock.calls[0][0]

      expect(config.dashboardUiConfig.emitDataMasks).toBe(true)
      expect(typeof config.dashboardUiConfig.urlParams.native_filters).toBe('string')
      expect(config.dashboardUiConfig.urlParams.native_filters.length).toBeGreaterThan(0)
    })

    it('THEN persists observed filter changes under the dashboard-scoped key', async () => {
      renderAnalytics()
      await waitFor(() => expect(mockObserveDataMask).toHaveBeenCalledTimes(1))

      const observeCallback = mockObserveDataMask.mock.calls[0][0]

      observeCallback({ 'NATIVE_FILTER-abc': { filterState: { value: ['EUR'] } } })

      // Save is debounced (500ms) — wait for it to flush.
      await waitFor(
        () =>
          expect(mockSetItemFromLS).toHaveBeenCalledWith(
            ANALYTICS_FILTERS_KEY,
            expect.objectContaining({ 'NATIVE_FILTER-abc': expect.anything() }),
          ),
        { timeout: 1500 },
      )
    })
  })

  describe('GIVEN the component unmounts', () => {
    it('THEN tears down the embedded dashboard', async () => {
      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      unmount()

      expect(mockUnmount).toHaveBeenCalled()
    })

    // The SDK's `unmount()` only clears the iframe (`index.js:159-163`); it never
    // cancels the refresh `setTimeout` it scheduled, so cleanup has to cancel the
    // fetcher too. Without that, the chain keeps minting tokens for the rest of the
    // SPA session — every revisit or dashboard switch leaving another one behind.
    it('THEN cancels the guest token fetcher so the refresh chain stops', async () => {
      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      const { fetchGuestToken } = mockEmbedDashboard.mock.calls[0][0]

      unmount()

      // A cancelled fetcher deliberately never settles — that is the only way to
      // halt a chain that re-arms from our resolution. Settling here means cleanup
      // left the loop alive: the mutation mock would have resolved it.
      expect(await hasSettled(fetchGuestToken())).toBe(false)
    })

    // The SDK puts its iframe in the DOM before `embedDashboard` resolves, so an
    // embed still in flight at cleanup time has to be unmounted once it lands —
    // otherwise the iframe is orphaned with its Switchboard port open. StrictMode
    // hits this on every dev mount.
    it('THEN tears down an embed that only resolves after cleanup ran', async () => {
      let resolveEmbed: (value: unknown) => void = () => {}

      mockEmbedDashboard.mockReturnValue(
        new Promise((resolve) => {
          resolveEmbed = resolve
        }),
      )

      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      unmount()
      expect(mockUnmount).not.toHaveBeenCalled()

      resolveEmbed({ unmount: mockUnmount, observeDataMask: mockObserveDataMask })

      await waitFor(() => expect(mockUnmount).toHaveBeenCalledTimes(1))
      // The late embed must not wire up filter observation either.
      expect(mockObserveDataMask).not.toHaveBeenCalled()
    })
  })
})
