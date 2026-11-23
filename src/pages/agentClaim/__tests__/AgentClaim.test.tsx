import { screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'

import { addToast, initializeTranslations, isSilencedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import AgentClaim from '../AgentClaim'
import {
  AGENT_CLAIM_CODE_FIELD_TEST_ID,
  AGENT_CLAIM_EMAIL_FIELD_TEST_ID,
  AGENT_CLAIM_ERROR_ALERT_TEST_ID,
  AGENT_CLAIM_LOADING_TEST_ID,
  AGENT_CLAIM_NEW_CODE_BUTTON_TEST_ID,
  AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID,
  AGENT_CLAIM_SUCCESS_ALERT_TEST_ID,
  AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID,
  AGENT_CLAIM_VERIFY_SUBMIT_BUTTON_TEST_ID,
  AGENT_CLAIM_VERIFY_SUBTITLE_TEST_ID,
} from '../agentClaimTestIds'
import { START_SILENT_ERROR_DETAILS, VERIFY_SILENT_ERROR_DETAILS } from '../validationSchema'

const ERROR_404_STUB_TEST_ID = 'error-404-stub'

const mockStartClaim = jest.fn()
const mockVerifyClaim = jest.fn()
const mockUseGetAgentClaimPageQuery = jest.fn()
const mockUseStartAgentClaimMutation = jest.fn()
const mockUseVerifyAgentClaimMutation = jest.fn()

function mockRenderError404(): JSX.Element {
  return <div data-test={ERROR_404_STUB_TEST_ID} />
}

jest.mock('~/pages/Error404', () => ({
  __esModule: true,
  default: () => mockRenderError404(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAgentClaimPageQuery: (...args: unknown[]) => mockUseGetAgentClaimPageQuery(...args),
  useStartAgentClaimMutation: (...args: unknown[]) => mockUseStartAgentClaimMutation(...args),
  useVerifyAgentClaimMutation: (...args: unknown[]) => mockUseVerifyAgentClaimMutation(...args),
}))

const STOREFRONT_ID = 'storefront-1'
const CLAIM_CODE = 'ABCD-1234'
const EMAIL = 'jane@hooli.com'
const VERIFICATION_CODE = '482917'

const CLAIM_CODE_REQUIRED_COPY = 'Claim code is required'
const EMAIL_REQUIRED_COPY = 'Email is required'
const EMAIL_INVALID_COPY = 'This value is not an email address, please enter a valid email.'
const INVALID_CLAIM_CODE_COPY =
  'This code is invalid, already used or replaced by a newer one. Ask your agent for the latest code.'
const SIX_DIGITS_COPY = 'Enter the 6-digit code from the email'
const WRONG_CODE_COPY = 'Wrong code. Check the email or send the code again.'
const EXPIRED_CODE_COPY = 'This code expired. Send a new one.'
const LINKED_COPY =
  'Agentic Flow A is linked to jane@hooli.com. Any free credits offered by Acme Inc are now available to it.'

const PAGE_DATA = {
  agentClaimPage: { storefrontName: 'Agentic Flow A', organizationName: 'Acme Inc' },
}
const START_SUCCESS = { data: { startAgentClaim: { expiresIn: 600 } } }
const VERIFY_SUCCESS = { data: { verifyAgentClaim: { status: 'verified' } } }

type ErrorResult = { data: null; errors: GraphQLFormattedError[] }

const buildError = (extensions: Record<string, unknown>): ErrorResult => ({
  data: null,
  errors: [{ message: 'error', extensions }],
})

const buildDetailError = (details: Record<string, string[]>): ErrorResult =>
  buildError({ status: 422, code: LagoApiError.UnprocessableEntity, details })

const TOO_MANY_REQUESTS = buildError({ status: 429, code: LagoApiError.TooManyRequests })
const STOREFRONT_GONE = buildError({
  status: 404,
  code: LagoApiError.NotFound,
  details: { agentStorefront: ['not_found'] },
})
const UNKNOWN_ERROR = buildError({ status: 500, code: LagoApiError.InternalError })

const TOAST_OUTCOMES: Array<[string, ErrorResult]> = [
  ['the registration is inactive', buildDetailError({ base: ['registration_inactive'] })],
  ['the agent has no customer yet', buildDetailError({ base: ['enrollment_required'] })],
  ['the caller is throttled', TOO_MANY_REQUESTS],
  ['the storefront is gone', STOREFRONT_GONE],
]

const GENERIC_ERROR_KEY = 'text_622f7a3dc32ce100c46a5154'
const TOO_MANY_REQUESTS_KEY = 'text_1793898059309ltbe60gt6pd'

const getFieldInput = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

const fillClaimForm = async (
  user: UserEvent,
  { claimCode = CLAIM_CODE, email = EMAIL }: { claimCode?: string; email?: string } = {},
): Promise<void> => {
  await user.type(getFieldInput(AGENT_CLAIM_CODE_FIELD_TEST_ID), claimCode)
  await user.type(getFieldInput(AGENT_CLAIM_EMAIL_FIELD_TEST_ID), email)
}

const submitClaimForm = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getByTestId(AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID))
}

const goToVerifyStep = async (user: UserEvent): Promise<void> => {
  await fillClaimForm(user)
  await submitClaimForm(user)
  await screen.findByTestId(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID)
}

const submitVerificationCode = async (
  user: UserEvent,
  verificationCode = VERIFICATION_CODE,
): Promise<void> => {
  await user.type(getFieldInput(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID), verificationCode)
  await user.click(screen.getByTestId(AGENT_CLAIM_VERIFY_SUBMIT_BUTTON_TEST_ID))
}

const renderPage = (): void => {
  render(<AgentClaim />, { useParams: { storefrontId: STOREFRONT_ID } })
}

describe('AgentClaim', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetAgentClaimPageQuery.mockReturnValue({ data: PAGE_DATA, loading: false })
    mockUseStartAgentClaimMutation.mockReturnValue([mockStartClaim])
    mockUseVerifyAgentClaimMutation.mockReturnValue([mockVerifyClaim])
    mockStartClaim.mockResolvedValue(START_SUCCESS)
    mockVerifyClaim.mockResolvedValue(VERIFY_SUCCESS)
  })

  describe('GIVEN the operations are set up', () => {
    it('THEN should query the page of the storefront in the URL and report no error itself', () => {
      renderPage()

      expect(mockUseGetAgentClaimPageQuery).toHaveBeenCalledWith({
        variables: { storefrontId: STOREFRONT_ID },
        context: { silentError: true },
      })
    })

    it.each([
      ['start', mockUseStartAgentClaimMutation, START_SILENT_ERROR_DETAILS],
      ['verify', mockUseVerifyAgentClaimMutation, VERIFY_SILENT_ERROR_DETAILS],
    ])(
      'THEN should silence only the known errors of the %s mutation and never retry it',
      (_, hook, details) => {
        renderPage()

        expect(hook).toHaveBeenCalledWith({
          context: {
            disableRetry: true,
            silentErrorCodes: [LagoApiError.TooManyRequests, LagoApiError.NotFound],
            silentErrorDetails: details,
          },
        })
      },
    )

    it.each([
      ['start', 'claimCode', 'invalid_claim_code', START_SILENT_ERROR_DETAILS],
      ['start', 'email', 'invalid_email_format', START_SILENT_ERROR_DETAILS],
      ['start', 'base', 'registration_inactive', START_SILENT_ERROR_DETAILS],
      ['start', 'base', 'enrollment_required', START_SILENT_ERROR_DETAILS],
      ['verify', 'claimCode', 'invalid_claim_code', VERIFY_SILENT_ERROR_DETAILS],
      ['verify', 'verificationCode', 'invalid_verification_code', VERIFY_SILENT_ERROR_DETAILS],
      ['verify', 'verificationCode', 'verification_expired', VERIFY_SILENT_ERROR_DETAILS],
      ['verify', 'base', 'registration_inactive', VERIFY_SILENT_ERROR_DETAILS],
      ['verify', 'base', 'enrollment_required', VERIFY_SILENT_ERROR_DETAILS],
    ])(
      'THEN the error link should stay silent when %s answers %s: %s',
      (_, field, code, silentErrorDetails) => {
        const { extensions } = buildDetailError({ [field]: [code] }).errors[0]

        expect(isSilencedGQLError({ extensions, silentErrorCodes: [], silentErrorDetails })).toBe(
          true,
        )
      },
    )
  })

  describe('GIVEN the page is loading', () => {
    it('THEN should display the skeleton and no form', () => {
      mockUseGetAgentClaimPageQuery.mockReturnValue({ data: undefined, loading: true })

      renderPage()

      expect(screen.getByTestId(AGENT_CLAIM_LOADING_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a refetch runs while the form is displayed', () => {
    it('THEN should keep the form on screen', () => {
      mockUseGetAgentClaimPageQuery.mockReturnValue({ data: PAGE_DATA, loading: true })

      renderPage()

      expect(screen.getByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(AGENT_CLAIM_LOADING_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the storefront does not exist or the feature is off', () => {
    it('THEN should display the 404 page instead of the card', () => {
      mockUseGetAgentClaimPageQuery.mockReturnValue({
        data: { agentClaimPage: null },
        loading: false,
        error: { graphQLErrors: STOREFRONT_GONE.errors },
      })

      renderPage()

      expect(screen.getByTestId(ERROR_404_STUB_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(AGENT_CLAIM_ERROR_ALERT_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the page query fails for another reason', () => {
    it('THEN should display the error alert and neither the 404 page nor the form', () => {
      mockUseGetAgentClaimPageQuery.mockReturnValue({
        data: { agentClaimPage: null },
        loading: false,
        error: { graphQLErrors: UNKNOWN_ERROR.errors },
      })

      renderPage()

      expect(screen.getByTestId(AGENT_CLAIM_ERROR_ALERT_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(ERROR_404_STUB_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the claim step', () => {
    describe('WHEN it is displayed', () => {
      it('THEN should keep the submit button enabled before the first attempt', () => {
        renderPage()

        expect(screen.getByTestId(AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID)).toBeEnabled()
      })
    })

    describe('WHEN it is submitted empty', () => {
      it('THEN should display both required errors and call no mutation', async () => {
        const user = userEvent.setup()

        renderPage()
        await submitClaimForm(user)

        expect(await screen.findByText(CLAIM_CODE_REQUIRED_COPY)).toBeInTheDocument()
        expect(screen.getByTestId(AGENT_CLAIM_EMAIL_FIELD_TEST_ID).parentElement).toHaveTextContent(
          EMAIL_REQUIRED_COPY,
        )
        expect(mockStartClaim).not.toHaveBeenCalled()
        expect(scrollToFirstInputError).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the email is not valid', () => {
      it('THEN should display the email error and call no mutation', async () => {
        const user = userEvent.setup()

        renderPage()
        await fillClaimForm(user, { email: 'jane@' })
        await submitClaimForm(user)

        expect(await screen.findByText(EMAIL_INVALID_COPY)).toBeInTheDocument()
        expect(mockStartClaim).not.toHaveBeenCalled()
      })
    })

    describe('WHEN it is submitted with a code and an email', () => {
      it('THEN should start the claim with the trimmed values', async () => {
        const user = userEvent.setup()

        renderPage()
        await fillClaimForm(user, { claimCode: ` ${CLAIM_CODE} `, email: ` ${EMAIL} ` })
        await submitClaimForm(user)

        await waitFor(() => {
          expect(mockStartClaim).toHaveBeenCalledWith({
            variables: {
              input: { storefrontId: STOREFRONT_ID, claimCode: CLAIM_CODE, email: EMAIL },
            },
          })
        })
      })

      it.each([
        [600, '10 minutes'],
        [61, '2 minutes'],
        [60, '1 minute.'],
      ])(
        'THEN should show the email and the lifetime of a code valid %s seconds as %s',
        async (expiresIn, lifetime) => {
          const user = userEvent.setup()

          mockStartClaim.mockResolvedValue({ data: { startAgentClaim: { expiresIn } } })
          renderPage()
          await goToVerifyStep(user)

          const subtitle = screen.getByTestId(AGENT_CLAIM_VERIFY_SUBTITLE_TEST_ID)

          expect(subtitle).toHaveTextContent(EMAIL)
          expect(subtitle).toHaveTextContent(lifetime)
        },
      )
    })

    describe('WHEN the API refuses a field', () => {
      it.each([
        ['claim code', { claimCode: ['invalid_claim_code'] }, INVALID_CLAIM_CODE_COPY],
        ['email', { email: ['invalid_email_format'] }, EMAIL_INVALID_COPY],
      ])('THEN should display the %s error and stay on the step', async (_, details, copy) => {
        const user = userEvent.setup()

        mockStartClaim.mockResolvedValue(buildDetailError(details))
        renderPage()
        await fillClaimForm(user)
        await submitClaimForm(user)

        expect(await screen.findByText(copy)).toBeInTheDocument()
        expect(screen.getByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toBeInTheDocument()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API answers a known error that belongs to no field', () => {
      it.each(TOAST_OUTCOMES)('THEN should show one error toast when %s', async (_, result) => {
        const user = userEvent.setup()

        mockStartClaim.mockResolvedValue(result)
        renderPage()
        await fillClaimForm(user)
        await submitClaimForm(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(screen.getByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the caller is throttled', () => {
      it('THEN should tell the user to wait rather than show the generic error', async () => {
        const user = userEvent.setup()

        mockStartClaim.mockResolvedValue(TOO_MANY_REQUESTS)
        renderPage()
        await fillClaimForm(user)
        await submitClaimForm(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: TOO_MANY_REQUESTS_KEY,
        })
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show one generic error toast', async () => {
        const user = userEvent.setup()

        mockStartClaim.mockRejectedValue(new Error('Failed to fetch'))
        renderPage()
        await fillClaimForm(user)
        await submitClaimForm(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: GENERIC_ERROR_KEY,
        })
      })
    })

    describe('WHEN the API answers an unknown error', () => {
      it('THEN should leave the toast to the error link', async () => {
        const user = userEvent.setup()

        mockStartClaim.mockResolvedValue(UNKNOWN_ERROR)
        renderPage()
        await fillClaimForm(user)
        await submitClaimForm(user)

        await waitFor(() => expect(mockStartClaim).toHaveBeenCalledTimes(1))
        await waitFor(() =>
          expect(screen.getByTestId(AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID)).toBeEnabled(),
        )
        expect(addToast).not.toHaveBeenCalled()
        expect(screen.getByTestId(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the verification step', () => {
    describe('WHEN the code does not have 6 digits', () => {
      it('THEN should display the format error and call no mutation', async () => {
        const user = userEvent.setup()

        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user, '12345')

        expect(await screen.findByText(SIX_DIGITS_COPY)).toBeInTheDocument()
        expect(mockVerifyClaim).not.toHaveBeenCalled()
        expect(scrollToFirstInputError).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN a 6-digit code is submitted', () => {
      it('THEN should verify the claim with the submitted claim code and the code without spaces', async () => {
        const user = userEvent.setup()

        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user, '482 917')

        await waitFor(() => {
          expect(mockVerifyClaim).toHaveBeenCalledWith({
            variables: {
              input: {
                storefrontId: STOREFRONT_ID,
                claimCode: CLAIM_CODE,
                verificationCode: VERIFICATION_CODE,
              },
            },
          })
        })
      })

      it('THEN should display the success state with the storefront, email and organization', async () => {
        const user = userEvent.setup()

        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        expect(await screen.findByTestId(AGENT_CLAIM_SUCCESS_ALERT_TEST_ID)).toHaveTextContent(
          LINKED_COPY,
        )
        expect(
          screen.queryByTestId(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the API refuses the verification code', () => {
      it.each([
        ['wrong', 'invalid_verification_code', WRONG_CODE_COPY],
        ['expired', 'verification_expired', EXPIRED_CODE_COPY],
      ])('THEN should display the %s code error and stay on the step', async (_, code, copy) => {
        const user = userEvent.setup()

        mockVerifyClaim.mockResolvedValue(buildDetailError({ verificationCode: [code] }))
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        expect(await screen.findByText(copy)).toBeInTheDocument()
        expect(screen.getByTestId(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID)).toBeInTheDocument()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API says the claim code is no longer valid', () => {
      it('THEN should go back to the claim step with both fields prefilled and the claim code error', async () => {
        const user = userEvent.setup()

        mockVerifyClaim.mockResolvedValue(buildDetailError({ claimCode: ['invalid_claim_code'] }))
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        expect(await screen.findByText(INVALID_CLAIM_CODE_COPY)).toBeInTheDocument()
        expect(getFieldInput(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toHaveValue(CLAIM_CODE)
        expect(getFieldInput(AGENT_CLAIM_EMAIL_FIELD_TEST_ID)).toHaveValue(EMAIL)
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API answers a known error that belongs to no field', () => {
      it.each(TOAST_OUTCOMES)('THEN should show one error toast when %s', async (_, result) => {
        const user = userEvent.setup()

        mockVerifyClaim.mockResolvedValue(result)
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(screen.getByTestId(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the caller is throttled', () => {
      it('THEN should tell the user to wait rather than show the generic error', async () => {
        const user = userEvent.setup()

        mockVerifyClaim.mockResolvedValue(TOO_MANY_REQUESTS)
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: TOO_MANY_REQUESTS_KEY,
        })
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show one error toast', async () => {
        const user = userEvent.setup()

        mockVerifyClaim.mockRejectedValue(new Error('Failed to fetch'))
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        await waitFor(() => expect(addToast).toHaveBeenCalledTimes(1))
      })
    })

    describe('WHEN the API answers an unknown error', () => {
      it('THEN should leave the toast to the error link', async () => {
        const user = userEvent.setup()

        mockVerifyClaim.mockResolvedValue(UNKNOWN_ERROR)
        renderPage()
        await goToVerifyStep(user)
        await submitVerificationCode(user)

        await waitFor(() => expect(mockVerifyClaim).toHaveBeenCalledTimes(1))
        await waitFor(() =>
          expect(screen.getByTestId(AGENT_CLAIM_VERIFY_SUBMIT_BUTTON_TEST_ID)).toBeEnabled(),
        )
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a new code is needed', () => {
      it('THEN should go back to the claim step with both fields prefilled and no error', async () => {
        const user = userEvent.setup()

        renderPage()
        await goToVerifyStep(user)
        await user.click(screen.getByTestId(AGENT_CLAIM_NEW_CODE_BUTTON_TEST_ID))

        expect(getFieldInput(AGENT_CLAIM_CODE_FIELD_TEST_ID)).toHaveValue(CLAIM_CODE)
        expect(getFieldInput(AGENT_CLAIM_EMAIL_FIELD_TEST_ID)).toHaveValue(EMAIL)
        expect(screen.queryByText(INVALID_CLAIM_CODE_COPY)).not.toBeInTheDocument()
      })

      it('THEN should send a new code in one click and show an empty verification field', async () => {
        const user = userEvent.setup()

        renderPage()
        await goToVerifyStep(user)
        await user.type(getFieldInput(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID), '111111')
        await user.click(screen.getByTestId(AGENT_CLAIM_NEW_CODE_BUTTON_TEST_ID))
        await submitClaimForm(user)

        await waitFor(() => expect(mockStartClaim).toHaveBeenCalledTimes(2))
        expect(mockStartClaim).toHaveBeenLastCalledWith({
          variables: {
            input: { storefrontId: STOREFRONT_ID, claimCode: CLAIM_CODE, email: EMAIL },
          },
        })
        await screen.findByTestId(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID)
        expect(getFieldInput(AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID)).toHaveValue('')
      })
    })
  })
})
