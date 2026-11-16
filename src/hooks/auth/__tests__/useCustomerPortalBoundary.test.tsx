import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode, StrictMode } from 'react'
import { MemoryRouter } from 'react-router'

import { useCustomerPortalBoundary } from '../useCustomerPortalBoundary'

const mockClient = { clearStore: jest.fn() }
const mockOnLeaveCustomerPortal = jest.fn()
const mockCustomerPortalTokenVar = jest.fn()
const mockCaptureException = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

jest.mock('~/core/apolloClient', () => ({
  customerPortalTokenVar: () => mockCustomerPortalTokenVar(),
  onLeaveCustomerPortal: (...args: unknown[]) => mockOnLeaveCustomerPortal(...args),
}))

const PORTAL_PATH = '/customer-portal/portal-token-abc'
const ADMIN_PATH = '/acme/customers'

const renderAt = (pathname: string, { strict = false }: { strict?: boolean } = {}) => {
  const routed = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>
  )
  const wrapper = strict
    ? ({ children }: { children: ReactNode }) => <StrictMode>{routed({ children })}</StrictMode>
    : routed

  return renderHook(() => useCustomerPortalBoundary(), { wrapper })
}

describe('useCustomerPortalBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLeaveCustomerPortal.mockResolvedValue(undefined)
  })

  describe('GIVEN a portal session is open', () => {
    beforeEach(() => {
      mockCustomerPortalTokenVar.mockReturnValue('portal-token-abc')
    })

    describe('WHEN the tab is on an admin route', () => {
      it('THEN should tear the portal session down', async () => {
        renderAt(ADMIN_PATH)

        await waitFor(() => {
          expect(mockOnLeaveCustomerPortal).toHaveBeenCalledWith(mockClient)
        })
      })

      // The app runs under StrictMode, which replays effects on mount.
      it('THEN should tear it down once when the effect is replayed', async () => {
        mockOnLeaveCustomerPortal.mockImplementation(async () => {
          mockCustomerPortalTokenVar.mockReturnValue(undefined)
        })

        renderAt(ADMIN_PATH, { strict: true })

        await waitFor(() => {
          expect(mockOnLeaveCustomerPortal).toHaveBeenCalledTimes(1)
        })
      })

      it('THEN should report a failing teardown instead of throwing', async () => {
        const failure = new Error('clearStore failed')

        mockOnLeaveCustomerPortal.mockRejectedValue(failure)

        renderAt(ADMIN_PATH)

        await waitFor(() => {
          expect(mockCaptureException).toHaveBeenCalledWith(failure)
        })
      })
    })

    describe('WHEN the tab is still inside the portal', () => {
      it.each([
        ['the portal root', PORTAL_PATH],
        ['a portal sub-route', `${PORTAL_PATH}/usage`],
      ])('THEN should do nothing on %s', (_label, pathname) => {
        renderAt(pathname)

        expect(mockOnLeaveCustomerPortal).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no portal session was ever opened', () => {
    // Every admin page render would otherwise clear the cache and cost a refetch.
    it('THEN should do nothing on an admin route', () => {
      mockCustomerPortalTokenVar.mockReturnValue(undefined)

      renderAt(ADMIN_PATH)

      expect(mockOnLeaveCustomerPortal).not.toHaveBeenCalled()
    })
  })
})
