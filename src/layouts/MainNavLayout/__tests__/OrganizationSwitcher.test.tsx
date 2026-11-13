import { ApolloClient, InMemoryCache } from '@apollo/client'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthenticationMethodsEnum, OrganizationEnvironmentEnum } from '~/generated/graphql'
import { SANDBOX_BANNER_HEIGHT } from '~/layouts/sandboxBannerHeight'
import { render } from '~/test-utils'

import {
  ORGANIZATION_SWITCHER_BUTTON_TEST_ID,
  ORGANIZATION_SWITCHER_CURRENT_SANDBOX_TAG_TEST_ID,
  ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT,
  ORGANIZATION_SWITCHER_NAME_TEST_ID,
  ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID,
  ORGANIZATION_SWITCHER_POPPER_MAX_HEIGHT,
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
  describe('GIVEN the current organization environment', () => {
    describe('WHEN the organization is a sandbox', () => {
      it('THEN should display the sandbox tag in the opener', () => {
        render(
          <OrganizationSwitcher
            {...defaultProps}
            organization={
              { ...mockOrganization, environment: OrganizationEnvironmentEnum.Sandbox } as never
            }
          />,
          renderOptions,
        )

        expect(
          screen.getByTestId(ORGANIZATION_SWITCHER_CURRENT_SANDBOX_TAG_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the organization is a production organization', () => {
      it('THEN should not display the sandbox tag', () => {
        render(
          <OrganizationSwitcher
            {...defaultProps}
            organization={
              { ...mockOrganization, environment: OrganizationEnvironmentEnum.Production } as never
            }
          />,
          renderOptions,
        )

        expect(
          screen.queryByTestId(ORGANIZATION_SWITCHER_CURRENT_SANDBOX_TAG_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the switcher menu is opened', () => {
    it('THEN should size the menu and its list from the space left under the sandbox banner', async () => {
      const user = userEvent.setup()

      render(<OrganizationSwitcher {...defaultProps} />, renderOptions)

      await user.click(screen.getByTestId(ORGANIZATION_SWITCHER_BUTTON_TEST_ID))

      const orgList = screen
        .getAllByTestId(ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID)[0]
        .closest('.overflow-auto') as HTMLElement
      const popperCard = orgList.parentElement?.parentElement as HTMLElement

      expect(ORGANIZATION_SWITCHER_POPPER_MAX_HEIGHT).toBe(
        `calc(100vh - 64px - 16px - ${SANDBOX_BANNER_HEIGHT})`,
      )
      expect(ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT).toBe(
        `calc(100vh - 80px - ${SANDBOX_BANNER_HEIGHT})`,
      )
      expect(popperCard.style.maxHeight).toBe(ORGANIZATION_SWITCHER_POPPER_MAX_HEIGHT)
      expect(orgList.style.maxHeight).toBe(ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT)
    })
  })

  describe('GIVEN an organization the current session cannot access', () => {
    const lockedOrgUser = {
      ...mockCurrentUser,
      memberships: [
        mockCurrentUser.memberships[0],
        {
          ...mockCurrentUser.memberships[1],
          organization: {
            ...mockCurrentUser.memberships[1].organization,
            accessibleByCurrentSession: false,
          },
        },
      ],
    }

    const hoverLockedOrganization = async (authenticatedMethod: AuthenticationMethodsEnum) => {
      const user = userEvent.setup()

      render(
        <OrganizationSwitcher
          {...defaultProps}
          currentUser={lockedOrgUser as never}
          organization={{ ...mockOrganization, authenticatedMethod } as never}
        />,
        { useParams: { organizationSlug: 'test-org' } },
      )

      await user.click(screen.getByTestId(ORGANIZATION_SWITCHER_BUTTON_TEST_ID))

      const lockedItem = screen
        .getAllByTestId(ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID)
        .find((item) => item.textContent?.includes('Another Org'))

      expect(lockedItem).toBeDisabled()

      await user.hover(lockedItem?.parentElement as HTMLElement)
    }

    describe('WHEN the user is logged in through an SSO method', () => {
      it.each([AuthenticationMethodsEnum.Okta, AuthenticationMethodsEnum.EntraId])(
        'THEN should explain the organization does not accept that session for %s',
        async (authenticatedMethod) => {
          await hoverLockedOrganization(authenticatedMethod)

          await waitFor(() => {
            expect(screen.getByText('text_17920584710724rtqabk4fe2')).toBeInTheDocument()
          })
        },
      )
    })

    describe('WHEN the user is logged in with email and password', () => {
      it('THEN should explain the organization does not allow that login method', async () => {
        await hoverLockedOrganization(AuthenticationMethodsEnum.EmailPassword)

        await waitFor(() => {
          expect(screen.getByText('text_1752158380555tozrnmtmxcz')).toBeInTheDocument()
        })
      })
    })
  })
})
