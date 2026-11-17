import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'

import { initializeTranslations } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import type { useCurrentUser } from '~/hooks/useCurrentUser'
import type { useNeedsOrganization } from '~/hooks/useNeedsOrganization'
import { render, testMockNavigateFn } from '~/test-utils'

import CreateOrganization from '../CreateOrganization'
import type { CreateOrganizationForm } from '../createOrganizationForm/CreateOrganizationForm'
import {
  SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID,
} from '../signUpTestIds'

type NeedsOrganizationAnswer = ReturnType<typeof useNeedsOrganization>
type CurrentUserAnswer = ReturnType<typeof useCurrentUser>
type CreateOrganizationFormProps = ComponentProps<typeof CreateOrganizationForm>

const MOCK_SPINNER_TEST_ID = 'create-organization-spinner'
const MOCK_ALERT_TEST_ID = 'create-organization-alert'
const MOCK_FORM_TEST_ID = 'create-organization-form'
const MOCK_FORM_NOT_ELIGIBLE_BUTTON_TEST_ID = 'create-organization-form-not-eligible'
const EMAIL = 'raffi@hooli.com'
const TITLE_COPY = 'Create your organization'
const SUBTITLE_COPY =
  'Create your first organization to set up your billing environment and start building with Lago.'
const LOG_OUT_COPY = 'Log out'
const RETRY_COPY = 'Retry'
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'

const mockClient = { query: jest.fn(), mutate: jest.fn() }
const mockUseNeedsOrganization = jest.fn<NeedsOrganizationAnswer, []>()
const mockLogOut = jest.fn<Promise<void>, unknown[]>()
const mockRetry = jest.fn<Promise<void>, []>()
const mockUseCurrentUser = jest.fn<CurrentUserAnswer, []>()
const mockRefetchCurrentUserInfos = jest.fn()
const mockFormProps = jest.fn<void, [CreateOrganizationFormProps]>()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => mockClient,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  logOut: (...args: unknown[]) => mockLogOut(...args),
}))

jest.mock('~/hooks/useNeedsOrganization', () => ({
  useNeedsOrganization: () => mockUseNeedsOrganization(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

function mockRenderForm(props: CreateOrganizationFormProps): JSX.Element {
  mockFormProps(props)

  return (
    <div data-test={MOCK_FORM_TEST_ID}>
      <button
        data-test={MOCK_FORM_NOT_ELIGIBLE_BUTTON_TEST_ID}
        onClick={() => props.onUserNotEligible()}
      />
    </div>
  )
}

jest.mock('../createOrganizationForm/CreateOrganizationForm', () => ({
  CreateOrganizationForm: (props: CreateOrganizationFormProps) => mockRenderForm(props),
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => <div data-test={MOCK_SPINNER_TEST_ID} />,
}))

jest.mock('~/components/designSystem/Alert', () => ({
  Alert: ({ type, children }: { type: string; children: string }) => (
    <div data-test={MOCK_ALERT_TEST_ID} data-alert-type={type}>
      {children}
    </div>
  ),
}))

const answerNeedsOrganization = (answer: Partial<NeedsOrganizationAnswer>): void => {
  mockUseNeedsOrganization.mockReturnValue({
    needsOrganization: false,
    loading: false,
    hasError: false,
    retry: mockRetry,
    ...answer,
  })
}

const answerCurrentUser = ({
  email = EMAIL,
  hasUser = true,
  loading = false,
}: {
  email?: string | null
  hasUser?: boolean
  loading?: boolean
} = {}): void => {
  mockUseCurrentUser.mockReturnValue({
    isPremium: false,
    loading,
    currentUser: hasUser
      ? { id: 'user-1', email, premium: false, csAdmin: false, memberships: [] }
      : undefined,
    refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
  })
}

const getLastFormProps = (): CreateOrganizationFormProps =>
  mockFormProps.mock.calls[mockFormProps.mock.calls.length - 1][0]

const getLogOutButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID)

const getRetryButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID)

const queryRetryButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID)

const expectCardHidden = (): void => {
  expect(screen.getByTestId(MOCK_SPINNER_TEST_ID)).toBeInTheDocument()
  expect(screen.queryByText(TITLE_COPY)).not.toBeInTheDocument()
  expect(screen.queryByText(SUBTITLE_COPY)).not.toBeInTheDocument()
  expect(screen.queryByTestId(MOCK_ALERT_TEST_ID)).not.toBeInTheDocument()
  expect(screen.queryByTestId(MOCK_FORM_TEST_ID)).not.toBeInTheDocument()
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
    mockRetry.mockResolvedValue(undefined)
    mockRefetchCurrentUserInfos.mockResolvedValue({})
    answerCurrentUser()
  })

  describe('GIVEN the needs-organization check is loading', () => {
    it('THEN should show the spinner without redirecting', () => {
      answerNeedsOrganization({ loading: true })

      render(<CreateOrganization />)

      expectCardHidden()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a user who does not need an organization', () => {
    beforeEach(() => {
      answerNeedsOrganization({ needsOrganization: false, hasError: false })
    })

    it('THEN should send the user home, replacing the history entry', () => {
      render(<CreateOrganization />)

      expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
      expect(testMockNavigateFn).toHaveBeenCalledWith(HOME_ROUTE, { replace: true })
    })

    it('THEN should not show the create organization card', () => {
      render(<CreateOrganization />)

      expectCardHidden()
    })
  })

  describe('GIVEN a user who needs an organization', () => {
    beforeEach(() => {
      answerNeedsOrganization({ needsOrganization: true })
    })

    describe('WHEN the page renders', () => {
      it('THEN should show the title, the subtitle and the log out action without an error', () => {
        render(<CreateOrganization />)

        expect(screen.getByText(TITLE_COPY)).toBeInTheDocument()
        expect(screen.getByText(SUBTITLE_COPY)).toBeInTheDocument()
        expect(getLogOutButton()).toHaveTextContent(LOG_OUT_COPY)
        expect(screen.queryByTestId(MOCK_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(queryRetryButton()).not.toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_SPINNER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should stay on the page', () => {
        render(<CreateOrganization />)

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })

      it('THEN should render the form with the current user email', () => {
        render(<CreateOrganization />)

        expect(screen.getByTestId(MOCK_FORM_TEST_ID)).toBeInTheDocument()
        expect(getLastFormProps().email).toBe(EMAIL)
      })
    })

    describe('WHEN the current user has no email', () => {
      it('THEN should render the form without an email', () => {
        answerCurrentUser({ email: null })

        render(<CreateOrganization />)

        expect(screen.getByTestId(MOCK_FORM_TEST_ID)).toBeInTheDocument()
        expect(getLastFormProps().email).toBeUndefined()
      })
    })

    describe('WHEN the current user is loading for the first time', () => {
      it('THEN should show the spinner without the form', () => {
        answerCurrentUser({ hasUser: false, loading: true })

        render(<CreateOrganization />)

        expectCardHidden()
      })
    })

    describe('WHEN the current user is refetching', () => {
      it('THEN should keep the form on screen', () => {
        answerCurrentUser({ loading: true })

        render(<CreateOrganization />)

        expect(screen.getByTestId(MOCK_FORM_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_SPINNER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the form reports the user is not eligible', () => {
      it('THEN should refetch the current user, then check again for an organization', async () => {
        let resolveRefetch: (value: unknown) => void = () => undefined

        mockRefetchCurrentUserInfos.mockReturnValue(
          new Promise((resolve) => {
            resolveRefetch = resolve
          }),
        )

        render(<CreateOrganization />)

        await userEvent.click(screen.getByTestId(MOCK_FORM_NOT_ELIGIBLE_BUTTON_TEST_ID))

        expect(mockRefetchCurrentUserInfos).toHaveBeenCalledTimes(1)
        expect(mockRetry).not.toHaveBeenCalled()

        await act(async () => {
          resolveRefetch({})
        })

        expect(mockRetry).toHaveBeenCalledTimes(1)
        expect(mockLogOut).not.toHaveBeenCalled()
      })
    })

    describe('WHEN clicking log out', () => {
      it('THEN should log out with the client and reset the location history, without navigating itself', async () => {
        render(<CreateOrganization />)

        await userEvent.click(getLogOutButton())

        expect(mockLogOut).toHaveBeenCalledTimes(1)
        expect(mockLogOut).toHaveBeenCalledWith(mockClient, true)
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the needs-organization check failed', () => {
    beforeEach(() => {
      answerNeedsOrganization({ needsOrganization: false, hasError: true })
    })

    describe('WHEN the page renders', () => {
      it('THEN should show the title, the subtitle, a danger alert, a retry and the log out action', () => {
        render(<CreateOrganization />)

        const alert = screen.getByTestId(MOCK_ALERT_TEST_ID)

        expect(screen.getByText(TITLE_COPY)).toBeInTheDocument()
        expect(screen.getByText(SUBTITLE_COPY)).toBeInTheDocument()
        expect(alert).toHaveAttribute('data-alert-type', 'danger')
        expect(alert).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(getRetryButton()).toHaveTextContent(RETRY_COPY)
        expect(getLogOutButton()).toHaveTextContent(LOG_OUT_COPY)
        expect(screen.queryByTestId(MOCK_SPINNER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should not redirect home', () => {
        render(<CreateOrganization />)

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })

      it('THEN should not render the form', () => {
        render(<CreateOrganization />)

        expect(screen.queryByTestId(MOCK_FORM_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the current user is still loading', () => {
      it('THEN should show the error card instead of the spinner', () => {
        answerCurrentUser({ hasUser: false, loading: true })

        render(<CreateOrganization />)

        expect(screen.getByTestId(MOCK_ALERT_TEST_ID)).toBeInTheDocument()
        expect(getRetryButton()).toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_SPINNER_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_FORM_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking retry', () => {
      it('THEN should check again without logging out', async () => {
        render(<CreateOrganization />)

        await userEvent.click(getRetryButton())

        expect(mockRetry).toHaveBeenCalledTimes(1)
        expect(mockLogOut).not.toHaveBeenCalled()
      })
    })

    describe('WHEN clicking log out', () => {
      it('THEN should log out without navigating itself', async () => {
        render(<CreateOrganization />)

        await userEvent.click(getLogOutButton())

        expect(mockLogOut).toHaveBeenCalledWith(mockClient, true)
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
