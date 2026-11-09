import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { useEffect, useState } from 'react'

import { getGraphQLErrorCode, hasDefinedGQLError, logOut, onLogIn } from '~/core/apolloClient'
import { authTokenVar } from '~/core/apolloClient/reactiveVars'
import { HOME_ROUTE, SIGN_UP_ROUTE, useLocation, useNavigate } from '~/core/router'
import { getItemFromLS, removeItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import {
  ConfirmSignupEmailMutation,
  LagoApiError,
  useConfirmSignupEmailMutation,
  useSignupVerificationQuery,
} from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useSendSignupLink } from '~/pages/auth/common/useSendSignupLink'

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
`

const BROWSER_DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin'

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
  isLoggedIn: boolean
  logOutToContinue: () => Promise<void>
  backToSignUp: () => Promise<void>
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
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useIsAuthenticated()
  const { isSending, sendSignupLink } = useSendSignupLink()
  const [token] = useState(() => new URLSearchParams(location.search).get('token') ?? '')
  const [signupSecret] = useState(getStoredSignupSecret)
  const [stateOverride, setStateOverride] = useState<LinkState>()
  const [passwordRequired, setPasswordRequired] = useState<boolean>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [bannerError, setBannerError] = useState<string>()
  const [resendNotice, setResendNotice] = useState<ResendNotice>()
  const [passwordError, setPasswordError] = useState<string>()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)

    if (!searchParams.has('token')) return

    searchParams.delete('token')

    const search = searchParams.toString()

    navigate(
      { search: search ? `?${search}` : '', hash: location.hash },
      { replace: true, state: location.state },
    )
  }, [location, navigate])

  useEffect(() => {
    const existingMeta = document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]')
    const referrerMeta = existingMeta ?? document.createElement('meta')
    const previousPolicy = existingMeta?.content || BROWSER_DEFAULT_REFERRER_POLICY

    referrerMeta.name = 'referrer'
    referrerMeta.content = 'no-referrer'

    if (!existingMeta) document.head.appendChild(referrerMeta)

    return (): void => {
      // Removing the meta keeps its policy: only a new content applies another one
      referrerMeta.content = previousPolicy

      if (!existingMeta) referrerMeta.remove()
    }
  }, [])

  const { data, loading, error, refetch } = useSignupVerificationQuery({
    variables: { token, signupSecret: signupSecret || null },
    skip: !token,
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
    context: { silentError: true },
  })

  const [confirmSignupEmail] = useConfirmSignupEmailMutation({ context: { silentError: true } })

  const verification = data?.signupVerification
  const isPasswordRequired = passwordRequired ?? !!verification?.passwordRequired

  const getLinkState = (): LinkState | undefined => {
    if (stateOverride) return stateOverride
    if (!token) return 'invalid'
    if (loading || error) return undefined

    const statusState: LinkState | undefined = verification && STATUS_STATES[verification.status]

    // A missing answer, or a status added to the API before this build, would spin forever
    return statusState ?? 'invalid'
  }

  const linkState = getLinkState()

  const getCheckError = (): string | undefined => {
    if (!error) return undefined

    return BANNER_ERRORS[getGraphQLErrorCode(error.graphQLErrors[0]?.extensions)] || GENERIC_ERROR
  }

  const logOutToContinue = async (): Promise<void> => {
    setIsLoggingOut(true)

    try {
      await logOut(client, true)
      // Logging out clears the Apollo store without refetching the active queries
      await refetch().catch(() => undefined)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const backToSignUp = async (): Promise<void> => {
    // Sign-up is public-only: with a session, the router would send the browser home instead
    if (isAuthenticated) await logOut(client, true)

    navigate(SIGN_UP_ROUTE)
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

        // This route stays open once logged in, so it leaves on its own
        if (authTokenVar()) return navigate(HOME_ROUTE, { replace: true })

        return setStateOverride('alreadyVerified')
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
    const outcome = await sendSignupLink(isSentWithSecret ? { signupSecret } : { token })

    if (!outcome) return

    setBannerError(undefined)
    setResendNotice(undefined)

    switch (outcome.type) {
      case 'sent':
        return setResendNotice({
          type: 'sent',
          canSendMore: !outcome.resendLimitReached && outcome.resendAvailableInSeconds !== null,
        })
      case 'tooSoon':
        return setResendNotice({ type: 'tooSoon', seconds: outcome.retryAfterSeconds })
      case 'limitReached':
        return setResendNotice({ type: 'limitReached' })
      case 'resendExhausted':
        return setStateOverride('signupExpired')
      case 'signupExpired':
        if (isSentWithSecret) removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

        return setStateOverride('signupExpired')
      case 'alreadyVerified':
        return setStateOverride('alreadyVerified')
      case 'notFound':
        if (!isSentWithSecret) return setStateOverride('invalid')

        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)

        return setStateOverride('signupExpired')
      case 'failed':
        return setBannerError(outcome.bannerError)
    }
  }

  return {
    linkState,
    email: verification?.email ?? undefined,
    hasSignupSecret: !!signupSecret,
    isPasswordRequired,
    isChecking: loading || isLoggingOut,
    checkError: getCheckError(),
    retryCheck: () => {
      refetch().catch(() => undefined)
    },
    isLoggedIn: isAuthenticated,
    logOutToContinue,
    backToSignUp,
    isVerifying,
    bannerError,
    passwordError,
    clearPasswordError: () => setPasswordError(undefined),
    resendNotice,
    isResending: isSending,
    confirm,
    sendNewLink,
  }
}
