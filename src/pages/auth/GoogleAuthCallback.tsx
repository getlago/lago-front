import { gql, useApolloClient } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'
import { Icon } from 'lago-design-system'
import { useEffect, useRef } from 'react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import -- Auth callback renders outside /:organizationSlug; the slug wrapper would be incorrect here.
import { generatePath, useNavigate, useSearchParams } from 'react-router'

import { GoogleInviteState, takeGoogleOauthFlow } from '~/components/auth/googleOauthFlow'
import {
  envGlobalVar,
  getGraphQLErrorCode,
  hasDefinedGQLError,
  LagoGQLError,
  onLogIn,
} from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { isSafeInAppPath } from '~/core/router/utils/isSafeInAppPath'
import { setItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'
import { getRecaptchaToken } from '~/core/utils/recaptcha'
import {
  LagoApiError,
  useGoogleLoginUserMutation,
  useGoogleSignUpMutation,
} from '~/generated/graphql'

gql`
  mutation googleLoginUser($input: GoogleLoginUserInput!) {
    googleLoginUser(input: $input) {
      token
    }
  }

  mutation googleSignUp($input: GoogleSignUpInput!) {
    googleSignUp(input: $input) {
      token
    }
  }
`

const getSignUpErrorCode = (errors: readonly GraphQLFormattedError[] | undefined): string => {
  const extensions = errors?.[0]?.extensions
  const details = extensions?.details
  const baseCodes =
    typeof details === 'object' && details !== null && 'base' in details ? details.base : undefined
  const baseCode = Array.isArray(baseCodes) ? baseCodes[0] : undefined

  return typeof baseCode === 'string' ? baseCode : getGraphQLErrorCode(extensions)
}

const GoogleAuthCallback = () => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const hasRun = useRef(false)
  const { selfServeEnabled } = envGlobalVar()
  const [googleLoginUser] = useGoogleLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })
  const [googleSignUp] = useGoogleSignUpMutation({ context: { silentError: true } })

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const googleState = searchParams.get('state') || ''

  const showError = (pathname: string, errorCode: string): void => {
    navigate({ pathname, search: `?lago_error_code=${errorCode}` }, { replace: true })
  }

  const signUpWithGoogle = async (stateSecret: string): Promise<void> => {
    try {
      const res = await googleSignUp({
        variables: {
          input: {
            code,
            state: googleState,
            stateSecret,
            captchaToken: await getRecaptchaToken('signup_google'),
          },
        },
      })

      const token = res.data?.googleSignUp?.token

      if (token) return onLogIn(client, token)

      if (hasDefinedGQLError('UserDoesNotExist', res.errors)) {
        return showError(LOGIN_ROUTE, LagoApiError.UserDoesNotExist)
      }

      if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
        return showError(LOGIN_ROUTE, LagoApiError.GoogleLoginMethodNotAuthorized)
      }

      showError(SIGN_UP_ROUTE, getSignUpErrorCode(res.errors))
    } catch {
      showError(SIGN_UP_ROUTE, LagoApiError.InternalError)
    }
  }

  useEffect(() => {
    // Guard against React StrictMode double-execution.
    // The OAuth code can only be consumed once by the backend.
    if (hasRun.current) return
    hasRun.current = true

    const storedFlow = takeGoogleOauthFlow()

    if (!storedFlow && selfServeEnabled) {
      showError(LOGIN_ROUTE, LagoApiError.InvalidGoogleState)
      return
    }

    const { mode, invitationToken, redirectPath } = storedFlow ?? JSON.parse(googleState || '{}')
    const stateSecret = storedFlow?.stateSecret

    if (!code && mode === 'signup' && stateSecret) {
      showError(SIGN_UP_ROUTE, LagoApiError.InvalidGoogleCode)
      return
    }

    if (!code) {
      navigate(LOGIN_ROUTE)
      return
    }

    const googleCallback = async () => {
      if (mode === 'signup') {
        if (stateSecret) return signUpWithGoogle(stateSecret)

        return navigate({
          pathname: SIGN_UP_ROUTE,
          search: `?code=${code}`,
        })
      }

      if (mode === 'invite') {
        const inviteState: GoogleInviteState | undefined = stateSecret
          ? { googleState, googleStateSecret: stateSecret }
          : undefined

        return navigate(
          {
            pathname: generatePath(INVITATION_ROUTE_FORM, { token: invitationToken || '' }),
            search: `?code=${code}`,
          },
          { state: inviteState },
        )
      }

      if (mode !== 'login') {
        return
      }

      const res = await googleLoginUser({
        variables: {
          input: { code, ...(!!stateSecret && { state: googleState, stateSecret }) },
        },
      })

      if (res.errors) {
        if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
          return navigate({
            pathname: LOGIN_ROUTE,
            search: `?lago_error_code=${LagoApiError.GoogleLoginMethodNotAuthorized}`,
          })
        }

        return navigate({
          pathname: LOGIN_ROUTE,
          search: `?lago_error_code=${
            (res.errors[0].extensions as LagoGQLError['extensions'])?.details.base[0]
          }`,
        })
      }

      if (!res.data?.googleLoginUser) {
        return
      }

      // Store redirect path in localStorage before onLogIn to survive
      // the race condition with the onlyPublic route guard. When onLogIn sets
      // authTokenVar, the guard may redirect to HOME before this callback
      // can navigate — localStorage ensures Home.tsx can still find the path.
      // Home.tsx is the SINGLE point of cleanup for REDIRECT_AFTER_LOGIN_LS_KEY.
      // `redirectPath` can come straight off the URL query, so it is
      // attacker-controlled. Validate before it reaches localStorage.
      if (redirectPath && isSafeInAppPath(redirectPath)) {
        setItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY, redirectPath)
      }

      await onLogIn(client, res.data?.googleLoginUser?.token)
    }

    googleCallback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default GoogleAuthCallback
