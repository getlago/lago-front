import { ApolloClient, InMemoryCache } from '@apollo/client'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AuthenticationMethodsEnum,
  CurrentUserInfosFragment,
  OrganizationEnvironmentEnum,
} from '~/generated/graphql'
import { SANDBOX_BANNER_HEIGHT } from '~/layouts/sandboxBannerHeight'
import { render } from '~/test-utils'

import {
  ORGANIZATION_SWITCHER_BUTTON_TEST_ID,
  ORGANIZATION_SWITCHER_CURRENT_SANDBOX_TAG_TEST_ID,
  ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT,
  ORGANIZATION_SWITCHER_NAME_TEST_ID,
  ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID,
  ORGANIZATION_SWITCHER_ORG_LIST_TEST_ID,
  ORGANIZATION_SWITCHER_POPPER_MAX_HEIGHT,
  ORGANIZATION_SWITCHER_SANDBOX_TAG_TEST_ID,
  ORGANIZATION_SWITCHER_TEST_ID,
  OrganizationSwitcher,
} from '../OrganizationSwitcher'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

const mockNavigate = jest.fn()
const mockLocation = { strippedPathname: '/' }

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
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

      expect(ORGANIZATION_SWITCHER_POPPER_MAX_HEIGHT).toContain(`- ${SANDBOX_BANNER_HEIGHT})`)
      expect(ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT).toContain(`- ${SANDBOX_BANNER_HEIGHT})`)
      expect(screen.getByTestId(ORGANIZATION_SWITCHER_ORG_LIST_TEST_ID)).toHaveStyle({
        maxHeight: ORGANIZATION_SWITCHER_LIST_MAX_HEIGHT,
      })
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
  describe('GIVEN a production organization and its linked sandbox', () => {
    type MembershipOrganization = CurrentUserInfosFragment['memberships'][number]['organization']
    type MembershipFixture = { id: string; organization: MembershipOrganization }

    const buildOrganization = ({
      id,
      name,
      environment = OrganizationEnvironmentEnum.Production,
      productionOrganization = null,
      sandboxOrganization = null,
      accessibleByCurrentSession = true,
    }: Pick<MembershipOrganization, 'id' | 'name'> &
      Partial<
        Pick<
          MembershipOrganization,
          | 'environment'
          | 'productionOrganization'
          | 'sandboxOrganization'
          | 'accessibleByCurrentSession'
        >
      >): MembershipFixture => ({
      id: `membership-${id}`,
      organization: {
        id,
        name,
        slug: id,
        logoUrl: null,
        accessibleByCurrentSession,
        environment,
        productionOrganization,
        sandboxOrganization,
      },
    })

    const acme = buildOrganization({
      id: 'acme',
      name: 'Acme',
      sandboxOrganization: { id: 'acme-sandbox' },
    })
    const acmeSandbox = buildOrganization({
      id: 'acme-sandbox',
      name: 'Zulu Sandbox',
      environment: OrganizationEnvironmentEnum.Sandbox,
      productionOrganization: { id: 'acme' },
    })
    const beta = buildOrganization({ id: 'beta', name: 'Beta' })

    const renderMenu = async (
      memberships: MembershipFixture[],
      currentSlug: string,
    ): Promise<ReturnType<typeof userEvent.setup>> => {
      const user = userEvent.setup()

      render(
        <OrganizationSwitcher
          {...defaultProps}
          currentUser={{ ...mockCurrentUser, memberships } as never}
        />,
        { useParams: { organizationSlug: currentSlug } },
      )

      await user.click(screen.getByTestId(ORGANIZATION_SWITCHER_BUTTON_TEST_ID))

      return user
    }

    const expectItemOrder = (names: string[]): void => {
      const items = screen.getAllByTestId(ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID)

      expect(items).toHaveLength(names.length)
      names.forEach((name, index) => expect(items[index]).toHaveTextContent(name))
    }

    const clickItem = async (
      user: ReturnType<typeof userEvent.setup>,
      name: string,
    ): Promise<void> => {
      const item = screen
        .getAllByTestId(ORGANIZATION_SWITCHER_ORG_ITEM_TEST_ID)
        .find((element) => element.textContent?.endsWith(name))

      await user.click(item as HTMLElement)
    }

    beforeEach(() => {
      mockLocation.strippedPathname = '/'
    })

    describe('WHEN the menu opens', () => {
      it('THEN should list the sandbox right after its production', async () => {
        await renderMenu([acmeSandbox, beta, acme], 'beta')

        expectItemOrder(['Acme', 'Zulu Sandbox', 'Beta'])
      })

      it('THEN should pair the sandbox when only one side carries the link', async () => {
        const acmeWithoutLink = buildOrganization({ id: 'acme', name: 'Acme' })

        await renderMenu([acmeSandbox, beta, acmeWithoutLink], 'beta')

        expectItemOrder(['Acme', 'Zulu Sandbox', 'Beta'])
      })

      it('THEN should tag only the sandbox', async () => {
        await renderMenu([acme, acmeSandbox, beta], 'beta')

        const tags = screen.getAllByTestId(ORGANIZATION_SWITCHER_SANDBOX_TAG_TEST_ID)

        expect(tags).toHaveLength(1)
        expect(tags[0].closest('button')).toHaveTextContent('Zulu Sandbox')
      })
    })

    describe('WHEN the sandbox production is not in the memberships', () => {
      it('THEN should keep the sandbox in the normal sort', async () => {
        const orphanSandbox = buildOrganization({
          id: 'orphan-sandbox',
          name: 'Alpha Sandbox',
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization: { id: 'unknown' },
        })

        await renderMenu([beta, orphanSandbox], 'beta')

        expectItemOrder(['Alpha Sandbox', 'Beta'])
      })
    })

    describe('WHEN every link is null', () => {
      it('THEN should keep the alphabetical order without pairing or tags', async () => {
        const zulu = buildOrganization({ id: 'zulu', name: 'Zulu' })
        const alpha = buildOrganization({ id: 'alpha', name: 'Alpha' })

        await renderMenu([zulu, beta, alpha], 'beta')

        expectItemOrder(['Alpha', 'Beta', 'Zulu'])
        expect(
          screen.queryByTestId(ORGANIZATION_SWITCHER_SANDBOX_TAG_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN switching to the linked counterpart', () => {
      it('THEN should keep a page that exists in both organizations', async () => {
        mockLocation.strippedPathname = '/plans'

        const user = await renderMenu([acme, acmeSandbox], 'acme-sandbox')

        await clickItem(user, 'Acme')

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/acme/plans', { skipSlugPrepend: true })
        expect(mockNavigate).not.toHaveBeenCalledWith('/acme/', { skipSlugPrepend: true })
      })

      it('THEN should go home from a page about a single resource', async () => {
        mockLocation.strippedPathname = '/plan/plan-1/overview'

        const user = await renderMenu([acme, acmeSandbox], 'acme-sandbox')

        await clickItem(user, 'Acme')

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/acme/', { skipSlugPrepend: true })
        expect(mockNavigate).not.toHaveBeenCalledWith('/acme/plan/plan-1/overview', {
          skipSlugPrepend: true,
        })
      })

      it('THEN should keep a settings page selected by a view param', async () => {
        mockLocation.strippedPathname = '/settings/team-and-security/members'

        const user = await renderMenu([acme, acmeSandbox], 'acme-sandbox')

        await clickItem(user, 'Acme')

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/acme/settings/team-and-security/members', {
          skipSlugPrepend: true,
        })
        expect(mockNavigate).not.toHaveBeenCalledWith('/acme/', { skipSlugPrepend: true })
      })

      it('THEN should keep an analytics tab', async () => {
        mockLocation.strippedPathname = '/analytics/invoices'

        const user = await renderMenu([acme, acmeSandbox], 'acme-sandbox')

        await clickItem(user, 'Acme')

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/acme/analytics/invoices', {
          skipSlugPrepend: true,
        })
        expect(mockNavigate).not.toHaveBeenCalledWith('/acme/', { skipSlugPrepend: true })
      })
    })

    describe('WHEN switching to an organization outside the pair', () => {
      it('THEN should go home', async () => {
        mockLocation.strippedPathname = '/plans'

        const user = await renderMenu([acme, acmeSandbox, beta], 'acme-sandbox')

        await clickItem(user, 'Beta')

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/beta/', { skipSlugPrepend: true })
        expect(mockNavigate).not.toHaveBeenCalledWith('/beta/plans', { skipSlugPrepend: true })
      })
    })
  })
})
