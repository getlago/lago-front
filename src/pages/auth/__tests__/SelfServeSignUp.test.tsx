import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'
import { ComponentProps } from 'react'

import { PASSWORD_HINTS_TEST_IDS } from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import { envGlobalVar, initializeTranslations } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { LOGIN_ROUTE } from '~/core/router'
import * as localStorageUtils from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken, loadRecaptcha, unloadRecaptcha } from '~/core/utils/recaptcha'
import {
  PASSWORD_VALIDATION_ERRORS,
  PASSWORD_VALIDATION_TEST_IDS,
} from '~/formValidation/zodCustoms'
import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import type { SelfServeCheckEmail } from '../components/selfServeCheckEmail/SelfServeCheckEmail'
import SelfServeSignUp from '../SelfServeSignUp'
import {
  SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID,
  SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID,
  SELF_SERVE_SIGNUP_EMAIL_FIELD_TEST_ID,
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_PASSWORD_FIELD_TEST_ID,
  SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID,
  SIGNUP_SUBMIT_BUTTON_TEST_ID,
} from '../signUpTestIds'

type EnvGlobal = ReturnType<typeof envGlobalVar>
type SelfServeCheckEmailProps = ComponentProps<typeof SelfServeCheckEmail>

function mockRenderCheckEmail({
  email,
  signupSecret,
  onGoBack,
  onStartAgain,
}: SelfServeCheckEmailProps): JSX.Element {
  return (
    <div data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
      {email}
      {signupSecret}
      <button data-test={SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID} onClick={onGoBack} />
      <button data-test={SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID} onClick={onStartAgain} />
    </div>
  )
}

jest.mock('../components/selfServeCheckEmail/SelfServeCheckEmail', () => ({
  SelfServeCheckEmail: (props: SelfServeCheckEmailProps) => mockRenderCheckEmail(props),
}))

jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient')

  return { ...actual, envGlobalVar: jest.fn(actual.envGlobalVar) }
})

const mockSignUp = jest.fn()
const mockCheckSignupEmail = jest.fn()
const mockUseSelfServeSignUpMutation = jest.fn()
const mockUseSignupEmailCheckLazyQuery = jest.fn()

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/core/utils/recaptcha', () => ({
  loadRecaptcha: jest.fn(),
  unloadRecaptcha: jest.fn(),
  getRecaptchaToken: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useSelfServeSignUpMutation: (...args: unknown[]) => mockUseSelfServeSignUpMutation(...args),
  useSignupEmailCheckLazyQuery: (...args: unknown[]) => mockUseSignupEmailCheckLazyQuery(...args),
}))

// jsdom never lays out the popper's scroll container, so options render only with this.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (config: { count: number; estimateSize: (index: number) => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: config.count }, (_, index) => ({
        index,
        key: index,
        size: config.estimateSize(index),
        start: index * config.estimateSize(index),
      })),
    getTotalSize: () => config.count * config.estimateSize(0),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

const mockedEnvGlobalVar = jest.mocked(envGlobalVar)
const mockedLoadRecaptcha = jest.mocked(loadRecaptcha)
const mockedUnloadRecaptcha = jest.mocked(unloadRecaptcha)
const mockedGetRecaptchaToken = jest.mocked(getRecaptchaToken)

const TERMS_OF_SERVICE_URL = 'https://www.getlago.com/company/terms-of-service'
const PRIVACY_POLICY_URL = 'https://www.getlago.com/company/privacy-policy'
const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy'
const GOOGLE_TERMS_URL = 'https://policies.google.com/terms'
const RECAPTCHA_SITE_KEY = 'recaptcha-site-key'

const PAGE_ORIGIN = window.location.origin
const US_FRONT_URL = 'https://app.getlago.com/'
const EU_FRONT_URL = 'https://app.eu.getlago.com/'
const US_SIGN_UP_URL = 'https://app.getlago.com/sign-up'
const EU_SIGN_UP_URL = 'https://app.eu.getlago.com/sign-up'

const UNITED_STATES = 'United States'
const EUROPEAN_UNION = 'European Union'

const VALID_EMAIL = 'jane@hooli.com'
const PERSONAL_EMAIL = 'jane@gmail.com'
const VALID_PASSWORD = 'Abcdefg1!'
const SIGNUP_SECRET = 'signup-secret-1'
const RECAPTCHA_TOKEN = 'recaptcha-token-1'

const EMAIL_REQUIRED_COPY = 'Please fill this input to move forward'
const EMAIL_INVALID_COPY = 'This value is not an email address, please enter a valid email.'
const COMPANY_EMAIL_COPY = 'Please use your company email address.'
const PASSWORD_REQUIRED_COPY = 'Password is required'
const PASSWORD_TOO_LONG_COPY = 'Use a shorter password.'
const TOO_MANY_ATTEMPTS_COPY = 'Too many attempts. Please wait a few minutes and try again.'
const SIGN_UP_UNAVAILABLE_COPY = 'Sign-up is unavailable right now. Please reload the page.'
const CAPTCHA_FAILED_COPY = "We couldn't confirm you're human. Please try again."
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'
const RECAPTCHA_NOTICE_COPY =
  'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.'
const RECAPTCHA_NOTICE_START = /^This site is protected by reCAPTCHA/

const SIGN_UP_SUCCESS = { data: { signUp: { signupSecret: SIGNUP_SECRET } } }
const EMAIL_CHECK_VALID = { data: { signupEmailCheck: { code: null } } }
const EMAIL_CHECK_PERSONAL = {
  data: { signupEmailCheck: { code: 'email_domain_not_allowed' } },
}

const buildSignUpError = (
  extensions: Record<string, unknown>,
): { data: null; errors: GraphQLFormattedError[] } => ({
  data: null,
  errors: [{ message: 'error', extensions }],
})

const LOCK_ERROR = buildSignUpError({ status: 422, code: LagoApiError.LockAcquisitionFailed })

const getRealEnv = (): EnvGlobal =>
  jest.requireActual<typeof import('~/core/apolloClient')>('~/core/apolloClient').envGlobalVar()

const mockRegionFrontUrls = ({
  usFrontUrl,
  euFrontUrl,
}: Pick<EnvGlobal, 'usFrontUrl' | 'euFrontUrl'>): void => {
  mockedEnvGlobalVar.mockReturnValue({ ...getRealEnv(), usFrontUrl, euFrontUrl })
}

const mockRecaptchaSiteKey = (recaptchaSiteKey: EnvGlobal['recaptchaSiteKey']): void => {
  mockedEnvGlobalVar.mockReturnValue({
    ...getRealEnv(),
    usFrontUrl: '',
    euFrontUrl: '',
    recaptchaSiteKey,
  })
}

// jsdom makes window.location.assign read-only, so the spy goes on the object it delegates to
const spyOnLocationAssign = (): jest.SpyInstance => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find(
    (symbol) => symbol.description === 'impl',
  ) as symbol
  const locationImpl = (window.location as unknown as Record<symbol, Pick<Location, 'assign'>>)[
    implSymbol
  ]

  return jest.spyOn(locationImpl, 'assign').mockImplementation(() => undefined)
}

const getFieldInput = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

const getEmailInput = (): HTMLInputElement => getFieldInput(SELF_SERVE_SIGNUP_EMAIL_FIELD_TEST_ID)

const getPasswordInput = (): HTMLInputElement =>
  getFieldInput(SELF_SERVE_SIGNUP_PASSWORD_FIELD_TEST_ID)

const fillForm = async (
  user: UserEvent,
  { email = VALID_EMAIL, password = VALID_PASSWORD }: { email?: string; password?: string } = {},
): Promise<void> => {
  await user.type(getEmailInput(), email)
  await user.click(getPasswordInput())
  await user.paste(password)
}

const submitForm = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getByTestId(SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID))
}

const getLinksTo = (href: string): HTMLElement[] =>
  screen.getAllByRole('link').filter((link) => link.getAttribute('href') === href)

const getRegionInput = (): HTMLInputElement =>
  within(screen.getByTestId(SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID)).getByRole(
    'combobox',
  ) as HTMLInputElement

const pickRegion = async (regionLabel: string): Promise<void> => {
  const user = userEvent.setup()

  await user.click(getRegionInput())

  const options = await screen.findAllByRole('option')

  await user.click(options.find((option) => option.textContent === regionLabel) as HTMLElement)
}

describe('SelfServeSignUp', () => {
  let assignSpy: jest.SpyInstance

  beforeAll(async () => {
    await initializeTranslations()
  })

  let setItemFromLSSpy: jest.SpyInstance
  let removeItemFromLSSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    assignSpy = spyOnLocationAssign()
    setItemFromLSSpy = jest
      .spyOn(localStorageUtils, 'setItemFromLS')
      .mockImplementation(() => undefined)
    removeItemFromLSSpy = jest
      .spyOn(localStorageUtils, 'removeItemFromLS')
      .mockImplementation(() => undefined)
    mockUseSelfServeSignUpMutation.mockReturnValue([mockSignUp])
    mockUseSignupEmailCheckLazyQuery.mockReturnValue([mockCheckSignupEmail])
    mockSignUp.mockResolvedValue(SIGN_UP_SUCCESS)
    mockCheckSignupEmail.mockResolvedValue(EMAIL_CHECK_VALID)
    mockedLoadRecaptcha.mockResolvedValue(undefined)
    mockedGetRecaptchaToken.mockResolvedValue(RECAPTCHA_TOKEN)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the self-serve sign-up page is rendered', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN it shows the first step', () => {
      it('THEN should display the welcome title', () => {
        render(<SelfServeSignUp />)

        expect(screen.getByText('Welcome to Lago')).toBeInTheDocument()
      })

      it.each([
        ['terms of service', TERMS_OF_SERVICE_URL],
        ['privacy policy', PRIVACY_POLICY_URL],
      ])('THEN should link to the %s in a new tab', (_, url) => {
        render(<SelfServeSignUp />)

        const links = getLinksTo(url)

        expect(links).toHaveLength(1)
        expect(links[0]).toHaveAttribute('target', '_blank')
      })

      it('THEN should link to the login page', () => {
        render(<SelfServeSignUp />)

        expect(getLinksTo(LOGIN_ROUTE)).toHaveLength(1)
      })
    })

    describe('WHEN looking for the sign-up form', () => {
      it('THEN should not render the legacy submit button', () => {
        render(<SelfServeSignUp />)

        expect(screen.queryByTestId(SIGNUP_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it.each([
        ['email field', SELF_SERVE_SIGNUP_EMAIL_FIELD_TEST_ID],
        ['password field', SELF_SERVE_SIGNUP_PASSWORD_FIELD_TEST_ID],
        ['sign up button', SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        render(<SelfServeSignUp />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should hide the password checklist', () => {
        render(<SelfServeSignUp />)

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.HIDDEN)).toBeInTheDocument()
      })
    })

    describe('WHEN the operations are set up', () => {
      it('THEN should silence the error toasts of the sign-up mutation', () => {
        render(<SelfServeSignUp />)

        expect(mockUseSelfServeSignUpMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })

      it('THEN should silence the error toasts of the email check and skip the cache', () => {
        render(<SelfServeSignUp />)

        expect(mockUseSignupEmailCheckLazyQuery).toHaveBeenCalledWith({
          fetchPolicy: 'no-cache',
          context: { silentError: true },
        })
      })

      it('THEN should start loading the reCAPTCHA script without asking for a token', () => {
        render(<SelfServeSignUp />)

        expect(mockedLoadRecaptcha).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).not.toHaveBeenCalled()
        expect(mockedUnloadRecaptcha).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the user leaves the page', () => {
      it('THEN should unload the reCAPTCHA script', () => {
        const { unmount } = render(<SelfServeSignUp />)

        unmount()

        expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the user fills the email field', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN typing an address with uppercase letters', () => {
      it('THEN should lowercase it as typed', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), 'Jane@Hooli.COM')

        expect(getEmailInput()).toHaveValue(VALID_EMAIL)
      })
    })

    describe('WHEN leaving the field empty', () => {
      it('THEN should show the required message without checking the address', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.click(getEmailInput())
        await user.tab()

        expect(await screen.findByText(EMAIL_REQUIRED_COPY)).toBeInTheDocument()
        expect(getEmailInput()).toHaveAttribute('aria-invalid', 'true')
        expect(mockCheckSignupEmail).not.toHaveBeenCalled()
      })
    })

    describe('WHEN leaving the field with a malformed address', () => {
      it('THEN should show the format message without checking the address', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), 'raffi@')
        await user.tab()

        expect(await screen.findByText(EMAIL_INVALID_COPY)).toBeInTheDocument()
        expect(mockCheckSignupEmail).not.toHaveBeenCalled()
      })
    })

    describe('WHEN leaving the field with a personal address', () => {
      beforeEach(() => {
        mockCheckSignupEmail.mockResolvedValue(EMAIL_CHECK_PERSONAL)
      })

      it('THEN should check the trimmed address with the API', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), `${PERSONAL_EMAIL} `)
        await user.tab()

        await waitFor(() => {
          expect(mockCheckSignupEmail).toHaveBeenCalledWith({
            variables: { email: PERSONAL_EMAIL },
          })
        })
      })

      it('THEN should show the company email message on the field', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), PERSONAL_EMAIL)
        await user.tab()

        expect(await screen.findByText(COMPANY_EMAIL_COPY)).toBeInTheDocument()
        expect(getEmailInput()).toHaveAttribute('aria-invalid', 'true')
      })

      it('THEN should clear the message once the address is edited', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), PERSONAL_EMAIL)
        await user.tab()
        await screen.findByText(COMPANY_EMAIL_COPY)

        await user.type(getEmailInput(), 'x')

        expect(screen.queryByText(COMPANY_EMAIL_COPY)).not.toBeInTheDocument()
        expect(getEmailInput()).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('WHEN the address changes before the check answers', () => {
      it('THEN should ignore the stale answer', async () => {
        const user = userEvent.setup()
        let answerCheck: (answer: typeof EMAIL_CHECK_PERSONAL) => void = () => undefined

        mockCheckSignupEmail.mockReturnValue(
          new Promise((resolve) => {
            answerCheck = resolve
          }),
        )

        render(<SelfServeSignUp />)

        await user.type(getEmailInput(), PERSONAL_EMAIL)
        await user.tab()
        await user.type(getEmailInput(), 'x')

        await act(async () => {
          answerCheck(EMAIL_CHECK_PERSONAL)
        })

        expect(screen.queryByText(COMPANY_EMAIL_COPY)).not.toBeInTheDocument()
        expect(getEmailInput()).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('WHEN typing the address then submitting the form', () => {
      it('THEN should check the address only when the field is left', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)

        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledTimes(1)
        })
        expect(mockCheckSignupEmail).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the user types a password', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN the password misses some rules', () => {
      it('THEN should show the checklist with the unmet rules marked', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getPasswordInput(), 'abcdefgh')

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
        expect(
          [
            PASSWORD_VALIDATION_ERRORS.MIN,
            PASSWORD_VALIDATION_ERRORS.LOWERCASE,
            PASSWORD_VALIDATION_ERRORS.UPPERCASE,
            PASSWORD_VALIDATION_ERRORS.NUMBER,
            PASSWORD_VALIDATION_ERRORS.SPECIAL,
          ].map((rule) => !!screen.queryByTestId(PASSWORD_VALIDATION_TEST_IDS[rule])),
        ).toEqual([false, false, true, true, true])
      })

      it('THEN should not put the field in error before a submit', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getPasswordInput(), 'abcdefgh')

        expect(getPasswordInput()).toHaveAttribute('aria-invalid', 'false')
      })
    })

    describe('WHEN every rule is met with accented letters', () => {
      it('THEN should show the checklist without any unmet rule nor success message', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await user.type(getPasswordInput(), 'Éé1!aaaa')

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
        expect(
          Object.values(PASSWORD_VALIDATION_TEST_IDS).filter((testId) =>
            screen.queryByTestId(testId),
          ),
        ).toEqual([])
        expect(screen.queryByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user submits the form', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN both fields are empty', () => {
      it('THEN should show the required messages without signing up', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await submitForm(user)

        expect(await screen.findByText(EMAIL_REQUIRED_COPY)).toBeInTheDocument()
        expect(screen.getByText(PASSWORD_REQUIRED_COPY)).toBeInTheDocument()
        expect(mockSignUp).not.toHaveBeenCalled()
        expect(scrollToFirstInputError).toHaveBeenCalledWith(
          'self-serve-signup-form',
          expect.objectContaining({ email: expect.anything() }),
        )
      })
    })

    describe('WHEN the password misses some rules', () => {
      it('THEN should put the password field in error without signing up', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user, { password: 'abcdefgh' })
        await submitForm(user)

        await waitFor(() => {
          expect(getPasswordInput()).toHaveAttribute('aria-invalid', 'true')
        })
        expect(
          screen.getByTestId(PASSWORD_VALIDATION_TEST_IDS[PASSWORD_VALIDATION_ERRORS.UPPERCASE]),
        ).toBeInTheDocument()
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the password exceeds 72 bytes', () => {
      it('THEN should show the too long message without signing up', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user, { password: `aB1!${'é'.repeat(70)}` })
        await submitForm(user)

        expect(await screen.findByText(PASSWORD_TOO_LONG_COPY)).toBeInTheDocument()
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the password exceeds 72 bytes and misses some rules', () => {
      it('THEN should show the too long message on the field in error without signing up', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user, { password: 'a'.repeat(80) })
        await submitForm(user)

        expect(await screen.findByText(PASSWORD_TOO_LONG_COPY)).toBeInTheDocument()
        expect(getPasswordInput()).toHaveAttribute('aria-invalid', 'true')
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })

    describe('WHEN both fields are valid', () => {
      it('THEN should sign up with the trimmed email, the password and the signup captcha token', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user, { email: `${VALID_EMAIL} ` })
        await submitForm(user)

        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledTimes(1)
        })
        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
        expect(mockedGetRecaptchaToken).toHaveBeenCalledWith('signup')
        expect(mockSignUp).toHaveBeenCalledWith({
          variables: {
            input: { email: VALID_EMAIL, password: VALID_PASSWORD, captchaToken: RECAPTCHA_TOKEN },
          },
        })
      })
    })

    describe('WHEN no captcha token can be obtained', () => {
      beforeEach(() => {
        mockedGetRecaptchaToken.mockResolvedValue(null)
      })

      it('THEN should still sign up with a null captcha token', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)

        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledWith({
            variables: {
              input: { email: VALID_EMAIL, password: VALID_PASSWORD, captchaToken: null },
            },
          })
        })
      })
    })
  })

  describe('GIVEN the sign-up succeeds', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    describe('WHEN the form is submitted', () => {
      it('THEN should store the signup secret', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)

        await waitFor(() => {
          expect(setItemFromLSSpy).toHaveBeenCalledWith(
            SELF_SERVE_SIGNUP_SECRET_LS_KEY,
            SIGNUP_SECRET,
          )
        })
      })

      it('THEN should replace the form with the check email step showing the address', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)

        expect(await screen.findByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).toHaveTextContent(
          VALID_EMAIL,
        )
        expect(
          screen.queryByTestId(SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should hand the signup secret of the answer to the check email step', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)

        expect(await screen.findByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).toHaveTextContent(
          SIGNUP_SECRET,
        )
      })
    })

    describe('WHEN clicking go back on the check email step', () => {
      it('THEN should show the form again with the typed values', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)
        await user.click(await screen.findByTestId(SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID))

        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).not.toBeInTheDocument()
        expect(getEmailInput()).toHaveValue(VALID_EMAIL)
        expect(getPasswordInput()).toHaveValue(VALID_PASSWORD)
      })

      it('THEN should keep the stored signup secret', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)
        await user.click(await screen.findByTestId(SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID))

        expect(removeItemFromLSSpy).not.toHaveBeenCalled()
      })
    })

    describe('WHEN clicking start again on the check email step', () => {
      it('THEN should show the form again with the typed values', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)
        await user.click(await screen.findByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID))

        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).not.toBeInTheDocument()
        expect(getEmailInput()).toHaveValue(VALID_EMAIL)
        expect(getPasswordInput()).toHaveValue(VALID_PASSWORD)
      })

      it('THEN should remove the stored signup secret', async () => {
        const user = userEvent.setup()

        render(<SelfServeSignUp />)

        await fillForm(user)
        await submitForm(user)
        await user.click(await screen.findByTestId(SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID))

        expect(removeItemFromLSSpy).toHaveBeenCalledTimes(1)
        expect(removeItemFromLSSpy).toHaveBeenCalledWith(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
      })
    })
  })

  describe('GIVEN the sign-up answers with an error', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: '', euFrontUrl: '' })
    })

    const submitValidForm = async (): Promise<void> => {
      const user = userEvent.setup()

      render(<SelfServeSignUp />)

      await fillForm(user)
      await submitForm(user)
    }

    describe('WHEN the error holds email and password details', () => {
      beforeEach(() => {
        mockSignUp.mockResolvedValue(
          buildSignUpError({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { email: ['email_domain_not_allowed'], password: ['password_too_long'] },
          }),
        )
      })

      it('THEN should show each message under its field', async () => {
        await submitValidForm()

        expect(await screen.findByText(COMPANY_EMAIL_COPY)).toBeInTheDocument()
        expect(screen.getByText(PASSWORD_TOO_LONG_COPY)).toBeInTheDocument()
        expect(getEmailInput()).toHaveAttribute('aria-invalid', 'true')
        expect(getPasswordInput()).toHaveAttribute('aria-invalid', 'true')
      })

      it('THEN should stay on the form without banner nor stored secret', async () => {
        await submitValidForm()

        await screen.findByText(COMPANY_EMAIL_COPY)

        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).not.toBeInTheDocument()
        expect(setItemFromLSSpy).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API refuses a password that meets the client rules', () => {
      beforeEach(() => {
        mockSignUp.mockResolvedValue(
          buildSignUpError({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { password: ['password_missing_number'] },
          }),
        )
      })

      it('THEN should put the password field in error and stay on the form', async () => {
        await submitValidForm()

        await waitFor(() => {
          expect(getPasswordInput()).toHaveAttribute('aria-invalid', 'true')
        })
        expect(getPasswordInput()).toHaveValue(VALID_PASSWORD)
        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the error is shown in the banner', () => {
      it.each([
        [LagoApiError.TooManyRequests, 429, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.SelfServeDisabled, 403, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SignupDisabled, 403, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.CaptchaFailed, 403, CAPTCHA_FAILED_COPY],
        [LagoApiError.CaptchaUnavailable, 500, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message', async (code, status, expectedCopy) => {
        mockSignUp.mockResolvedValue(buildSignUpError({ status, code }))

        await submitValidForm()

        expect(await screen.findByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)).toHaveTextContent(
          expectedCopy,
        )
        expect(setItemFromLSSpy).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show the generic message in the banner', async () => {
        mockSignUp.mockRejectedValue(new Error('Failed to fetch'))

        await submitValidForm()

        expect(await screen.findByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)).toHaveTextContent(
          GENERIC_ERROR_COPY,
        )
      })
    })

    describe('WHEN the lock is busy', () => {
      beforeEach(() => {
        mockSignUp.mockResolvedValue(LOCK_ERROR)
      })

      it('THEN should show the generic message without retrying', async () => {
        await submitValidForm()

        expect(await screen.findByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)).toHaveTextContent(
          GENERIC_ERROR_COPY,
        )
        expect(mockSignUp).toHaveBeenCalledTimes(1)
      })

      it('THEN should ask Google for a single token', async () => {
        await submitValidForm()

        await screen.findByTestId(SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID)

        expect(mockedGetRecaptchaToken).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockRecaptchaSiteKey(RECAPTCHA_SITE_KEY)
    })

    describe('WHEN the form is shown', () => {
      it('THEN should display the reCAPTCHA notice', () => {
        render(<SelfServeSignUp />)

        expect(screen.getByText(RECAPTCHA_NOTICE_START)).toHaveTextContent(RECAPTCHA_NOTICE_COPY)
      })

      it.each([
        ['privacy policy', GOOGLE_PRIVACY_POLICY_URL],
        ['terms of service', GOOGLE_TERMS_URL],
      ])('THEN should link the notice to the Google %s in a new tab', (_, url) => {
        render(<SelfServeSignUp />)

        const links = getLinksTo(url)

        expect(links).toHaveLength(1)
        expect(links[0]).toHaveAttribute('target', '_blank')
        expect(screen.getByText(RECAPTCHA_NOTICE_START)).toContainElement(links[0])
      })
    })
  })

  describe('GIVEN no reCAPTCHA site key is configured', () => {
    beforeEach(() => {
      mockRecaptchaSiteKey('')
    })

    describe('WHEN the form is shown', () => {
      it('THEN should not display the reCAPTCHA notice nor its links', () => {
        render(<SelfServeSignUp />)

        expect(screen.queryByText(RECAPTCHA_NOTICE_START)).not.toBeInTheDocument()
        expect(getLinksTo(GOOGLE_PRIVACY_POLICY_URL)).toHaveLength(0)
        expect(getLinksTo(GOOGLE_TERMS_URL)).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a region front URL is missing or invalid', () => {
    it.each([
      ['the US front URL is missing', '', EU_FRONT_URL],
      ['the EU front URL is missing', US_FRONT_URL, ''],
      ['both front URLs are missing', '', ''],
      ['the US front URL has no scheme', 'app.getlago.com', EU_FRONT_URL],
      ['the EU front URL is a host and port without scheme', US_FRONT_URL, 'localhost:3004'],
      ['the EU front URL is not a URL', US_FRONT_URL, 'not a url'],
    ])('THEN should not render the data region select when %s', (_, usFrontUrl, euFrontUrl) => {
      mockRegionFrontUrls({ usFrontUrl, euFrontUrl })

      render(<SelfServeSignUp />)

      expect(screen.queryByTestId(SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN both region front URLs are valid', () => {
    describe('WHEN the select is opened', () => {
      it('THEN should list the European Union then the United States', async () => {
        mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: EU_FRONT_URL })

        render(<SelfServeSignUp />)

        await userEvent.setup().click(getRegionInput())

        const options = await screen.findAllByRole('option')

        expect(options.map((option) => option.textContent)).toEqual([EUROPEAN_UNION, UNITED_STATES])
      })
    })

    describe('WHEN detecting the current region from the page origin', () => {
      it.each([
        {
          origin: 'the US front',
          usFrontUrl: PAGE_ORIGIN,
          euFrontUrl: EU_FRONT_URL,
          selectedRegion: UNITED_STATES,
        },
        {
          origin: 'the EU front',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: PAGE_ORIGIN,
          selectedRegion: EUROPEAN_UNION,
        },
        {
          origin: 'the EU front configured with a trailing path',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: `${PAGE_ORIGIN}/sign-up`,
          selectedRegion: EUROPEAN_UNION,
        },
        {
          origin: 'neither front',
          usFrontUrl: US_FRONT_URL,
          euFrontUrl: EU_FRONT_URL,
          selectedRegion: UNITED_STATES,
        },
      ])(
        'THEN should select $selectedRegion when the page is served from $origin',
        ({ usFrontUrl, euFrontUrl, selectedRegion }) => {
          mockRegionFrontUrls({ usFrontUrl, euFrontUrl })

          render(<SelfServeSignUp />)

          expect(getRegionInput()).toHaveValue(selectedRegion)
        },
      )
    })
  })

  describe('GIVEN the page is served from the US front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: PAGE_ORIGIN, euFrontUrl: EU_FRONT_URL })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should open the EU sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(EU_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the United States', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the page is served from the EU front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: PAGE_ORIGIN })
    })

    describe('WHEN picking the United States', () => {
      it('THEN should open the US sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(US_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the page is served from neither region front', () => {
    beforeEach(() => {
      mockRegionFrontUrls({ usFrontUrl: US_FRONT_URL, euFrontUrl: EU_FRONT_URL })
    })

    describe('WHEN picking the European Union', () => {
      it('THEN should open the EU sign-up page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(EUROPEAN_UNION)

        expect(assignSpy).toHaveBeenCalledTimes(1)
        expect(assignSpy).toHaveBeenCalledWith(EU_SIGN_UP_URL)
      })
    })

    describe('WHEN picking the default United States', () => {
      it('THEN should stay on the current page', async () => {
        render(<SelfServeSignUp />)

        await pickRegion(UNITED_STATES)

        expect(assignSpy).not.toHaveBeenCalled()
      })
    })
  })
})
