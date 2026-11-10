import { configure, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import PortalInit from '../PortalInit'

configure({ testIdAttribute: 'data-test' })

const mockClearStore = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({
    clearStore: mockClearStore,
  }),
}))

const mockOnAccessCustomerPortal = jest.fn()
const mockPausePersistence = jest.fn()
const mockResumePersistence = jest.fn()
const mockPurgePersistedCache = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  onAccessCustomerPortal: (...args: unknown[]) => mockOnAccessCustomerPortal(...args),
  pausePersistence: (...args: unknown[]) => mockPausePersistence(...args),
  resumePersistence: (...args: unknown[]) => mockResumePersistence(...args),
  purgePersistedCache: (...args: unknown[]) => mockPurgePersistedCache(...args),
}))

jest.mock('~/pages/customerPortal/CustomerPortal', () => ({
  __esModule: true,
  default: () => <div data-test="mock-customer-portal">Customer Portal</div>,
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => <div data-test="mock-spinner">Loading...</div>,
}))

const MOCK_CUSTOMER_PORTAL_TEST_ID = 'mock-customer-portal'
const MOCK_SPINNER_TEST_ID = 'mock-spinner'

const renderWithToken = (token = 'test-token') => {
  return render(
    <MemoryRouter initialEntries={[`/portal/${token}`]}>
      <Routes>
        <Route path="/portal/:token" element={<PortalInit />} />
      </Routes>
    </MemoryRouter>,
  )
}

const renderWithoutToken = () => {
  return render(
    <MemoryRouter initialEntries={['/portal']}>
      <Routes>
        <Route path="/portal" element={<PortalInit />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PortalInit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockClearStore.mockResolvedValue(undefined)
  })

  describe('GIVEN a valid token is provided', () => {
    describe('WHEN the store clears successfully', () => {
      it('THEN should call onAccessCustomerPortal with the token', async () => {
        renderWithToken()

        await waitFor(() => {
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })
      })

      it('THEN should render CustomerPortal after initialization', async () => {
        renderWithToken()

        await waitFor(() => {
          expect(screen.getByTestId(MOCK_CUSTOMER_PORTAL_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should call clearStore before setting up the portal', async () => {
        renderWithToken()

        await waitFor(() => {
          expect(mockClearStore).toHaveBeenCalled()
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })
      })

      it('THEN should pause persistence and never purge the admin blob', async () => {
        renderWithToken()

        await waitFor(() => {
          expect(mockPausePersistence).toHaveBeenCalled()
        })
        expect(mockPurgePersistedCache).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the store clear fails', () => {
      it('THEN should still render CustomerPortal', async () => {
        mockClearStore.mockRejectedValue(new Error('Store clear failed'))

        renderWithToken()

        await waitFor(() => {
          expect(screen.getByTestId(MOCK_CUSTOMER_PORTAL_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should still call onAccessCustomerPortal with the token', async () => {
        mockClearStore.mockRejectedValue(new Error('Store clear failed'))

        renderWithToken()

        await waitFor(() => {
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })
      })
    })
  })

  describe('GIVEN the portal is left in the same tab', () => {
    describe('WHEN PortalInit unmounts', () => {
      it('THEN should drop the portal token', async () => {
        const { unmount } = renderWithToken()

        await waitFor(() => {
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })

        unmount()

        expect(mockOnAccessCustomerPortal).toHaveBeenLastCalledWith(undefined)
      })

      // Regression: `pausePersistence` on entry had no counterpart, so the admin
      // session kept running with persistence off after a same-tab return.
      it('THEN should clear the portal data before persistence resumes', async () => {
        const { unmount } = renderWithToken()

        await waitFor(() => {
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })

        const callOrder: string[] = []

        mockClearStore.mockClear()
        mockClearStore.mockImplementation(async () => {
          callOrder.push('clearStore')
        })
        mockResumePersistence.mockImplementation(() => {
          callOrder.push('resumePersistence')
        })

        unmount()

        await waitFor(() => {
          expect(callOrder).toEqual(['clearStore', 'resumePersistence'])
        })
      })

      it('THEN should resume persistence even when clearing the store fails', async () => {
        const { unmount } = renderWithToken()

        await waitFor(() => {
          expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith('test-token')
        })

        mockClearStore.mockRejectedValue(new Error('Store clear failed'))
        unmount()

        await waitFor(() => {
          expect(mockResumePersistence).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  describe('GIVEN no token is provided', () => {
    it('THEN should show the loading spinner', () => {
      renderWithoutToken()

      expect(screen.getByTestId(MOCK_SPINNER_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(MOCK_CUSTOMER_PORTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN should not call clearStore', () => {
      renderWithoutToken()

      expect(mockClearStore).not.toHaveBeenCalled()
    })

    it('THEN should not call onAccessCustomerPortal', () => {
      renderWithoutToken()

      expect(mockOnAccessCustomerPortal).not.toHaveBeenCalled()
    })
  })
})
