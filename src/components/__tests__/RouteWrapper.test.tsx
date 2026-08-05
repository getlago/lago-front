import { configure, render, screen, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { ERROR_FALLBACK_TEST_ID } from '~/components/ErrorFallback'
import { RouteWrapper } from '~/components/RouteWrapper'
import type { CustomRouteObject } from '~/core/router'

configure({ testIdAttribute: 'data-test' })

const mockNavigate = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockSetMainRouterUrl = jest.fn()
let mockMainRouterUrl = ''

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_TAB_PARAMS: 'devtool-tab',
  useDeveloperTool: () => ({
    mainRouterUrl: mockMainRouterUrl,
    setMainRouterUrl: mockSetMainRouterUrl,
  }),
}))

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => ({
    isAuthenticated: true,
  }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    onRouteEnter: jest.fn(),
  }),
}))

const TEST_SLUG = 'test-slug'

let mockRoutes: CustomRouteObject[] = []

jest.mock('~/core/router', () => ({
  get routes() {
    return mockRoutes
  },
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    // First segment of `pathname` is treated as the active org slug by
    // RouteWrapper's MemoryRouter→BrowserRouter bridge.
    pathname: `/${TEST_SLUG}/api-keys`,
    strippedPathname: '/api-keys',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}))

const PAGE_TEST_ID = 'route-page'

const CrashingPage = (): ReactNode => {
  throw new Error('route render exploded')
}

// A page that received a GraphQL error from Apollo: `errorPolicy: 'all'` returns
// it on the hook result instead of throwing, so the page renders its own state.
const PageWithQueryError = () => <div data-test={PAGE_TEST_ID}>query failed, own placeholder</div>

describe('RouteWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMainRouterUrl = ''
    mockRoutes = []
  })

  describe('mainRouterUrl navigation effect', () => {
    describe('GIVEN mainRouterUrl is empty', () => {
      describe('WHEN RouteWrapper renders', () => {
        it('THEN it should not trigger navigation', () => {
          mockMainRouterUrl = ''

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          expect(mockNavigate).not.toHaveBeenCalled()
          expect(mockSetMainRouterUrl).not.toHaveBeenCalled()
        })
      })
    })

    describe('GIVEN mainRouterUrl has a value', () => {
      describe('WHEN RouteWrapper renders', () => {
        it('THEN it should navigate to that URL and reset mainRouterUrl', async () => {
          mockMainRouterUrl = '/api-keys/create'

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/${TEST_SLUG}/api-keys/create`, {
              skipSlugPrepend: true,
            })
            expect(mockSetMainRouterUrl).toHaveBeenCalledWith('')
          })
        })
      })
    })

    describe('GIVEN mainRouterUrl is set to webhook edit route', () => {
      describe('WHEN RouteWrapper renders', () => {
        it('THEN it should navigate to the webhook edit page', async () => {
          mockMainRouterUrl = '/webhook/123/edit'

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/${TEST_SLUG}/webhook/123/edit`, {
              skipSlugPrepend: true,
            })
            expect(mockSetMainRouterUrl).toHaveBeenCalledWith('')
          })
        })
      })
    })

    describe('GIVEN mainRouterUrl is set to api keys edit route', () => {
      describe('WHEN RouteWrapper renders', () => {
        it('THEN it should navigate to the api keys edit page', async () => {
          mockMainRouterUrl = '/api-keys/456/edit'

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/${TEST_SLUG}/api-keys/456/edit`, {
              skipSlugPrepend: true,
            })
            expect(mockSetMainRouterUrl).toHaveBeenCalledWith('')
          })
        })
      })
    })
  })

  describe('rendering', () => {
    describe('GIVEN valid router context', () => {
      describe('WHEN RouteWrapper is rendered', () => {
        it('THEN it should render without crashing', () => {
          mockMainRouterUrl = ''

          const { container } = render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          expect(container).toBeDefined()
        })
      })
    })
  })

  describe('route error boundary', () => {
    describe('GIVEN a route that throws while rendering', () => {
      describe('WHEN RouteWrapper renders it', () => {
        it('THEN it should show the error placeholder instead of a blank screen', () => {
          mockRoutes = [{ path: '*', element: <CrashingPage /> }]

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          expect(screen.getByTestId(ERROR_FALLBACK_TEST_ID)).toBeInTheDocument()
        })

        it('THEN it should not add a toast on top of the placeholder', () => {
          mockRoutes = [{ path: '*', element: <CrashingPage /> }]

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          expect(mockAddToast).not.toHaveBeenCalled()
        })
      })
    })

    describe('GIVEN a route whose query returned a GraphQL error', () => {
      describe('WHEN RouteWrapper renders it', () => {
        it('THEN it should render the page, not the route error placeholder', () => {
          mockRoutes = [{ path: '*', element: <PageWithQueryError /> }]

          render(
            <MemoryRouter>
              <RouteWrapper />
            </MemoryRouter>,
          )

          expect(screen.getByTestId(PAGE_TEST_ID)).toBeInTheDocument()
          expect(screen.queryByTestId(ERROR_FALLBACK_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })
  })
})
