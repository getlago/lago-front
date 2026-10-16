import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID,
  GENERIC_PLACEHOLDER_TITLE_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { getItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'
import { CurrentUserInfosFragment } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import Forbidden from '../Forbidden'

const mockUseCurrentUser = jest.fn()
const mockLogOut = jest.fn()
const mockGoBack = jest.fn()

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  logOut: (...args: unknown[]) => mockLogOut(...args),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: mockGoBack }),
}))

type Membership = CurrentUserInfosFragment['memberships'][number]
type MembershipFixture = Pick<Membership, 'id'> & {
  organization: Pick<
    Membership['organization'],
    'id' | 'name' | 'slug' | 'accessibleByCurrentSession'
  >
}

const buildMembership = (slug: string, accessibleByCurrentSession: boolean): MembershipFixture => ({
  id: `membership-${slug}`,
  organization: { id: `org-${slug}`, name: `Org ${slug}`, slug, accessibleByCurrentSession },
})

const renderForbidden = (memberships: MembershipFixture[], organizationSlug?: string): void => {
  mockUseCurrentUser.mockReturnValue({ currentUser: { memberships }, loading: false })

  render(<Forbidden />, organizationSlug ? { useParams: { organizationSlug } } : undefined)
}

describe('Forbidden', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('GIVEN the current user is still loading', () => {
    it('THEN should not render any reason nor button yet', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: undefined, loading: true })

      render(<Forbidden />, { useParams: { organizationSlug: 'locked' } })

      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TITLE_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the URL organization is a membership the session cannot open', () => {
    describe('WHEN the session can open another organization', () => {
      beforeEach(() => {
        renderForbidden([buildMembership('open', true), buildMembership('locked', false)], 'locked')
      })

      it('THEN should name the refused organization', () => {
        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TITLE_TEST_ID)).toHaveTextContent(
          'You can’t open Org locked with this login',
        )
        expect(screen.getByTestId(GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID)).toHaveTextContent(
          'Your current login method doesn’t give access to Org locked.',
        )
      })

      it('THEN should send the user back to the root redirect without the slug', async () => {
        await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/', expect.anything())
      })

      it('THEN should offer to log out', async () => {
        await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID))

        expect(mockLogOut).toHaveBeenCalledWith(expect.anything(), true)
      })
    })

    describe('WHEN the user logs out to sign in with another login method', () => {
      it('THEN should keep the refused page as the post-login redirect', async () => {
        window.history.pushState({}, '', '/locked/customers?tab=1#top')
        renderForbidden([buildMembership('open', true), buildMembership('locked', false)], 'locked')

        await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID))

        expect(getItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)).toBe('/locked/customers?tab=1#top')
        expect(mockLogOut).toHaveBeenCalled()
      })
    })

    describe('WHEN the session cannot open any organization', () => {
      it('THEN should only offer to log out', async () => {
        renderForbidden([buildMembership('locked', false)], 'locked')

        expect(
          screen.queryByTestId(GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()

        await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

        expect(mockLogOut).toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
        expect(testMockNavigateFn).toHaveBeenCalledWith('/login', { replace: true })
      })
    })
  })

  describe('GIVEN no organization accepts the session and the URL has no refused slug', () => {
    it('THEN should explain no organization accepts this login and offer to log out', async () => {
      renderForbidden([buildMembership('a', false), buildMembership('b', false)])

      expect(screen.getByTestId(GENERIC_PLACEHOLDER_TITLE_TEST_ID)).toHaveTextContent(
        'No organization accepts this login',
      )

      await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

      expect(mockLogOut).toHaveBeenCalled()
      expect(getItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)).toBeFalsy()
    })

    // Guards the user staying logged out on `/forbidden`, a public route no auth guard leaves.
    it('THEN should send the user to the login page once logged out', async () => {
      const callOrder: string[] = []

      mockLogOut.mockImplementationOnce(async () => {
        callOrder.push('logOut')
      })
      testMockNavigateFn.mockImplementationOnce((to: string) => {
        callOrder.push(`navigate:${to}`)
      })
      renderForbidden([buildMembership('a', false), buildMembership('b', false)])

      await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

      expect(callOrder).toEqual(['logOut', 'navigate:/login'])
      expect(testMockNavigateFn).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  describe('GIVEN the session can open the URL organization (missing permission)', () => {
    it('THEN should keep the permission copy and go back', async () => {
      renderForbidden([buildMembership('open', true)], 'open')

      expect(screen.getByTestId(GENERIC_PLACEHOLDER_TITLE_TEST_ID)).toHaveTextContent(
        'Forbidden access',
      )
      expect(
        screen.queryByTestId(GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()

      await userEvent.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

      expect(mockGoBack).toHaveBeenCalledWith('/', { previousCount: -2 })
    })
  })

  describe('GIVEN the refused organization name contains markup', () => {
    it('THEN should render it as text, not HTML', () => {
      mockUseCurrentUser.mockReturnValue({
        currentUser: {
          memberships: [
            buildMembership('open', true),
            {
              ...buildMembership('locked', false),
              organization: {
                ...buildMembership('locked', false).organization,
                name: '<img src=x onerror=alert(1)>',
              },
            },
          ],
        },
        loading: false,
      })

      render(<Forbidden />, { useParams: { organizationSlug: 'locked' } })

      expect(
        screen.getByTestId(GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID).querySelector('img'),
      ).not.toBeInTheDocument()
    })
  })
})
