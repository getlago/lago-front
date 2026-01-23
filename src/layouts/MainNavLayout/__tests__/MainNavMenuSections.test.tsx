import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  MAIN_NAV_BILLING_SECTION_TEST_ID,
  MAIN_NAV_CONFIGURATION_SECTION_TEST_ID,
  MAIN_NAV_MENU_SECTIONS_TEST_ID,
  MAIN_NAV_REPORTS_SECTION_TEST_ID,
  MainNavMenuSections,
} from '../MainNavMenuSections'

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/core/utils/featureFlags', () => ({
  FeatureFlags: { SUPERSET_ANALYTICS: 'SUPERSET_ANALYTICS' },
  isFeatureFlagActive: jest.fn(() => false),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('MainNavMenuSections', () => {
  const defaultProps = {
    isLoading: false,
    onItemClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('Test ID constants', () => {
    it('exports expected test ID constants', () => {
      expect(MAIN_NAV_MENU_SECTIONS_TEST_ID).toBe('main-nav-menu-sections')
      expect(MAIN_NAV_REPORTS_SECTION_TEST_ID).toBe('main-nav-reports-section')
      expect(MAIN_NAV_CONFIGURATION_SECTION_TEST_ID).toBe('main-nav-configuration-section')
      expect(MAIN_NAV_BILLING_SECTION_TEST_ID).toBe('main-nav-billing-section')
    })

    it('test ID constants follow kebab-case naming convention', () => {
      const testIds = [
        MAIN_NAV_MENU_SECTIONS_TEST_ID,
        MAIN_NAV_REPORTS_SECTION_TEST_ID,
        MAIN_NAV_CONFIGURATION_SECTION_TEST_ID,
        MAIN_NAV_BILLING_SECTION_TEST_ID,
      ]

      testIds.forEach((testId) => {
        expect(testId).toMatch(/^[a-z-]+$/)
      })
    })
  })

  describe('Component rendering', () => {
    it('renders the menu sections container', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(screen.getByTestId(MAIN_NAV_MENU_SECTIONS_TEST_ID)).toBeInTheDocument()
    })

    it('renders the configuration section', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(screen.getByTestId(MAIN_NAV_CONFIGURATION_SECTION_TEST_ID)).toBeInTheDocument()
    })

    it('renders the billing section', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(screen.getByTestId(MAIN_NAV_BILLING_SECTION_TEST_ID)).toBeInTheDocument()
    })

    it('renders the reports section when user has analytics permission', () => {
      mockHasPermissions.mockImplementation((permissions: string[]) =>
        permissions.includes('analyticsView'),
      )

      render(<MainNavMenuSections {...defaultProps} />)

      expect(screen.getByTestId(MAIN_NAV_REPORTS_SECTION_TEST_ID)).toBeInTheDocument()
    })

    it('does not render the reports section when user lacks analytics permission', () => {
      mockHasPermissions.mockImplementation(
        (permissions: string[]) => !permissions.includes('analyticsView'),
      )

      render(<MainNavMenuSections {...defaultProps} />)

      expect(screen.queryByTestId(MAIN_NAV_REPORTS_SECTION_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('Permission-based visibility', () => {
    it('calls hasPermissions with correct permissions for reports section', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(mockHasPermissions).toHaveBeenCalledWith(['analyticsView'])
    })

    it('calls hasPermissions for configuration items', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(mockHasPermissions).toHaveBeenCalledWith(['billableMetricsView'])
      expect(mockHasPermissions).toHaveBeenCalledWith(['plansView'])
      expect(mockHasPermissions).toHaveBeenCalledWith(['couponsView'])
    })

    it('calls hasPermissions for billing items', () => {
      render(<MainNavMenuSections {...defaultProps} />)

      expect(mockHasPermissions).toHaveBeenCalledWith(['customersView'])
      expect(mockHasPermissions).toHaveBeenCalledWith(['subscriptionsView'])
      expect(mockHasPermissions).toHaveBeenCalledWith(['invoicesView'])
    })
  })

  describe('Component exports', () => {
    it('exports successfully', () => {
      expect(MainNavMenuSections).toBeDefined()
      expect(typeof MainNavMenuSections).toBe('function')
    })
  })
})
