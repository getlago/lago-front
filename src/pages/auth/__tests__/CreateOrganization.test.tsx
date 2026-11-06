import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { initializeTranslations } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import type { useCurrentUser } from '~/hooks/useCurrentUser'
import { render, testMockNavigateFn } from '~/test-utils'

import CreateOrganization from '../CreateOrganization'
import { SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID } from '../signUpTestIds'

type CurrentUserAnswer = Pick<ReturnType<typeof useCurrentUser>, 'currentUser' | 'loading'>

const MOCK_SPINNER_TEST_ID = 'create-organization-spinner'
const TITLE_COPY = 'Create your organization'

const mockClient = { query: jest.fn(), mutate: jest.fn() }
const mockUseCurrentUser = jest.fn<CurrentUserAnswer, []>()
const mockLogOut = jest.fn<Promise<void>, unknown[]>()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  logOut: (...args: unknown[]) => mockLogOut(...args),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => <div data-test={MOCK_SPINNER_TEST_ID} />,
}))

const buildUser = (needsOrganization: boolean): CurrentUserAnswer['currentUser'] => ({
  id: 'user-1',
  premium: false,
  csAdmin: false,
  needsOrganization,
  memberships: [],
})

const expectPlaceholderHidden = (): void => {
  expect(screen.getByTestId(MOCK_SPINNER_TEST_ID)).toBeInTheDocument()
  expect(screen.queryByText(TITLE_COPY)).not.toBeInTheDocument()
  expect(
    screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID),
  ).not.toBeInTheDocument()
}

describe('CreateOrganization', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogOut.mockResolvedValue(undefined)
  })

  describe('GIVEN the current user is still loading', () => {
    describe('WHEN no user is cached yet', () => {
      it('THEN should show the spinner without redirecting', () => {
        mockUseCurrentUser.mockReturnValue({ loading: true, currentUser: undefined })

        render(<CreateOrganization />)

        expectPlaceholderHidden()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a cached user does not need an organization', () => {
      it('THEN should wait for the user to load before redirecting', () => {
        mockUseCurrentUser.mockReturnValue({ loading: true, currentUser: buildUser(false) })

        render(<CreateOrganization />)

        expectPlaceholderHidden()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the current user query resolved without a user', () => {
    it('THEN should show the spinner without redirecting', () => {
      mockUseCurrentUser.mockReturnValue({ loading: false, currentUser: undefined })

      render(<CreateOrganization />)

      expectPlaceholderHidden()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a loaded user who does not need an organization', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({ loading: false, currentUser: buildUser(false) })
    })

    it('THEN should send the user home, replacing the history entry', () => {
      render(<CreateOrganization />)

      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
      expect(testMockNavigateFn).toHaveBeenCalledWith(HOME_ROUTE, { replace: true })
    })

    it('THEN should not show the create organization placeholder', () => {
      render(<CreateOrganization />)

      expectPlaceholderHidden()
    })
  })

  describe('GIVEN a loaded user who needs an organization', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({ loading: false, currentUser: buildUser(true) })
    })

    describe('WHEN the page renders', () => {
      it('THEN should show the title and the log out action', () => {
        render(<CreateOrganization />)

        expect(screen.getByText(TITLE_COPY)).toBeInTheDocument()
        expect(
          screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID),
        ).toHaveTextContent('Log out')
        expect(screen.queryByTestId(MOCK_SPINNER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should stay on the page', () => {
        render(<CreateOrganization />)

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN clicking log out', () => {
      it('THEN should log out with the client and reset the location history, without navigating itself', async () => {
        render(<CreateOrganization />)

        await userEvent.click(
          screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID),
        )

        expect(mockLogOut).toHaveBeenCalledTimes(1)
        expect(mockLogOut).toHaveBeenCalledWith(mockClient, true)
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
