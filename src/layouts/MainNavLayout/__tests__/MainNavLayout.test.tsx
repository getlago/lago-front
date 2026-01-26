import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { BOTTOM_NAV_SECTION_TEST_ID } from '../BottomNavSection'
import MainNavLayout, {
  MAIN_NAV_LAYOUT_SPINNER_TEST_ID,
  MAIN_NAV_LAYOUT_WRAPPER_TEST_ID,
} from '../MainNavLayout'
import { MAIN_NAV_MENU_SECTIONS_TEST_ID } from '../MainNavMenuSections'
import { ORGANIZATION_SWITCHER_TEST_ID } from '../OrganizationSwitcher'

// Mock scrollTo since JSDOM doesn't support it
Element.prototype.scrollTo = jest.fn()

const mockRefetchCurrentUserInfos = jest.fn()
const mockRefetchOrganizationInfos = jest.fn()

const mockUseCurrentUser = jest.fn()
const mockUseOrganizationInfos = jest.fn()
const mockUseSideNavInfosQuery = jest.fn()

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useSideNavInfosQuery: () => mockUseSideNavInfosQuery(),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => true,
  }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({
    openPanel: jest.fn(),
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  envGlobalVar: () => ({ appEnv: 'development' }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

jest.mock('~/core/utils/featureFlags', () => ({
  FeatureFlags: { SUPERSET_ANALYTICS: 'SUPERSET_ANALYTICS' },
  isFeatureFlagActive: jest.fn(() => false),
}))

const defaultCurrentUser = {
  id: 'user-1',
  email: 'test@example.com',
  memberships: [
    {
      id: 'membership-1',
      organization: {
        id: 'org-1',
        name: 'Test Org',
        logoUrl: null,
        accessibleByCurrentSession: true,
      },
    },
  ],
}

const defaultOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  logoUrl: null,
  authenticatedMethod: 'EMAIL',
}

const defaultVersionData = {
  currentVersion: {
    githubUrl: 'https://github.com/getlago/lago',
    number: 'v1.0.0',
  },
}

describe('MainNavLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set default mock return values (not loading)
    mockUseCurrentUser.mockReturnValue({
      currentUser: defaultCurrentUser,
      loading: false,
      refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
    })

    mockUseOrganizationInfos.mockReturnValue({
      organization: defaultOrganization,
      loading: false,
      refetchOrganizationInfos: mockRefetchOrganizationInfos,
    })

    mockUseSideNavInfosQuery.mockReturnValue({
      data: defaultVersionData,
      loading: false,
    })
  })

  describe('Loading state', () => {
    it('shows spinner when current user is loading', () => {
      mockUseCurrentUser.mockReturnValue({
        currentUser: undefined,
        loading: true,
        refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
      })

      render(<MainNavLayout />)

      expect(screen.getByTestId(MAIN_NAV_LAYOUT_SPINNER_TEST_ID)).toBeInTheDocument()
    })

    it('shows spinner when organization is loading', () => {
      mockUseOrganizationInfos.mockReturnValue({
        organization: undefined,
        loading: true,
        refetchOrganizationInfos: mockRefetchOrganizationInfos,
      })

      render(<MainNavLayout />)

      expect(screen.getByTestId(MAIN_NAV_LAYOUT_SPINNER_TEST_ID)).toBeInTheDocument()
    })

    it('shows spinner when version info is loading', () => {
      mockUseSideNavInfosQuery.mockReturnValue({
        data: undefined,
        loading: true,
      })

      render(<MainNavLayout />)

      expect(screen.getByTestId(MAIN_NAV_LAYOUT_SPINNER_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Loaded state', () => {
    it('does not show spinner when not loading', () => {
      render(<MainNavLayout />)

      expect(screen.queryByTestId(MAIN_NAV_LAYOUT_SPINNER_TEST_ID)).not.toBeInTheDocument()
    })

    it('renders the main wrapper', () => {
      render(<MainNavLayout />)

      expect(screen.getByTestId(MAIN_NAV_LAYOUT_WRAPPER_TEST_ID)).toBeInTheDocument()
    })

    it('renders the organization switcher', () => {
      render(<MainNavLayout />)

      expect(screen.getByTestId(ORGANIZATION_SWITCHER_TEST_ID)).toBeInTheDocument()
    })

    it('renders the main nav menu sections', () => {
      render(<MainNavLayout />)

      expect(screen.getByTestId(MAIN_NAV_MENU_SECTIONS_TEST_ID)).toBeInTheDocument()
    })

    it('renders the bottom nav section', () => {
      render(<MainNavLayout />)

      expect(screen.getByTestId(BOTTOM_NAV_SECTION_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Component exports', () => {
    it('exports successfully', () => {
      expect(MainNavLayout).toBeDefined()
      expect(typeof MainNavLayout).toBe('function')
    })
  })
})
