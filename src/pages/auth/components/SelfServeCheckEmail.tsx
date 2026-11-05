import { gql, useApolloClient } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'
import { useEffect, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar, getGraphQLErrorCode, onLogIn } from '~/core/apolloClient'
import { LOGIN_ROUTE, useNavigate } from '~/core/router'
import { getItemFromLS, removeItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import {
  ExchangeSignupSecretDocument,
  ExchangeSignupSecretMutation,
  ExchangeSignupSecretMutationVariables,
  LagoApiError,
  SignupStatusDocument,
  SignupStatusEnum,
  SignupStatusQuery,
  SignupStatusQueryVariables,
  useResendSignupEmailMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID,
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID,
  SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID,
} from '~/pages/auth/signUpTestIds'
import { Title } from '~/styles/auth'

gql`
  query signupStatus($signupSecret: String!) {
    signupStatus(signupSecret: $signupSecret) {
      status
      resendAvailableInSeconds
      resendLimitReached
    }
  }

  mutation exchangeSignupSecret($input: ExchangeSignupSecretInput!) {
    exchangeSignupSecret(input: $input) {
      token
    }
  }

  mutation resendSignupEmail($input: ResendSignupEmailInput!) {
    resendSignupEmail(input: $input) {
      resendAvailableInSeconds
      resendLimitReached
    }
  }
`

const POLL_INTERVAL_MS = 5_000
// lago-api `signup_status_per_ip`: 60 status checks a minute per network, shared by everyone behind it
const RATE_LIMITED_POLL_INTERVAL_MS = 60_000

const RESEND_GENERIC_ERROR = 'text_1793898059309m0mmb7g8tw4'

const RESEND_BANNER_ERRORS: Record<string, string> = {
  [LagoApiError.SelfServeDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.SignupDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.TooManyRequests]: 'text_1793898059309ltbe60gt6pd',
  [LagoApiError.CaptchaFailed]: 'text_1793903925179h1k5w55ih95',
}

type CheckEmailScreen = 'waiting' | 'expired' | 'loginRequired'

const getStoredSignupSecret = (): string => {
  const signupSecret = getItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

  return typeof signupSecret === 'string' ? signupSecret : ''
}

const getRetryAfterSeconds = (errors: readonly GraphQLFormattedError[] | undefined): number => {
  const details = errors?.[0]?.extensions?.details

  if (typeof details !== 'object' || details === null) return 0

  const retryAfterSeconds = Object.entries(details).find(
    ([key]) => key === 'retryAfterSeconds',
  )?.[1]

  return typeof retryAfterSeconds === 'number' ? retryAfterSeconds : 0
}

const formatCountdown = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

type SelfServeCheckEmailProps = {
  email: string
  onGoBack: () => void
  onStartAgain: () => void
}

export const SelfServeCheckEmail = ({
  email,
  onGoBack,
  onStartAgain,
}: SelfServeCheckEmailProps): JSX.Element => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const navigate = useNavigate()
  const { recaptchaSiteKey } = envGlobalVar()
  const [signupSecret] = useState(getStoredSignupSecret)
  const [screen, setScreen] = useState<CheckEmailScreen>('waiting')
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>()
  const [resendLimitReached, setResendLimitReached] = useState(false)
  const [hasResent, setHasResent] = useState(false)
  const [bannerError, setBannerError] = useState<string>()
  const [now, setNow] = useState(() => Date.now())
  const [pollRequest, setPollRequest] = useState(0)

  const [resendSignupEmail, { loading: isResending }] = useResendSignupEmailMutation({
    context: { silentError: true },
  })

  const applyResendState = (seconds: number | null | undefined, limitReached: boolean): void => {
    const currentTime = Date.now()

    setNow(currentTime)
    setResendAvailableAt(typeof seconds === 'number' ? currentTime + seconds * 1000 : null)
    setResendLimitReached(limitReached)
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const schedule = (delay: number): void => {
      if (isActive) timer = setTimeout(() => poll().catch(() => schedule(POLL_INTERVAL_MS)), delay)
    }

    const exchangeSecret = async (): Promise<void> => {
      const { data, errors } = await client.mutate<
        ExchangeSignupSecretMutation,
        ExchangeSignupSecretMutationVariables
      >({
        mutation: ExchangeSignupSecretDocument,
        variables: { input: { signupSecret } },
        context: { silentError: true },
        errorPolicy: 'all',
      })

      if (!isActive) return

      const token = data?.exchangeSignupSecret?.token

      if (token) {
        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
        await onLogIn(client, token)

        return
      }

      const code = getGraphQLErrorCode(errors?.[0]?.extensions)

      if (code === LagoApiError.SignupSecretExpired) {
        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
        setScreen('loginRequired')

        return
      }

      if (code === LagoApiError.NotFound) {
        onStartAgain()

        return
      }

      schedule(
        code === LagoApiError.TooManyRequests ? RATE_LIMITED_POLL_INTERVAL_MS : POLL_INTERVAL_MS,
      )
    }

    const poll = async (): Promise<void> => {
      if (document.visibilityState !== 'visible') return schedule(POLL_INTERVAL_MS)

      const { data, errors } = await client.query<SignupStatusQuery, SignupStatusQueryVariables>({
        query: SignupStatusDocument,
        variables: { signupSecret },
        fetchPolicy: 'no-cache',
        context: { silentError: true },
        errorPolicy: 'all',
      })

      if (!isActive) return

      if (getGraphQLErrorCode(errors?.[0]?.extensions) === LagoApiError.TooManyRequests) {
        return schedule(RATE_LIMITED_POLL_INTERVAL_MS)
      }

      const signupStatus = data?.signupStatus

      if (!signupStatus) return schedule(POLL_INTERVAL_MS)

      switch (signupStatus.status) {
        case SignupStatusEnum.Verified:
          return exchangeSecret()
        case SignupStatusEnum.Expired:
          removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
          return setScreen('expired')
        case SignupStatusEnum.Invalid:
          return onStartAgain()
        default:
          applyResendState(signupStatus.resendAvailableInSeconds, signupStatus.resendLimitReached)

          return schedule(POLL_INTERVAL_MS)
      }
    }

    poll().catch(() => schedule(POLL_INTERVAL_MS))

    return (): void => {
      isActive = false
      clearTimeout(timer)
    }
  }, [client, onStartAgain, pollRequest, signupSecret])

  const secondsUntilResend =
    typeof resendAvailableAt === 'number'
      ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
      : 0
  const isCountingDown = secondsUntilResend > 0

  useEffect(() => {
    if (!isCountingDown) return

    const interval = setInterval(() => setNow(Date.now()), 1000)

    return (): void => clearInterval(interval)
  }, [isCountingDown])

  const onResend = async (): Promise<void> => {
    setBannerError(undefined)
    setHasResent(false)

    const send = async (): ReturnType<typeof resendSignupEmail> =>
      resendSignupEmail({
        variables: {
          input: {
            signupSecret,
            captchaToken: await getRecaptchaToken('signup_resend'),
          },
        },
      })

    try {
      let result = await send()

      if (
        getGraphQLErrorCode(result.errors?.[0]?.extensions) === LagoApiError.LockAcquisitionFailed
      ) {
        result = await send()
      }

      const answer = result.data?.resendSignupEmail

      if (answer) {
        applyResendState(answer.resendAvailableInSeconds, answer.resendLimitReached)
        setHasResent(true)

        return
      }

      const code = getGraphQLErrorCode(result.errors?.[0]?.extensions)

      switch (code) {
        case LagoApiError.ResendTooSoon:
          return applyResendState(getRetryAfterSeconds(result.errors), resendLimitReached)
        case LagoApiError.ResendLimitReached:
          return applyResendState(getRetryAfterSeconds(result.errors), true)
        case LagoApiError.SignupResendExhausted:
        case LagoApiError.SignupExpired:
          return applyResendState(null, resendLimitReached)
        case LagoApiError.EmailAlreadyVerified:
          return setPollRequest((request) => request + 1)
        case LagoApiError.NotFound:
        case LagoApiError.UnprocessableEntity:
          return onStartAgain()
        default:
          return setBannerError(RESEND_BANNER_ERRORS[code] || RESEND_GENERIC_ERROR)
      }
    } catch {
      setBannerError(RESEND_GENERIC_ERROR)
    }
  }

  const renderStartAgain = (): JSX.Element => (
    <Button
      variant="secondary"
      size="large"
      fullWidth
      data-test={SELF_SERVE_SIGNUP_START_AGAIN_BUTTON_TEST_ID}
      onClick={onStartAgain}
    >
      {translate('text_1793906497618wfro49qmvpa')}
    </Button>
  )

  const renderResend = (): JSX.Element => {
    if (resendAvailableAt === null) return renderStartAgain()

    return (
      <Button
        variant={isCountingDown || resendLimitReached ? 'secondary' : 'primary'}
        size="large"
        fullWidth
        disabled={resendAvailableAt === undefined || isCountingDown || resendLimitReached}
        loading={isResending}
        data-test={SELF_SERVE_SIGNUP_RESEND_BUTTON_TEST_ID}
        onClick={onResend}
      >
        {isCountingDown
          ? translate('text_1793906497618kzry1vugrrb', {
              time: formatCountdown(secondsUntilResend),
            })
          : translate('text_1793906497618vxgtkot7zga')}
      </Button>
    )
  }

  if (screen === 'expired') {
    return (
      <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
        <Title>{translate('text_1793906497618doa3hbp1lmh')}</Title>
        {renderStartAgain()}
      </div>
    )
  }

  if (screen === 'loginRequired') {
    return (
      <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
        <Alert type="info">{translate('text_1793906497619x73aav0eroa')}</Alert>
        <Button
          size="large"
          fullWidth
          data-test={SELF_SERVE_SIGNUP_LOGIN_BUTTON_TEST_ID}
          onClick={() => navigate(LOGIN_ROUTE)}
        >
          {translate('text_1793906497619qiquyn7ou5j')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8" data-test={SELF_SERVE_SIGNUP_CHECK_EMAIL_TEST_ID}>
      <div className="flex flex-col gap-3">
        <Title>{translate('text_1793898059309bceac2ri5mc')}</Title>
        <Typography html={translate('text_1793898059309lqujtjacaho', { email })} />
        <Typography variant="caption">{translate('text_1793898059309bhkfbbq9q2z')}</Typography>
      </div>

      {hasResent && (
        <Alert type="success" data-test={SELF_SERVE_SIGNUP_RESEND_SUCCESS_ALERT_TEST_ID}>
          <Typography
            color="inherit"
            html={translate('text_1793906497618bqrpqwr8a94', { email })}
          />
        </Alert>
      )}

      {resendLimitReached && (
        <Alert type="warning" data-test={SELF_SERVE_SIGNUP_RESEND_LIMIT_ALERT_TEST_ID}>
          {translate('text_17939064976188g9cn8x2cj4')}
        </Alert>
      )}

      {!!bannerError && (
        <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
          {translate(bannerError)}
        </Alert>
      )}

      {renderResend()}

      {!!recaptchaSiteKey && resendAvailableAt !== null && (
        <Typography
          className="text-center"
          variant="caption"
          color="grey600"
          html={translate('text_179390753309316odlsgqxbw')}
        />
      )}

      <div className="flex items-center justify-center gap-1">
        <Typography variant="caption">{translate('text_17938980593099x6m52ys6t2')}</Typography>
        <Button
          variant="inline"
          size="small"
          data-test={SELF_SERVE_SIGNUP_GO_BACK_BUTTON_TEST_ID}
          onClick={onGoBack}
        >
          {translate('text_1793898059309vz0niu6emp8')}
        </Button>
      </div>
    </div>
  )
}
