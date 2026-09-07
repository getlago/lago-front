import { EmbedDashboardParams, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { act, screen, waitFor } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { getItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { SupersetDashboardsDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import Dashboard, { DASHBOARD_MOUNT_TEST_ID, DashboardProps } from '../Dashboard'

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
]

const errorMock: TestMocksType = [
  { request: { query: SupersetDashboardsDocument }, error: new Error('boom') },
]

const analyticsProps: DashboardProps = {
  contentTitle: 'Analytics title',
  dashboardTitle: 'Lago Dashboard',
  dashboardTitleTestKey: 'superset-dashboard-test-name-analytics',
}

const renderAnalytics = (mocks: TestMocksType = successMock): ReturnType<typeof render> =>
  render(<Dashboard {...analyticsProps} />, { mocks })

const deferEmbed = (): {
  instance: jest.Mocked<EmbeddedDashboard>
  resolve: () => void
} => {
  const instance: jest.Mocked<EmbeddedDashboard> = {
    unmount: jest.fn(),
    observeDataMask: jest.fn(),
    getScrollSize: jest.fn(),
    getDashboardPermalink: jest.fn(),
    getActiveTabs: jest.fn(),
    getDataMask: jest.fn(),
    getChartStates: jest.fn(),
    getChartDataPayloads: jest.fn(),
    setThemeConfig: jest.fn(),
    setThemeMode: jest.fn(),
  }
  let resolve!: () => void
  const promise = new Promise<EmbeddedDashboard>((resolveInstance) => {
    resolve = () => resolveInstance(instance)
  })

  mockEmbedDashboard.mockImplementationOnce(({ id, mountPoint }: EmbedDashboardParams) => {
    const iframe = document.createElement('iframe')

    iframe.title = id
    mountPoint.replaceChildren(iframe)
    instance.unmount.mockImplementation(() => mountPoint.replaceChildren())

    return promise
  })

  return { instance, resolve }
}

const renderRevenue = (mocks: TestMocksType = successMock) =>
  render(
    <Dashboard
      contentTitle="Revenue title"
      dashboardTitle="Revenue Recognition"
      dashboardTitleTestKey="superset-dashboard-test-name-revenue-recognition"
    />,
    { mocks },
  )

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

  afterEach(() => {
    jest.useRealTimers()
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
      expect(screen.getByTestId(DASHBOARD_MOUNT_TEST_ID)).toContainElement(config.mountPoint)
      expect(config.dashboardUiConfig.hideTitle).toBe(true)
      await expect(config.fetchGuestToken()).resolves.toBe('token-1')
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

  describe('GIVEN dashboard embedding is still pending', () => {
    beforeEach(() => {
      mockIsFeatureFlagActive.mockReturnValue(true)
    })

    it('WHEN the component unmounts THEN disposes a late instance without observing filters', async () => {
      const pending = deferEmbed()
      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      unmount()

      await act(async () => pending.resolve())

      expect(pending.instance.unmount).toHaveBeenCalledTimes(1)
      expect(pending.instance.observeDataMask).not.toHaveBeenCalled()
    })

    it.each(['oldest first', 'newest first'])(
      'WHEN two switches complete %s THEN keeps the current dashboard mounted',
      async (completionOrder) => {
        const first = deferEmbed()
        const second = deferEmbed()
        const current = deferEmbed()
        const { rerender, unmount } = renderAnalytics()

        await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

        mockGetItemFromLS.mockImplementation((key: string) =>
          key === analyticsProps.dashboardTitleTestKey ? 'Revenue Recognition' : undefined,
        )
        rerender(<Dashboard {...analyticsProps} />)
        await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(2))

        mockGetItemFromLS.mockReturnValue(undefined)
        rerender(<Dashboard {...analyticsProps} />)
        await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(3))

        const currentIframe = screen.getByTitle('embed-1')
        const completions =
          completionOrder === 'oldest first' ? [first, second, current] : [current, second, first]

        for (const pending of completions) {
          await act(async () => pending.resolve())
          expect(currentIframe).toBeInTheDocument()
          expect(
            screen.getByTestId(DASHBOARD_MOUNT_TEST_ID).querySelectorAll('iframe'),
          ).toHaveLength(1)
        }

        expect(first.instance.unmount).toHaveBeenCalledTimes(1)
        expect(second.instance.unmount).toHaveBeenCalledTimes(1)
        expect(first.instance.observeDataMask).not.toHaveBeenCalled()
        expect(second.instance.observeDataMask).not.toHaveBeenCalled()
        expect(current.instance.observeDataMask).toHaveBeenCalledTimes(1)
        expect(current.instance.unmount).not.toHaveBeenCalled()

        unmount()

        expect(current.instance.unmount).toHaveBeenCalledTimes(1)
      },
    )
  })

  describe('GIVEN the component unmounts', () => {
    it('THEN cancels pending filter saves and ignores late data masks', async () => {
      mockIsFeatureFlagActive.mockReturnValue(true)

      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockObserveDataMask).toHaveBeenCalledTimes(1))

      jest.useFakeTimers()

      const observeCallback = mockObserveDataMask.mock.calls[0][0]
      const dataMask = { 'NATIVE_FILTER-abc': { filterState: { value: ['EUR'] } } }

      observeCallback(dataMask)
      unmount()
      jest.runOnlyPendingTimers()

      expect(mockSetItemFromLS).not.toHaveBeenCalled()

      observeCallback(dataMask)
      jest.runOnlyPendingTimers()

      expect(mockSetItemFromLS).not.toHaveBeenCalled()
    })

    it('THEN tears down the embedded dashboard', async () => {
      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      unmount()

      expect(mockUnmount).toHaveBeenCalled()
    })
  })
})
