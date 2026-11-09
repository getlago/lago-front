import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { initializeTranslations } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import type { useNeedsOrganization } from '~/hooks/useNeedsOrganization'
import { render, testMockNavigateFn } from '~/test-utils'

import CreateOrganization from '../CreateOrganization'
import {
  SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID,
} from '../signUpTestIds'

type NeedsOrganizationAnswer = ReturnType<typeof useNeedsOrganization>

const MOCK_SPINNER_TEST_ID = 'create-organization-spinner'
const MOCK_ALERT_TEST_ID = 'create-organization-alert'
const TITLE_COPY = 'Create your organization'
const LOG_OUT_COPY = 'Log out'
const RETRY_COPY = 'Retry'
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'

const mockClient = { query: jest.fn(), mutate: jest.fn() }
const mockUseNeedsOrganization = jest.fn<NeedsOrganizationAnswer, []>()
const mockLogOut = jest.fn<Promise<void>, unknown[]>()
const mockRetry = jest.fn<Promise<void>, []>()

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

const getLogOutButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID)

const getRetryButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID)

const queryRetryButton = (): HTMLElement | null =>
  screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID)

const expectCardHidden = (): void => {
  expect(screen.getByTestId(MOCK_SPINNER_TEST_ID)).toBeInTheDocument()
  expect(screen.queryByText(TITLE_COPY)).not.toBeInTheDocument()
  expect(screen.queryByTestId(MOCK_ALERT_TEST_ID)).not.toBeInTheDocument()
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
      it('THEN should show the title and the log out action without an error', () => {
        render(<CreateOrganization />)

        expect(screen.getByText(TITLE_COPY)).toBeInTheDocument()
        expect(getLogOutButton()).toHaveTextContent(LOG_OUT_COPY)
        expect(screen.queryByTestId(MOCK_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(queryRetryButton()).not.toBeInTheDocument()
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
      it('THEN should show the title, a danger alert, a retry and the log out action', () => {
        render(<CreateOrganization />)

        const alert = screen.getByTestId(MOCK_ALERT_TEST_ID)

        expect(screen.getByText(TITLE_COPY)).toBeInTheDocument()
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
