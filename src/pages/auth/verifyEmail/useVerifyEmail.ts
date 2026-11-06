import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { useEffect, useState } from 'react'

import { getGraphQLErrorCode, hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { authTokenVar } from '~/core/apolloClient/reactiveVars'
import { getItemFromLS, removeItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import {
  ConfirmSignupEmailMutation,
  LagoApiError,
  useConfirmSignupEmailMutation,
  useResendSignupEmailFromLinkMutation,
  useSignupVerificationQuery,
} from '~/generated/graphql'
import { getRetryAfterSeconds } from '~/pages/auth/common/getRetryAfterSeconds'

import { BANNER_ERRORS, ERROR_STATES, GENERIC_ERROR, STATUS_STATES } from './constants'
import { LinkState, ResendNotice } from './types'

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

const getStoredSignupSecret = (): string => {
  const signupSecret = getItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

  return typeof signupSecret === 'string' ? signupSecret : ''
}

type UseVerifyEmailReturn = {
  linkState: LinkState | undefined
  email: string | undefined
  hasSignupSecret: boolean
  isPasswordRequired: boolean
  isChecking: boolean
  checkError: string | undefined
  retryCheck: () => void
  isVerifying: boolean
  bannerError: string | undefined
  passwordError: string | undefined
  clearPasswordError: () => void
  resendNotice: ResendNotice | undefined
  isResending: boolean
  confirm: (password: string) => Promise<void>
  sendNewLink: () => Promise<void>
}

export const useVerifyEmail = (): UseVerifyEmailReturn => {
  const client = useApolloClient()
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

  const getCheckError = (): string | undefined => {
    if (!error) return undefined

    return BANNER_ERRORS[getGraphQLErrorCode(error.graphQLErrors[0]?.extensions)] || GENERIC_ERROR
  }

  const confirm = async (password: string): Promise<void> => {
    setBannerError(undefined)
    setPasswordError(undefined)
    setIsVerifying(true)

    const send = async (): Promise<FetchResult<ConfirmSignupEmailMutation>> =>
      confirmSignupEmail({
        variables: {
          input: isPasswordRequired
            ? { token, password, captchaToken: await getRecaptchaToken('signup_confirm') }
            : { token, signupSecret },
        },
      })

    try {
      let result = await send()

      // Only the secret path is replayable: the API spends the password path's captcha token before the lock
      if (
        !isPasswordRequired &&
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
  }

  const sendNewLink = async (): Promise<void> => {
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

  return {
    linkState,
    email: verification?.email ?? undefined,
    hasSignupSecret: !!signupSecret,
    isPasswordRequired,
    isChecking: loading,
    checkError: getCheckError(),
    retryCheck: () => {
      refetch().catch(() => undefined)
    },
    isVerifying,
    bannerError,
    passwordError,
    clearPasswordError: () => setPasswordError(undefined),
    resendNotice,
    isResending,
    confirm,
    sendNewLink,
  }
}
