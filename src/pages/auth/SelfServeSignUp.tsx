import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useState } from 'react'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form'
import {
  PASSWORD_VALIDATION_KEYS,
  PasswordValidationHints,
} from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import { envGlobalVar } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken, loadRecaptcha } from '~/core/utils/recaptcha'
import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'
import {
  LagoApiError,
  SelfServeSignUpMutation,
  useSelfServeSignUpMutation,
  useSignupEmailCheckLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import { SelfServeCheckEmail } from './components/SelfServeCheckEmail'
import {
  getSelfServePasswordErrors,
  isSelfServePasswordTooLong,
  SELF_SERVE_EMAIL_INVALID_ERROR,
  SELF_SERVE_EMAIL_REQUIRED_ERROR,
  SELF_SERVE_PASSWORD_TOO_LONG_ERROR,
  selfServeSignUpDefaultValues,
  selfServeSignUpEmailSchema,
  selfServeSignUpValidationSchema,
} from './selfServeSignUpForm/validationSchema'
import {
  SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID,
  SELF_SERVE_SIGNUP_EMAIL_FIELD_TEST_ID,
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_PASSWORD_FIELD_TEST_ID,
  SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID,
} from './signUpTestIds'

const SELF_SERVE_SIGNUP_FORM_ID = 'self-serve-signup-form'

gql`
  mutation selfServeSignUp($input: SignUpInput!) {
    signUp(input: $input) {
      signupSecret
    }
  }

  query signupEmailCheck($email: String!) {
    signupEmailCheck(email: $email) {
      code
    }
  }
`

const SIGN_UP_GENERIC_ERROR = 'text_1793898059309m0mmb7g8tw4'

const EMAIL_ERRORS: Record<string, string> = {
  value_is_mandatory: SELF_SERVE_EMAIL_REQUIRED_ERROR,
  invalid_email_format: SELF_SERVE_EMAIL_INVALID_ERROR,
  email_domain_not_allowed: 'text_1793898059308qc1jmsri8vx',
}

const PASSWORD_ERRORS: Record<string, string> = {
  value_is_mandatory: PASSWORD_VALIDATION_ERRORS.REQUIRED,
  password_too_short: PASSWORD_VALIDATION_ERRORS.MIN,
  password_missing_lowercase: PASSWORD_VALIDATION_ERRORS.LOWERCASE,
  password_missing_uppercase: PASSWORD_VALIDATION_ERRORS.UPPERCASE,
  password_missing_number: PASSWORD_VALIDATION_ERRORS.NUMBER,
  password_missing_special_character: PASSWORD_VALIDATION_ERRORS.SPECIAL,
  password_too_long: SELF_SERVE_PASSWORD_TOO_LONG_ERROR,
}

const GOOGLE_SIGN_UP_INCOMPLETE_ERROR = 'text_1793952050623c2labd0slvn'

const BANNER_ERRORS: Record<string, string> = {
  [LagoApiError.CaptchaFailed]: 'text_1793903925179h1k5w55ih95',
  [LagoApiError.SelfServeDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.SignupDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.TooManyRequests]: 'text_1793898059309ltbe60gt6pd',
  [LagoApiError.CompanyGoogleAccountRequired]: 'text_1793952050623fbn10vodflm',
  [LagoApiError.InvalidGoogleState]: GOOGLE_SIGN_UP_INCOMPLETE_ERROR,
  [LagoApiError.InvalidGoogleCode]: GOOGLE_SIGN_UP_INCOMPLETE_ERROR,
  [LagoApiError.InvalidGoogleToken]: GOOGLE_SIGN_UP_INCOMPLETE_ERROR,
}

const getGoogleSignUpError = (): string | undefined => {
  const code = new URLSearchParams(window.location.search).get('lago_error_code')

  if (!code) return undefined

  return BANNER_ERRORS[code] || SIGN_UP_GENERIC_ERROR
}

const getDetailError = (
  details: unknown,
  field: string,
  messages: Record<string, string>,
): string | undefined => {
  if (typeof details !== 'object' || details === null) return undefined

  const codes = Object.entries(details).find(([key]) => key === field)?.[1]

  if (!Array.isArray(codes)) return undefined

  return codes.map((code) => (typeof code === 'string' ? messages[code] : undefined)).find(Boolean)
}

const toOrigin = (url: string): string | undefined => {
  try {
    const { protocol, origin } = new URL(url)

    return protocol === 'http:' || protocol === 'https:' ? origin : undefined
  } catch {
    return undefined
  }
}

const SelfServeSignUp = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { usFrontUrl, euFrontUrl, recaptchaSiteKey } = envGlobalVar()
  const [sentToEmail, setSentToEmail] = useState<string>()
  const [bannerError, setBannerError] = useState<string | undefined>(getGoogleSignUpError)
  const [emailCheckError, setEmailCheckError] = useState<string>()

  const [sentSignupSecret, setSentSignupSecret] = useState('')
  const [signUp] = useSelfServeSignUpMutation({ context: { silentError: true } })
  const [checkSignupEmail] = useSignupEmailCheckLazyQuery({
    fetchPolicy: 'no-cache',
    context: { silentError: true },
  })

  const form = useAppForm({
    defaultValues: selfServeSignUpDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: selfServeSignUpValidationSchema },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(SELF_SERVE_SIGNUP_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      setBannerError(undefined)

      const send = async (): Promise<FetchResult<SelfServeSignUpMutation>> =>
        signUp({
          variables: {
            input: {
              email: value.email.trim(),
              password: value.password,
              captchaToken: await getRecaptchaToken('signup'),
            },
          },
        })

      try {
        let result = await send()

        if (result.errors?.[0]?.extensions?.code === LagoApiError.LockAcquisitionFailed) {
          result = await send()
        }

        const signupSecret = result.data?.signUp?.signupSecret

        if (signupSecret) {
          setItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY, signupSecret)
          setSentSignupSecret(signupSecret)
          setSentToEmail(value.email.trim())

          return
        }

        const extensions = result.errors?.[0]?.extensions
        const code = extensions?.code
        const emailError = getDetailError(extensions?.details, 'email', EMAIL_ERRORS)
        const passwordError = getDetailError(extensions?.details, 'password', PASSWORD_ERRORS)

        if (code === LagoApiError.UnprocessableEntity && (emailError || passwordError)) {
          formApi.setErrorMap({
            onDynamic: {
              fields: {
                ...(emailError && { email: { message: emailError, path: ['email'] } }),
                ...(passwordError && { password: { message: passwordError, path: ['password'] } }),
              },
            },
          })

          return
        }

        setBannerError((typeof code === 'string' && BANNER_ERRORS[code]) || SIGN_UP_GENERIC_ERROR)
      } catch {
        setBannerError(SIGN_UP_GENERIC_ERROR)
      }
    },
  })

  useEffect(() => {
    loadRecaptcha()
  }, [])

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('lago_error_code')) return

    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  const password = useStore(form.store, (state) => state.values.password)
  const hasPasswordRuleError = useStore(form.store, (state) =>
    (state.fieldMeta.password?.errors ?? []).some((error) =>
      PASSWORD_VALIDATION_KEYS.some((ruleKey) => ruleKey === error?.message),
    ),
  )
  const passwordRuleErrors = getSelfServePasswordErrors(password)

  const onEmailBlur = async ({ value }: { value: string }): Promise<void> => {
    const parsedEmail = selfServeSignUpEmailSchema.safeParse(value)

    if (!parsedEmail.success) {
      setEmailCheckError(parsedEmail.error.issues[0]?.message)

      return
    }

    const { data } = await checkSignupEmail({ variables: { email: parsedEmail.data } })

    if (form.state.values.email.trim() !== parsedEmail.data) return

    setEmailCheckError(EMAIL_ERRORS[data?.signupEmailCheck.code ?? ''])
  }

  const usOrigin = toOrigin(usFrontUrl)
  const euOrigin = toOrigin(euFrontUrl)
  const currentRegion = euOrigin === window.location.origin ? 'eu' : 'us'

  const onRegionChange = (region: string): void => {
    if (region === currentRegion) return

    window.location.assign(`${region === 'eu' ? euOrigin : usOrigin}${SIGN_UP_ROUTE}`)
  }

  const onGoBack = useCallback((): void => setSentToEmail(undefined), [])

  const onStartAgain = useCallback((): void => {
    removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
    setSentToEmail(undefined)
  }, [])

  if (sentToEmail) {
    return (
      <Page>
        <Card>
          <StyledLogo height={24} />
          <SelfServeCheckEmail
            email={sentToEmail}
            signupSecret={sentSignupSecret}
            onGoBack={onGoBack}
            onStartAgain={onStartAgain}
          />
        </Card>
      </Page>
    )
  }

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <form
          id={SELF_SERVE_SIGNUP_FORM_ID}
          className="flex flex-col gap-8"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <Title>{translate('text_17938957879289meoplynt8w')}</Title>
            <Typography html={translate('text_1793895787929sip26kglyfp')} />
          </div>

          {!!bannerError && (
            <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
              {translate(bannerError)}
            </Alert>
          )}

          {!!usOrigin && !!euOrigin && (
            <ComboBox
              name="dataRegion"
              label={translate('text_1793895787929v97fwznv57v')}
              helperText={translate('text_1793895787929wmv3w9xecm9')}
              data={[
                { value: 'us', label: translate('text_1793895787929iv5tx54sh92') },
                { value: 'eu', label: translate('text_1793895787929a6fnl607ebf') },
              ]}
              value={currentRegion}
              onChange={onRegionChange}
              disableClearable
              data-test={SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID}
            />
          )}

          <GoogleAuthButton
            mode="signup"
            label={translate('text_1793952050623ct9rwfn5e61')}
            hideAlert
          />

          <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
            <Typography variant="captionHl" color="grey500">
              {translate('text_6303351deffd2a0d70498675').toUpperCase()}
            </Typography>
          </div>

          <div className="flex flex-col gap-4">
            <form.AppField
              name="email"
              listeners={{ onBlur: onEmailBlur, onChange: () => setEmailCheckError(undefined) }}
            >
              {(field) => (
                <field.TextInputField
                  label={translate('text_6419c64eace749372fc72b27')}
                  placeholder={translate('text_62a99ba2af7535cefacab4bf')}
                  beforeChangeFormatter={['lowercase']}
                  errorOverride={emailCheckError ? translate(emailCheckError) : undefined}
                  data-test={SELF_SERVE_SIGNUP_EMAIL_FIELD_TEST_ID}
                />
              )}
            </form.AppField>

            <div>
              <form.AppField name="password">
                {(field) => (
                  <field.TextInputField
                    password
                    label={translate('text_620bc4d4269a55014d493f32')}
                    placeholder={translate('text_620bc4d4269a55014d493f5b')}
                    showOnlyErrors={[
                      PASSWORD_VALIDATION_ERRORS.REQUIRED,
                      SELF_SERVE_PASSWORD_TOO_LONG_ERROR,
                    ]}
                    errorOverride={
                      hasPasswordRuleError && !isSelfServePasswordTooLong(password)
                        ? true
                        : undefined
                    }
                    data-test={SELF_SERVE_SIGNUP_PASSWORD_FIELD_TEST_ID}
                  />
                )}
              </form.AppField>
              <PasswordValidationHints
                variant="checklist"
                password={password}
                errors={passwordRuleErrors}
              />
            </div>
          </div>

          <form.AppForm>
            <form.SubmitButton
              dataTest={SELF_SERVE_SIGNUP_SUBMIT_BUTTON_TEST_ID}
              size="large"
              fullWidth
            >
              {translate('text_620bc4d4269a55014d493fb5')}
            </form.SubmitButton>
          </form.AppForm>

          {!!recaptchaSiteKey && (
            <Typography
              className="text-center"
              variant="caption"
              color="grey600"
              html={translate('text_179390753309316odlsgqxbw')}
            />
          )}

          <Typography
            className="text-center"
            variant="caption"
            html={translate('text_1793895787929z6qmg4nhys2', { link: LOGIN_ROUTE })}
          />
        </form>
      </Card>
    </Page>
  )
}

export default SelfServeSignUp
