import { configure, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  DEVTOOLS_COPY_INSPECTOR_LINK_TEST_ID,
  DevtoolsView,
} from '~/components/developers/DevtoolsView'
import { currentOrganizationVar } from '~/core/apolloClient/reactiveVars/currentOrganizationVar'

configure({ testIdAttribute: 'data-test' })

const mockCopyToClipboard = jest.fn()
const mockLocation = { pathname: '/devtool/events/transaction-1', search: '' }

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: (value: string) => mockCopyToClipboard(value),
}))

jest.mock('~/core/apolloClient', () => ({
  addToast: jest.fn(),
}))

jest.mock('~/core/router', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => jest.fn(),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => true }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_TAB_PARAMS: 'devtool-tab',
  DEFAULT_RESIZABLE_HEIGHT: 40,
  MIN_RESIZABLE_HEIGHT: 20,
  MAX_RESIZABLE_HEIGHT: 90,
  FULLSCREEN: 100,
  useDeveloperTool: () => ({
    panelRef: { current: null },
    panelOpen: true,
    isFullscreen: false,
    expandPanel: jest.fn(),
    resizePanel: jest.fn(),
    closePanel: jest.fn(),
    url: '',
    setUrl: jest.fn(),
  }),
}))

jest.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PanelResizeHandle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('~/components/designSystem/NavigationTab', () => ({
  NavigationTab: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabManagedBy: { URL: 'url' },
}))

jest.mock('~/components/developers/DevtoolsRouter', () => ({
  DevtoolsRouter: () => <div data-test="devtools-router-mock" />,
  devToolsNavigationMapping: () => [],
}))

const copiedInspectorLink = async (): Promise<URL> => {
  const user = userEvent.setup()

  render(<DevtoolsView />)
  await user.click(screen.getByTestId(DEVTOOLS_COPY_INSPECTOR_LINK_TEST_ID))

  return new URL(mockCopyToClipboard.mock.calls[0][0])
}

describe('DevtoolsView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/customers')
    mockLocation.search = ''
    currentOrganizationVar('organization-1')
  })

  afterEach(() => {
    currentOrganizationVar(null)
  })

  describe('GIVEN the events tab has an event selected', () => {
    describe('WHEN copying the inspector link', () => {
      it('THEN it should carry the panel search params, which hold three of the four key fields', async () => {
        mockLocation.search =
          '?externalSubscriptionId=subscription-1&timestampMs=1740000000123&code=api_calls'

        const link = await copiedInspectorLink()

        expect(link.searchParams.get('devtool-tab')).toBe(
          '/devtool/events/transaction-1?externalSubscriptionId=subscription-1&timestampMs=1740000000123&code=api_calls',
        )
      })

      it('THEN it should keep the page the user is on', async () => {
        mockLocation.search = '?code=api_calls'

        const link = await copiedInspectorLink()

        expect(link.pathname).toBe('/customers')
      })
    })
  })

  describe('GIVEN a devtools tab without search params', () => {
    describe('WHEN copying the inspector link', () => {
      it('THEN it should carry the pathname alone, with no trailing question mark', async () => {
        const link = await copiedInspectorLink()

        expect(link.searchParams.get('devtool-tab')).toBe('/devtool/events/transaction-1')
      })
    })
  })

  describe('GIVEN the current organization is not known yet', () => {
    describe('WHEN the panel renders', () => {
      it('THEN it should not render the devtools routes', () => {
        currentOrganizationVar(null)

        render(<DevtoolsView />)

        // Every devtools tab queries org-scoped data. The `x-lago-organization` header is
        // built from this var, so rendering the routes before it is set fires the queries
        // without it and the API rejects them with "Missing organization id".
        expect(screen.queryByTestId('devtools-router-mock')).not.toBeInTheDocument()
      })

      it('THEN it should still render the panel chrome', () => {
        currentOrganizationVar(null)

        render(<DevtoolsView />)

        expect(screen.getByTestId(DEVTOOLS_COPY_INSPECTOR_LINK_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the current organization is known', () => {
    describe('WHEN the panel renders', () => {
      it('THEN it should render the devtools routes', () => {
        render(<DevtoolsView />)

        expect(screen.getByTestId('devtools-router-mock')).toBeInTheDocument()
      })
    })
  })
})
