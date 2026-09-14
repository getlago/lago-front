import { ApolloClient, InMemoryCache } from '@apollo/client'
import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  ORGANIZATION_SWITCHER_BUTTON_TEST_ID,
  ORGANIZATION_SWITCHER_NAME_TEST_ID,
  ORGANIZATION_SWITCHER_TEST_ID,
  OrganizationSwitcher,
} from '../OrganizationSwitcher'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  switchCurrentOrganization: jest.fn(),
  logOut: jest.fn(),
}))

describe('OrganizationSwitcher', () => {
  const mockClient = new ApolloClient({
    cache: new InMemoryCache(),
  })

  const mockCurrentUser = {
    id: 'user-1',
    email: 'test@example.com',
    memberships: [
      {
        id: 'membership-1',
        organization: {
          id: 'org-1',
          name: 'Test Organization',
          slug: 'test-org',
          logoUrl: null,
          accessibleByCurrentSession: true,
        },
      },
      {
        id: 'membership-2',
        organization: {
          id: 'org-2',
          name: 'Another Org',
          slug: 'another-org',
          logoUrl: null,
          accessibleByCurrentSession: true,
        },
      },
    ],
  }

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Organization',
    slug: 'test-org',
    logoUrl: null,
    authenticatedMethod: 'EMAIL',
  }

  const renderOptions = { useParams: { organizationSlug: 'another-org' } }

  const defaultProps = {
    client: mockClient,
    currentUser: mockCurrentUser as never,
    organization: mockOrganization as never,
    currentVersion: {
      githubUrl: 'https://github.com/getlago/lago',
      number: 'v1.0.0',
    },
    isLoading: false,
    isVersionLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component rendering', () => {
    it('renders the organization switcher container', () => {
      render(<OrganizationSwitcher {...defaultProps} />, renderOptions)

      expect(screen.getByTestId(ORGANIZATION_SWITCHER_TEST_ID)).toBeInTheDocument()
    })

    it('renders the organization switcher button', () => {
      render(<OrganizationSwitcher {...defaultProps} />, renderOptions)

      expect(screen.getByTestId(ORGANIZATION_SWITCHER_BUTTON_TEST_ID)).toBeInTheDocument()
    })

    it('renders the URL organization name when the organization prop is stale', () => {
      render(<OrganizationSwitcher {...defaultProps} />, renderOptions)

      expect(screen.getByTestId(ORGANIZATION_SWITCHER_NAME_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(ORGANIZATION_SWITCHER_NAME_TEST_ID)).toHaveTextContent(
        'Another Org',
      )
      expect(screen.getByTestId(ORGANIZATION_SWITCHER_NAME_TEST_ID)).not.toHaveTextContent(
        'Test Organization',
      )
    })

    it('disables button when loading', () => {
      render(<OrganizationSwitcher {...defaultProps} isLoading={true} />, renderOptions)

      expect(screen.getByTestId(ORGANIZATION_SWITCHER_BUTTON_TEST_ID)).toBeDisabled()
    })
  })
})
