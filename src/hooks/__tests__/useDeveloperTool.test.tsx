import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import {
  DeveloperToolProvider,
  resetDevtoolsNavigation,
  useDeveloperTool,
} from '~/hooks/useDeveloperTool'

// Mock useCurrentUser — mutable so a cold cache (user still loading) can be simulated
let mockCurrentUser: { id: string } | undefined = { id: 'test-user' }

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    get currentUser() {
      return mockCurrentUser
    },
  }),
}))

// Mock usePanel
const mockOpenPanel = jest.fn()
const mockClosePanel = jest.fn()
const mockTogglePanel = jest.fn()

jest.mock('~/hooks/ui/usePanel', () => ({
  usePanel: () => ({
    panelOpen: false,
    openPanel: mockOpenPanel,
    closePanel: mockClosePanel,
    togglePanel: mockTogglePanel,
  }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <DeveloperToolProvider>{children}</DeveloperToolProvider>
  </MemoryRouter>
)

describe('useDeveloperTool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/')
    mockCurrentUser = { id: 'test-user' }
  })

  describe('DeveloperToolProvider', () => {
    describe('GIVEN the hook is used within the provider', () => {
      describe('WHEN the hook is called', () => {
        it('THEN it should provide all context values', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          expect(result.current).toHaveProperty('url')
          expect(result.current).toHaveProperty('setUrl')
          expect(result.current).toHaveProperty('mainRouterUrl')
          expect(result.current).toHaveProperty('setMainRouterUrl')
          expect(result.current).toHaveProperty('openPanel')
          expect(result.current).toHaveProperty('closePanel')
        })

        it('THEN url should be initialized as empty string', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          expect(result.current.url).toBe('')
        })

        it('THEN mainRouterUrl should be initialized as empty string', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          expect(result.current.mainRouterUrl).toBe('')
        })
      })
    })

    describe('GIVEN the hook is used outside the provider', () => {
      describe('WHEN the hook is called', () => {
        it('THEN it should throw an error', () => {
          const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

          // Note: The hook uses useNavigate() which requires Router context,
          // so Router error is thrown before the DeveloperToolProvider context check
          expect(() => {
            renderHook(() => useDeveloperTool())
          }).toThrow()

          consoleSpy.mockRestore()
        })
      })
    })
  })

  describe('setUrl (MemoryRouter navigation)', () => {
    describe('GIVEN the hook is initialized', () => {
      describe('WHEN setUrl is called with a path', () => {
        it('THEN url state should be updated to that path', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setUrl('/devtool/webhooks')
          })

          expect(result.current.url).toBe('/devtool/webhooks')
        })
      })

      describe('WHEN setUrl is called multiple times', () => {
        it('THEN url state should reflect the latest value', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setUrl('/devtool/webhooks')
          })
          expect(result.current.url).toBe('/devtool/webhooks')

          act(() => {
            result.current.setUrl('/devtool/events')
          })
          expect(result.current.url).toBe('/devtool/events')
        })
      })
    })
  })

  describe('setMainRouterUrl (BrowserRouter navigation)', () => {
    describe('GIVEN the hook is initialized', () => {
      describe('WHEN setMainRouterUrl is called with a path', () => {
        it('THEN mainRouterUrl state should be updated to that path', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setMainRouterUrl('/api-keys/create')
          })

          expect(result.current.mainRouterUrl).toBe('/api-keys/create')
        })
      })

      describe('WHEN setMainRouterUrl is called multiple times', () => {
        it('THEN mainRouterUrl state should reflect the latest value', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setMainRouterUrl('/api-keys/create')
          })
          expect(result.current.mainRouterUrl).toBe('/api-keys/create')

          act(() => {
            result.current.setMainRouterUrl('/webhook/create')
          })
          expect(result.current.mainRouterUrl).toBe('/webhook/create')
        })
      })

      describe('WHEN setMainRouterUrl is called with empty string', () => {
        it('THEN mainRouterUrl should be reset to empty', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setMainRouterUrl('/api-keys/create')
          })
          expect(result.current.mainRouterUrl).toBe('/api-keys/create')

          act(() => {
            result.current.setMainRouterUrl('')
          })
          expect(result.current.mainRouterUrl).toBe('')
        })
      })
    })
  })

  describe('checkParamsFromUrl (devtool-tab bridge)', () => {
    const openWith = (devtoolTab: string) => {
      const params = new URLSearchParams({ 'devtool-tab': devtoolTab })

      window.history.replaceState({}, '', `/?${params.toString()}`)

      return renderHook(() => useDeveloperTool(), { wrapper })
    }

    describe('GIVEN a copied link whose devtools address carries search params', () => {
      describe('WHEN the hook mounts', () => {
        it('THEN it should reopen the panel on the full address, search string included', () => {
          const address =
            '/devtool/events/transaction-1?externalSubscriptionId=subscription-1&timestampMs=1740000000123&code=api_calls'

          const { result } = openWith(address)

          expect(result.current.url).toBe(address)
          expect(mockOpenPanel).toHaveBeenCalled()
        })
      })
    })

    describe('GIVEN a devtools address containing a percent-encoded character', () => {
      describe('WHEN the hook mounts', () => {
        it('THEN it should not decode it a second time', () => {
          const address = '/devtool/events/transaction%3F1?code=api_calls'

          const { result } = openWith(address)

          expect(result.current.url).toBe(address)
        })
      })
    })

    describe('GIVEN a cold cache, with the user still loading', () => {
      describe('WHEN the hook mounts', () => {
        it('THEN it should not open the panel yet', () => {
          mockCurrentUser = undefined

          const { result } = openWith('/devtool/events')

          expect(mockOpenPanel).not.toHaveBeenCalled()
          expect(result.current.url).toBe('')
        })

        it('THEN it should still open the panel once the user lands', () => {
          mockCurrentUser = undefined

          const { result, rerender } = openWith('/devtool/events')

          // The param used to be consumed on that first render, so the link was thrown away
          // before it could open anything.
          mockCurrentUser = { id: 'test-user' }
          rerender()

          expect(mockOpenPanel).toHaveBeenCalled()
          expect(result.current.url).toBe('/devtool/events')
        })
      })
    })

    describe('GIVEN no devtool-tab param', () => {
      describe('WHEN the hook mounts', () => {
        it('THEN it should not open the panel', () => {
          renderHook(() => useDeveloperTool(), { wrapper })

          expect(mockOpenPanel).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('resetDevtoolsNavigation', () => {
    describe('GIVEN the devtools has navigated to a specific tab', () => {
      describe('WHEN resetDevtoolsNavigation is called', () => {
        it('THEN url should be reset to default devtool route and panel should close', () => {
          const { result } = renderHook(() => useDeveloperTool(), { wrapper })

          act(() => {
            result.current.setUrl('/devtool/webhooks')
          })

          act(() => {
            resetDevtoolsNavigation()
          })

          expect(result.current.url).toBe('/devtool')
          expect(mockClosePanel).toHaveBeenCalled()
        })
      })
    })
  })
})
