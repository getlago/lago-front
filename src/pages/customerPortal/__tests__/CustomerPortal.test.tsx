import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import CustomerPortal, { CUSTOMER_PORTAL_CONTENT_TEST_ID } from '../CustomerPortal'

// --- Test ID constants ---
const SECTION_ERROR_TEST_ID = 'customer-portal-section-error'
const LOADING_SKELETON_TEST_ID = 'customer-portal-loading-skeleton'
const SIDEBAR_TEST_ID = 'customer-portal-sidebar'

// --- Mock return value defaults ---
const mockUseCustomerPortalTranslate = jest.fn()
const mockUseCustomerPortalNavigation = jest.fn()
const mockUseGetPortalOrgaInfosQuery = jest.fn()

jest.mock('~/components/customerPortal/common/useCustomerPortalTranslate', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalTranslate(),
}))

jest.mock('~/components/customerPortal/common/hooks/useCustomerPortalNavigation', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalNavigation(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPortalOrgaInfosQuery: () => mockUseGetPortalOrgaInfosQuery(),
}))

jest.mock('~/components/customerPortal/common/CustomerPortalSidebar', () => ({
  __esModule: true,
  default: () => <div data-test={SIDEBAR_TEST_ID} />,
}))

jest.mock('~/components/customerPortal/common/SectionError', () => ({
  __esModule: true,
  default: (props: { refresh?: () => void }) => (
    <div data-test={SECTION_ERROR_TEST_ID} data-has-refresh={!!props.refresh} />
  ),
}))

jest.mock('~/components/customerPortal/common/CustomerPortalLoading', () => ({
  __esModule: true,
  default: () => <div data-test={LOADING_SKELETON_TEST_ID} />,
}))

jest.mock('~/components/customerPortal/common/SectionLoading', () => ({
  LoaderCustomerInformationSection: () => <div data-test="loader-customer-info" />,
  LoaderInvoicesListSection: () => <div data-test="loader-invoices" />,
  LoaderUsageSection: () => <div data-test="loader-usage" />,
  LoaderWalletSection: () => <div data-test="loader-wallet" />,
}))

jest.mock('~/components/customerPortal/common/SectionTitle', () => ({
  __esModule: true,
  default: () => <div data-test="section-title" />,
}))

describe('CustomerPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseCustomerPortalNavigation.mockReturnValue({
      pathname: '/portal/test-token',
      goHome: jest.fn(),
      viewSubscription: jest.fn(),
      viewWallet: jest.fn(),
      viewEditInformation: jest.fn(),
    })

    mockUseGetPortalOrgaInfosQuery.mockReturnValue({
      data: {
        customerPortalOrganization: {
          id: 'org-1',
          name: 'Test Org',
          logoUrl: 'https://example.com/logo.png',
          premiumIntegrations: [],
        },
      },
      loading: false,
      error: undefined,
    })
  })

  describe('GIVEN isUnauthenticated is true (expired token)', () => {
    beforeEach(() => {
      mockUseCustomerPortalTranslate.mockReturnValue({
        translate: jest.fn((key: string) => key),
        error: undefined,
        loading: false,
        isUnauthenticated: true,
      })
    })

    it('WHEN the component renders THEN it shows the error page', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId(SECTION_ERROR_TEST_ID)).toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the content', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(CUSTOMER_PORTAL_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN the error page does NOT have a refresh callback', () => {
      render(<CustomerPortal />)

      const errorElement = screen.getByTestId(SECTION_ERROR_TEST_ID)

      expect(errorElement.getAttribute('data-has-refresh')).toBe('false')
    })
  })

  describe('GIVEN customerPortalTranslateError is truthy', () => {
    beforeEach(() => {
      mockUseCustomerPortalTranslate.mockReturnValue({
        translate: jest.fn((key: string) => key),
        error: new Error('Something went wrong'),
        loading: false,
        isUnauthenticated: false,
      })
    })

    it('WHEN the component renders THEN it shows the error page', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId(SECTION_ERROR_TEST_ID)).toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the content', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(CUSTOMER_PORTAL_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN the error page does NOT have a refresh callback', () => {
      render(<CustomerPortal />)

      const errorElement = screen.getByTestId(SECTION_ERROR_TEST_ID)

      expect(errorElement.getAttribute('data-has-refresh')).toBe('false')
    })
  })

  describe('GIVEN portalIsLoading is true', () => {
    beforeEach(() => {
      mockUseCustomerPortalTranslate.mockReturnValue({
        translate: jest.fn((key: string) => key),
        error: undefined,
        loading: true,
        isUnauthenticated: false,
      })
    })

    it('WHEN the component renders THEN it shows loading skeleton sections', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId('loader-wallet')).toBeInTheDocument()
      expect(screen.getByTestId('loader-usage')).toBeInTheDocument()
      expect(screen.getByTestId('loader-customer-info')).toBeInTheDocument()
      expect(screen.getByTestId('loader-invoices')).toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the content', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(CUSTOMER_PORTAL_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the error page', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(SECTION_ERROR_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN user is authenticated and not loading', () => {
    beforeEach(() => {
      mockUseCustomerPortalTranslate.mockReturnValue({
        translate: jest.fn((key: string) => key),
        error: undefined,
        loading: false,
        isUnauthenticated: false,
      })
    })

    it('WHEN the component renders THEN it shows the content container', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId(CUSTOMER_PORTAL_CONTENT_TEST_ID)).toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the error page', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(SECTION_ERROR_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show loading skeletons', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId('loader-wallet')).not.toBeInTheDocument()
    })

    it('WHEN the component renders THEN it shows the sidebar', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId(SIDEBAR_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN both isUnauthenticated and customerPortalTranslateError are present', () => {
    beforeEach(() => {
      mockUseCustomerPortalTranslate.mockReturnValue({
        translate: jest.fn((key: string) => key),
        error: new Error('Network error'),
        loading: false,
        isUnauthenticated: true,
      })
    })

    it('WHEN the component renders THEN it shows the error page', () => {
      render(<CustomerPortal />)

      expect(screen.getByTestId(SECTION_ERROR_TEST_ID)).toBeInTheDocument()
    })

    it('WHEN the component renders THEN it does NOT show the content', () => {
      render(<CustomerPortal />)

      expect(screen.queryByTestId(CUSTOMER_PORTAL_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
