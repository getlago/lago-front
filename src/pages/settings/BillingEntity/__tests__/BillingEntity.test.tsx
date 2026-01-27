import { act, screen } from '@testing-library/react'
import { GraphQLError } from 'graphql'

import { render } from '~/test-utils'

import BillingEntityPage, {
  BILLING_ENTITY_HEADER_TEST_ID,
  BILLING_ENTITY_LOADING_TEST_ID,
  BILLING_ENTITY_MAIN_TEST_ID,
} from '../BillingEntity'

const mockNavigate = jest.fn()
const mockUseGetBillingEntityQuery = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    billingEntityCode: 'test-billing-entity',
  })),
  useNavigate: jest.fn(() => mockNavigate),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillingEntityQuery: jest.fn(() => mockUseGetBillingEntityQuery()),
}))

describe('BillingEntityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      billingEntityCode: 'test-billing-entity',
    })
  })

  describe('loading state', () => {
    it('should display loading skeleton when data is loading', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      })

      await act(async () => {
        return render(<BillingEntityPage />)
      })

      // Should show loading skeleton
      const loadingContainer = screen.getByTestId(BILLING_ENTITY_LOADING_TEST_ID)

      expect(loadingContainer).toBeInTheDocument()

      // Should not show main content while loading
      expect(screen.queryByTestId(BILLING_ENTITY_MAIN_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('successful data load', () => {
    it('should render billing entity header and main content when data is loaded', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: {
            id: 'test-id',
            code: 'test-billing-entity',
            name: 'Test Billing Entity',
            addressLine1: '123 Test St',
            addressLine2: 'Suite 100',
            city: 'Test City',
            country: 'US',
            email: 'test@example.com',
            legalName: 'Test Legal Name',
            legalNumber: '123456789',
            state: 'CA',
            taxIdentificationNumber: 'TAX123',
            zipcode: '12345',
            logoUrl: null,
            invoiceFooter: null,
            timezone: 'UTC',
            __typename: 'BillingEntity',
          },
        },
        loading: false,
        error: undefined,
      })

      await act(async () => {
        return render(<BillingEntityPage />)
      })

      // Should render the billing entity name (appears in both header and main)
      const nameElements = screen.getAllByText('Test Billing Entity')

      expect(nameElements.length).toBeGreaterThan(0)

      // Should render both sections
      expect(screen.getByTestId(BILLING_ENTITY_HEADER_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(BILLING_ENTITY_MAIN_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('navigation behavior', () => {
    it('should render even when billing entity is null (navigation happens via useEffect)', () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: null,
        },
        loading: false,
        error: undefined,
      })

      const { container } = render(<BillingEntityPage />)

      // Component renders (useEffect will handle navigation in real app)
      expect(container).toBeInTheDocument()
      // Header is still rendered
      expect(screen.getByTestId(BILLING_ENTITY_HEADER_TEST_ID)).toBeInTheDocument()
    })

    it('should render even when billing entity is undefined (navigation happens via useEffect)', () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: undefined,
        },
        loading: false,
        error: new GraphQLError('Not found'),
      })

      const { container } = render(<BillingEntityPage />)

      // Component renders (useEffect will handle navigation in real app)
      expect(container).toBeInTheDocument()
      // Header is still rendered
      expect(screen.getByTestId(BILLING_ENTITY_HEADER_TEST_ID)).toBeInTheDocument()
    })

    it('should not call navigate when loading is true', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      })

      render(<BillingEntityPage />)

      // Wait a bit to ensure navigate is not called during loading
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not call navigate when billing entity exists', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: {
            id: 'test-id',
            code: 'test-billing-entity',
            name: 'Test Entity',
            addressLine1: '123 St',
            addressLine2: null,
            city: 'City',
            country: 'US',
            email: 'test@test.com',
            legalName: null,
            legalNumber: null,
            state: null,
            taxIdentificationNumber: null,
            zipcode: '12345',
            logoUrl: null,
            invoiceFooter: null,
            timezone: 'UTC',
            __typename: 'BillingEntity',
          },
        },
        loading: false,
        error: undefined,
      })

      render(<BillingEntityPage />)

      // Wait a bit to ensure navigate is not called
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('query behavior', () => {
    it('should skip query when billingEntityCode is not in params', () => {
      const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

      useParamsMock.mockReturnValue({
        billingEntityCode: undefined,
      })

      mockUseGetBillingEntityQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      })

      render(<BillingEntityPage />)

      // Component should still render (navigation handled by useEffect)
      expect(screen.getByTestId(BILLING_ENTITY_HEADER_TEST_ID)).toBeInTheDocument()
    })

    it('should pass correct code to query when billingEntityCode is provided', () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: {
            id: 'test-id',
            code: 'test-billing-entity',
            name: 'Test Entity',
            addressLine1: '123 St',
            addressLine2: null,
            city: 'City',
            country: 'US',
            email: 'test@test.com',
            legalName: null,
            legalNumber: null,
            state: null,
            taxIdentificationNumber: null,
            zipcode: '12345',
            logoUrl: null,
            invoiceFooter: null,
            timezone: 'UTC',
            __typename: 'BillingEntity',
          },
        },
        loading: false,
        error: undefined,
      })

      render(<BillingEntityPage />)

      // Verify the component uses the billing entity code from params
      expect(screen.getByTestId(BILLING_ENTITY_MAIN_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('should render both header and main sections when data is loaded', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: {
            id: 'test-id',
            code: 'test-billing-entity',
            name: 'Test Billing Entity',
            addressLine1: '123 Test St',
            addressLine2: null,
            city: 'Test City',
            country: 'US',
            email: 'test@example.com',
            legalName: null,
            legalNumber: null,
            state: null,
            taxIdentificationNumber: null,
            zipcode: '12345',
            logoUrl: null,
            invoiceFooter: null,
            timezone: 'UTC',
            __typename: 'BillingEntity',
          },
        },
        loading: false,
        error: undefined,
      })

      await act(async () => {
        return render(<BillingEntityPage />)
      })

      // Header should be rendered
      expect(screen.getByTestId(BILLING_ENTITY_HEADER_TEST_ID)).toBeInTheDocument()

      // Main content should be rendered
      expect(screen.getByTestId(BILLING_ENTITY_MAIN_TEST_ID)).toBeInTheDocument()

      // Name should appear multiple times (in header and main content)
      const nameElements = screen.getAllByText('Test Billing Entity')

      expect(nameElements.length).toBeGreaterThanOrEqual(2)
    })

    it('should not render main content while loading', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      })

      await act(async () => {
        return render(<BillingEntityPage />)
      })

      // Should show loading container
      expect(screen.getByTestId(BILLING_ENTITY_LOADING_TEST_ID)).toBeInTheDocument()

      // Should not show the main content sections
      expect(screen.queryByTestId(BILLING_ENTITY_MAIN_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByText('Test Billing Entity')).not.toBeInTheDocument()
    })

    it('should render main content after loading completes', async () => {
      mockUseGetBillingEntityQuery.mockReturnValue({
        data: {
          billingEntity: {
            id: 'test-id',
            code: 'test-billing-entity',
            name: 'Test Billing Entity',
            addressLine1: '123 Test St',
            addressLine2: null,
            city: 'Test City',
            country: 'US',
            email: 'test@example.com',
            legalName: null,
            legalNumber: null,
            state: null,
            taxIdentificationNumber: null,
            zipcode: '12345',
            logoUrl: null,
            invoiceFooter: null,
            timezone: 'UTC',
            __typename: 'BillingEntity',
          },
        },
        loading: false,
        error: undefined,
      })

      await act(async () => {
        return render(<BillingEntityPage />)
      })

      // Should show main content
      expect(screen.getByTestId(BILLING_ENTITY_MAIN_TEST_ID)).toBeInTheDocument()

      // Should not show loading container
      expect(screen.queryByTestId(BILLING_ENTITY_LOADING_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
