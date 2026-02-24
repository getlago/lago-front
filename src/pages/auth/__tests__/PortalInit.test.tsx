import { act, render, waitFor } from '@testing-library/react'

import PortalInit from '../PortalInit'

const SPINNER_TEST_ID = 'portal-init-spinner'
const CUSTOMER_PORTAL_TEST_ID = 'customer-portal'

const mockOnAccessCustomerPortal = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  onAccessCustomerPortal: (...args: unknown[]) => mockOnAccessCustomerPortal(...args),
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => <div data-test={SPINNER_TEST_ID} />,
}))

jest.mock('~/pages/customerPortal/CustomerPortal', () => ({
  __esModule: true,
  default: () => <div data-test={CUSTOMER_PORTAL_TEST_ID} />,
}))

const mockClearStore = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({
    clearStore: mockClearStore,
  }),
}))

const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}))

const getByDataTest = (testId: string) => document.querySelector(`[data-test="${testId}"]`)
const queryByDataTest = (testId: string) => document.querySelector(`[data-test="${testId}"]`)

describe('PortalInit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no token parameter is present', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({})
    })

    it('WHEN the component renders THEN it shows the Spinner', () => {
      render(<PortalInit />)

      expect(getByDataTest(SPINNER_TEST_ID)).toBeInTheDocument()
      expect(queryByDataTest(CUSTOMER_PORTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT call clearStore', () => {
      render(<PortalInit />)

      expect(mockClearStore).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a token parameter is present', () => {
    const token = 'test-portal-token'

    beforeEach(() => {
      mockUseParams.mockReturnValue({ token })
    })

    it('WHEN the component renders THEN it shows the Spinner initially before clearStore completes', () => {
      // GIVEN clearStore returns a promise that never resolves
      mockClearStore.mockReturnValue(new Promise(() => {}))

      render(<PortalInit />)

      // THEN Spinner is shown while waiting
      expect(getByDataTest(SPINNER_TEST_ID)).toBeInTheDocument()
      expect(queryByDataTest(CUSTOMER_PORTAL_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN it calls client.clearStore()', () => {
      mockClearStore.mockResolvedValue(undefined)

      render(<PortalInit />)

      expect(mockClearStore).toHaveBeenCalledTimes(1)
    })

    it('WHEN clearStore resolves THEN it calls onAccessCustomerPortal with the token', async () => {
      mockClearStore.mockResolvedValue(undefined)

      await act(async () => {
        render(<PortalInit />)
      })

      await waitFor(() => {
        expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith(token)
      })
    })

    it('WHEN clearStore rejects THEN it still calls onAccessCustomerPortal with the token', async () => {
      mockClearStore.mockRejectedValue(new Error('clearStore failed'))

      await act(async () => {
        render(<PortalInit />)
      })

      await waitFor(() => {
        expect(mockOnAccessCustomerPortal).toHaveBeenCalledWith(token)
      })
    })

    it('WHEN clearStore completes THEN it renders CustomerPortal', async () => {
      mockClearStore.mockResolvedValue(undefined)

      await act(async () => {
        render(<PortalInit />)
      })

      await waitFor(() => {
        expect(getByDataTest(CUSTOMER_PORTAL_TEST_ID)).toBeInTheDocument()
      })

      expect(queryByDataTest(SPINNER_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
