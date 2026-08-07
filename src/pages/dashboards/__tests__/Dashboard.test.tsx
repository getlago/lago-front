import { screen, waitFor } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { getItemFromLS } from '~/core/utils/localStorage'
import { SupersetDashboardsDocument } from '~/generated/graphql'
import { render, testMockNavigateFn, TestMocksType } from '~/test-utils'

import Dashboard, { DASHBOARD_MOUNT_TEST_ID } from '../Dashboard'

// --- Superset SDK -----------------------------------------------------------
const mockUnmount = jest.fn()
const mockEmbedDashboard = jest.fn()

jest.mock('@superset-ui/embedded-sdk', () => ({
  embedDashboard: (...args: unknown[]) => mockEmbedDashboard(...args),
}))

// --- State sync module ------------------------------------------------------
// Mocked so this file only asserts the wiring; the engine has its own tests.
const mockAttachDashboardStateSync = jest.fn()
const mockDetachStateSync = jest.fn()

jest.mock('~/pages/dashboards/dashboardStateSync', () => ({
  // Spread the real module so a rename of DASHBOARD_STATE_SEARCH_PARAM cannot
  // leave this suite green against a stale hardcoded name.
  ...jest.requireActual('~/pages/dashboards/dashboardStateSync'),
  attachDashboardStateSync: (...args: unknown[]) => mockAttachDashboardStateSync(...args),
}))

// `~/main.css` resolves to the real stylesheet (the `~/` alias wins over the
// css→styleMock mapper), which Jest can't parse — stub it out.
jest.mock('~/main.css', () => ({}))

// FinanceAssistantAnalyticsCta needs AiAgentProvider (mounted at App level, not in this tree)
jest.mock('~/components/aiAgent/FinanceAssistantAnalyticsCta', () => ({
  FinanceAssistantAnalyticsCta: () => null,
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
}))

const mockGetItemFromLS = jest.mocked(getItemFromLS)

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

const setUrl = (search: string): void => {
  window.history.replaceState({}, '', `/acme/analytics${search}`)
}

const renderAnalytics = (mocks: TestMocksType = successMock) =>
  render(
    <Dashboard
      contentTitle="Analytics title"
      dashboardTitle="Lago Dashboard"
      dashboardTitleTestKey="superset-dashboard-test-name-analytics"
    />,
    { mocks },
  )

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setUrl('')
    mockGetItemFromLS.mockReturnValue(undefined)
    mockAttachDashboardStateSync.mockReturnValue(mockDetachStateSync)
    mockEmbedDashboard.mockResolvedValue({
      unmount: mockUnmount,
      observeDataMask: jest.fn(),
      getActiveTabs: jest.fn(),
      getDashboardPermalink: jest.fn(),
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
      // Required for observeDataMask to fire at all.
      expect(config.dashboardUiConfig.emitDataMasks).toBe(true)
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

  describe('GIVEN no dashboard_state param', () => {
    it('THEN embeds without url params', async () => {
      renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      expect(mockEmbedDashboard.mock.calls[0][0].dashboardUiConfig.urlParams).toBeUndefined()
    })
  })

  describe('GIVEN a dashboard_state param', () => {
    it('THEN restores it as the superset permalink key', async () => {
      setUrl('?dashboard_state=AbCd1234')

      renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      expect(mockEmbedDashboard.mock.calls[0][0].dashboardUiConfig.urlParams).toEqual({
        permalink_key: 'AbCd1234',
      })
    })

    it('THEN seeds the state sync with it so reverting does not rewrite the url', async () => {
      setUrl('?dashboard_state=AbCd1234')

      renderAnalytics()

      await waitFor(() => expect(mockAttachDashboardStateSync).toHaveBeenCalledTimes(1))

      expect(mockAttachDashboardStateSync.mock.calls[0][0].initialKey).toBe('AbCd1234')
    })
  })

  describe('GIVEN the state sync reports a new key', () => {
    it('THEN replaces the url param without touching the others', async () => {
      setUrl('?other=keep-me')

      renderAnalytics()

      await waitFor(() => expect(mockAttachDashboardStateSync).toHaveBeenCalledTimes(1))

      const { onStateKey } = mockAttachDashboardStateSync.mock.calls[0][0]

      onStateKey('XyZ9')

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        { search: '?other=keep-me&dashboard_state=XyZ9' },
        { replace: true },
      )
    })

    it('THEN overwrites a previous key rather than appending', async () => {
      setUrl('?dashboard_state=old')

      renderAnalytics()

      await waitFor(() => expect(mockAttachDashboardStateSync).toHaveBeenCalledTimes(1))

      mockAttachDashboardStateSync.mock.calls[0][0].onStateKey('new')

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        { search: '?dashboard_state=new' },
        { replace: true },
      )
    })
  })

  describe('GIVEN the component unmounts', () => {
    it('THEN detaches the state sync and tears down the embedded dashboard', async () => {
      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockAttachDashboardStateSync).toHaveBeenCalledTimes(1))

      unmount()

      expect(mockDetachStateSync).toHaveBeenCalled()
      expect(mockUnmount).toHaveBeenCalled()
    })
  })

  describe('GIVEN the component unmounts before the embed resolves', () => {
    it('THEN unmounts the late instance and never attaches the state sync', async () => {
      let resolveEmbed: (value: unknown) => void = () => undefined

      mockEmbedDashboard.mockReturnValue(
        new Promise((resolve) => {
          resolveEmbed = resolve
        }),
      )

      const { unmount } = renderAnalytics()

      await waitFor(() => expect(mockEmbedDashboard).toHaveBeenCalledTimes(1))

      unmount()

      resolveEmbed({
        unmount: mockUnmount,
        observeDataMask: jest.fn(),
        getActiveTabs: jest.fn(),
        getDashboardPermalink: jest.fn(),
      })

      // Without it, the continuation would attach a 1 Hz poll onto an iframe
      // the cleanup could not reach, and nothing would ever clear it.
      await waitFor(() => expect(mockUnmount).toHaveBeenCalled())

      expect(mockAttachDashboardStateSync).not.toHaveBeenCalled()
    })
  })
})
