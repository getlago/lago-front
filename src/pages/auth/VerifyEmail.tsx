import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar, getGraphQLErrorCode, hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { authTokenVar } from '~/core/apolloClient/reactiveVars'
import { LOGIN_ROUTE, SIGN_UP_ROUTE, useNavigate } from '~/core/router'
import { getItemFromLS, removeItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'
import {
  ConfirmSignupEmailMutation,
  LagoApiError,
  SignupVerificationStatusEnum,
  useConfirmSignupEmailMutation,
  useResendSignupEmailFromLinkMutation,
  useSignupVerificationQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import {
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID,
} from './signUpTestIds'

gql`
  query signupVerification($token: String!, $signupSecret: String) {
    signupVerification(token: $token, signupSecret: $signupSecret) {
      status
      email
      passwordRequired
    }
  }

  mutation confirmSignupEmail($input: ConfirmSignupEmailInput!) {
    confirmSignupEmail(input: $input) {
      token
    }
  }

  mutation resendSignupEmailFromLink($input: ResendSignupEmailInput!) {
    resendSignupEmail(input: $input) {
      resendAvailableInSeconds
    }
  }
`

type LinkState =
  'valid' | 'expired' | 'replaced' | 'locked' | 'alreadyVerified' | 'invalid' | 'signupExpired'

type ResendNotice =
  { type: 'sent' } | { type: 'tooSoon'; seconds: number } | { type: 'limitReached' }

const GENERIC_ERROR = 'text_1793898059309m0mmb7g8tw4'

const BANNER_ERRORS: Record<string, string> = {
  [LagoApiError.SelfServeDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.SignupDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.TooManyRequests]: 'text_1793898059309ltbe60gt6pd',
  [LagoApiError.CaptchaFailed]: 'text_1793903925179h1k5w55ih95',
}

const STATUS_STATES: Record<SignupVerificationStatusEnum, LinkState> = {
  [SignupVerificationStatusEnum.Valid]: 'valid',
  [SignupVerificationStatusEnum.Expired]: 'expired',
  [SignupVerificationStatusEnum.Replaced]: 'replaced',
  [SignupVerificationStatusEnum.Locked]: 'locked',
  [SignupVerificationStatusEnum.AlreadyVerified]: 'alreadyVerified',
  [SignupVerificationStatusEnum.Invalid]: 'invalid',
}

const ERROR_STATES: Partial<Record<string, LinkState>> = {
  [LagoApiError.SignupTokenExpired]: 'expired',
  [LagoApiError.SignupTokenReplaced]: 'replaced',
  [LagoApiError.SignupTokenLocked]: 'locked',
  [LagoApiError.EmailAlreadyVerified]: 'alreadyVerified',
  [LagoApiError.NotFound]: 'invalid',
}

const STATE_COPY: Record<Exclude<LinkState, 'valid'>, { title: string; text?: string }> = {
  expired: { title: 'text_17939098854938mhkhcmdqx6', text: 'text_1793909885493brc9lgngttd' },
  replaced: { title: 'text_1793909885493qtdzedxgk6p', text: 'text_1793909885493k55xbrj851s' },
  locked: { title: 'text_1793909885493yg0ux3qj2bt' },
  alreadyVerified: {
    title: 'text_17939098854938x57tjzp3qz',
    text: 'text_1793909885493y1x2g94qrvg',
  },
  invalid: { title: 'text_1793909885493kffsxynepp2', text: 'text_17939098854935wfebtg04x2' },
  signupExpired: { title: 'text_1793906497618doa3hbp1lmh' },
}

const passwordSchema = z.object({
  password: z.string().min(1, { message: PASSWORD_VALIDATION_ERRORS.REQUIRED }),
})

const secretSchema = z.object({ password: z.string() })

const getRetryAfterSeconds = (errors: readonly GraphQLFormattedError[] | undefined): number => {
  const details = errors?.[0]?.extensions?.details

  if (typeof details !== 'object' || details === null) return 0

  const seconds = Object.entries(details).find(([key]) => key === 'retryAfterSeconds')?.[1]

  return typeof seconds === 'number' ? seconds : 0
}

const getStoredSignupSecret = (): string => {
  const signupSecret = getItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

  return typeof signupSecret === 'string' ? signupSecret : ''
}

const VerifyEmail = (): JSX.Element => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const navigate = useNavigate()
  const { recaptchaSiteKey } = envGlobalVar()
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '')
  const [signupSecret] = useState(getStoredSignupSecret)
  const [stateOverride, setStateOverride] = useState<LinkState>()
  const [passwordRequired, setPasswordRequired] = useState<boolean>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [bannerError, setBannerError] = useState<string>()
  const [resendNotice, setResendNotice] = useState<ResendNotice>()
  const [passwordError, setPasswordError] = useState<string>()

  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)

    const referrerMeta = document.createElement('meta')

    referrerMeta.name = 'referrer'
    referrerMeta.content = 'no-referrer'
    document.head.appendChild(referrerMeta)

    return (): void => referrerMeta.remove()
  }, [])

  const { data, loading, error, refetch } = useSignupVerificationQuery({
    variables: { token, signupSecret: signupSecret || null },
    skip: !token,
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
    context: { silentError: true },
  })

  const [confirmSignupEmail] = useConfirmSignupEmailMutation({ context: { silentError: true } })
  const [resendSignupEmail, { loading: isResending }] = useResendSignupEmailFromLinkMutation({
    context: { silentError: true },
  })

  const verification = data?.signupVerification
  const isPasswordRequired = passwordRequired ?? !!verification?.passwordRequired

  const getLinkState = (): LinkState | undefined => {
    if (stateOverride) return stateOverride
    if (!token) return 'invalid'
    if (!verification) return undefined

    return STATUS_STATES[verification.status]
  }

  const linkState = getLinkState()

  const form = useAppForm({
    defaultValues: { password: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: isPasswordRequired ? passwordSchema : secretSchema },
    onSubmit: async ({ value }) => {
      setBannerError(undefined)
      setPasswordError(undefined)
      setIsVerifying(true)

      const send = async (): Promise<FetchResult<ConfirmSignupEmailMutation>> =>
        confirmSignupEmail({
          variables: {
            input: isPasswordRequired
              ? {
                  token,
                  password: value.password,
                  captchaToken: await getRecaptchaToken('signup_confirm'),
                }
              : { token, signupSecret },
          },
        })

      try {
        let result = await send()

        if (
          getGraphQLErrorCode(result.errors?.[0]?.extensions) === LagoApiError.LockAcquisitionFailed
        ) {
          result = await send()
        }

        const sessionToken = result.data?.confirmSignupEmail?.token

        if (sessionToken) {
          removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
          await onLogIn(client, sessionToken)

          if (!authTokenVar()) setStateOverride('alreadyVerified')

          return
        }

        const code = getGraphQLErrorCode(result.errors?.[0]?.extensions)

        if (hasDefinedGQLError('PasswordRequired', result.errors, 'password')) {
          setPasswordRequired(true)

          return
        }

        if (hasDefinedGQLError('IncorrectPassword', result.errors, 'password')) {
          setPasswordError('text_1793909885494oc59fm4ikcf')

          return
        }

        const errorState = ERROR_STATES[code]

        if (errorState) return setStateOverride(errorState)

        setBannerError(BANNER_ERRORS[code] || GENERIC_ERROR)
      } catch {
        setBannerError(GENERIC_ERROR)
      } finally {
        setIsVerifying(false)
      }
    },
  })

  const onSendNewLink = async (): Promise<void> => {
    const isSentWithSecret = linkState === 'invalid'

    setBannerError(undefined)
    setResendNotice(undefined)

    try {
      const result = await resendSignupEmail({
        variables: {
          input: {
            ...(isSentWithSecret ? { signupSecret } : { token }),
            captchaToken: await getRecaptchaToken('signup_resend'),
          },
        },
      })

      if (result.data?.resendSignupEmail) return setResendNotice({ type: 'sent' })

      const code = getGraphQLErrorCode(result.errors?.[0]?.extensions)

      switch (code) {
        case LagoApiError.ResendTooSoon:
          return setResendNotice({ type: 'tooSoon', seconds: getRetryAfterSeconds(result.errors) })
        case LagoApiError.ResendLimitReached:
          return setResendNotice({ type: 'limitReached' })
        case LagoApiError.SignupResendExhausted:
          return setStateOverride('signupExpired')
        case LagoApiError.SignupExpired:
          if (isSentWithSecret) removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

          return setStateOverride('signupExpired')
        case LagoApiError.EmailAlreadyVerified:
          return setStateOverride('alreadyVerified')
        case LagoApiError.NotFound:
          if (!isSentWithSecret) return setStateOverride('invalid')

          removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

          return setStateOverride('signupExpired')
        default:
          return setBannerError(BANNER_ERRORS[code] || GENERIC_ERROR)
      }
    } catch {
      setBannerError(GENERIC_ERROR)
    }
  }

  const renderRecaptchaNotice = (): JSX.Element | null => {
    if (!recaptchaSiteKey) return null

    return (
      <Typography
        className="text-center"
        variant="caption"
        color="grey600"
        html={translate('text_179390753309316odlsgqxbw')}
      />
    )
  }

  const renderResendNotice = (): JSX.Element | null => {
    if (!resendNotice) return null

    if (resendNotice.type === 'sent') {
      return (
        <Alert type="success" data-test={SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID}>
          {translate('text_1793909885494hs0en0o3hna')}
        </Alert>
      )
    }

    return (
      <Alert type="warning" data-test={SELF_SERVE_VERIFY_EMAIL_RESEND_ALERT_TEST_ID}>
        {resendNotice.type === 'tooSoon'
          ? translate('text_17939098854944rljlem8e3i', { seconds: resendNotice.seconds })
          : translate('text_17939064976188g9cn8x2cj4')}
      </Alert>
    )
  }

  const renderSendNewLink = (): JSX.Element => (
    <>
      <Button
        size="large"
        fullWidth
        loading={isResending}
        data-test={SELF_SERVE_VERIFY_EMAIL_SEND_NEW_LINK_BUTTON_TEST_ID}
        onClick={onSendNewLink}
      >
        {translate('text_17939098854936d3uhapsh4f')}
      </Button>
      {renderRecaptchaNotice()}
    </>
  )

  const renderBackToSignUp = (): JSX.Element => (
    <Button
      variant="secondary"
      size="large"
      fullWidth
      data-test={SELF_SERVE_VERIFY_EMAIL_BACK_TO_SIGN_UP_BUTTON_TEST_ID}
      onClick={() => navigate(SIGN_UP_ROUTE)}
    >
      {translate('text_179390988549342e7k8whdcq')}
    </Button>
  )

  const renderActions = (state: Exclude<LinkState, 'valid'>): JSX.Element => {
    switch (state) {
      case 'alreadyVerified':
        return (
          <Button
            size="large"
            fullWidth
            data-test={SELF_SERVE_VERIFY_EMAIL_CONTINUE_BUTTON_TEST_ID}
            onClick={() => navigate(LOGIN_ROUTE)}
          >
            {translate('text_1793909885493vtps6yqk0dr')}
          </Button>
        )
      case 'invalid':
        return (
          <>
            {!!signupSecret && renderSendNewLink()}
            {renderBackToSignUp()}
          </>
        )
      case 'signupExpired':
        return renderBackToSignUp()
      default:
        return renderSendNewLink()
    }
  }

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  const renderCheckFailed = (): JSX.Element => (
    <div className="flex flex-col gap-8">
      <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
        {translate(
          BANNER_ERRORS[getGraphQLErrorCode(error?.graphQLErrors[0]?.extensions)] || GENERIC_ERROR,
        )}
      </Alert>
      <Button
        size="large"
        fullWidth
        data-test={SELF_SERVE_VERIFY_EMAIL_RETRY_BUTTON_TEST_ID}
        onClick={() => refetch().catch(() => undefined)}
      >
        {translate('text_63e27c56dfe64b846474efa3')}
      </Button>
    </div>
  )

  const renderContent = (): JSX.Element => {
    if (loading) return <Spinner />
    if (!linkState && error) return renderCheckFailed()
    if (!linkState) return <Spinner />

    if (isVerifying) {
      return (
        <div className="flex flex-col gap-3">
          <Title>{translate('text_1793909885493mi63u2s2ync')}</Title>
          <Typography>{translate('text_17939098854934yp8t80140w')}</Typography>
        </div>
      )
    }

    if (linkState === 'valid') {
      return (
        <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3">
            <Title>{translate('text_1793909885493jz6i6ilc960')}</Title>
            <Typography
              html={translate('text_1793909885493052npdnakq9', { email: verification?.email })}
            />
          </div>

          {!!bannerError && (
            <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
              {translate(bannerError)}
            </Alert>
          )}

          {isPasswordRequired && (
            <form.AppField
              name="password"
              listeners={{ onChange: () => setPasswordError(undefined) }}
            >
              {(field) => (
                <field.TextInputField
                  password
                  label={translate('text_620bc4d4269a55014d493f32')}
                  placeholder={translate('text_620bc4d4269a55014d493f5b')}
                  helperText={translate('text_1793909885494lhzg2ru6vty')}
                  errorOverride={passwordError ? translate(passwordError) : undefined}
                  data-test={SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID}
                />
              )}
            </form.AppField>
          )}

          <div className="flex flex-col gap-4">
            <form.AppForm>
              <form.SubmitButton
                dataTest={SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID}
                size="large"
                fullWidth
              >
                {translate('text_1793909885493zizmilfx6tn')}
              </form.SubmitButton>
            </form.AppForm>
            {isPasswordRequired && renderRecaptchaNotice()}
          </div>
        </form>
      )
    }

    const copy = STATE_COPY[linkState]

    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Title>{translate(copy.title)}</Title>
          {!!copy.text && <Typography>{translate(copy.text)}</Typography>}
        </div>

        {renderResendNotice()}

        {!!bannerError && (
          <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
            {translate(bannerError)}
          </Alert>
        )}

        <div className="flex flex-col gap-4">{renderActions(linkState)}</div>
      </div>
    )
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        {renderContent()}
      </Card>
    </Page>
  )
}

export default VerifyEmail
