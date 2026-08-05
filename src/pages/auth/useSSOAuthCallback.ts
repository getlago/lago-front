import { FetchResult, useApolloClient } from '@apollo/client'
import { useEffect, useRef } from 'react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import -- Auth callback renders outside /:organizationSlug; the slug wrapper would be incorrect here.
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { hasDefinedGQLError, LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_ROUTE } from '~/core/router'
import { LagoApiError } from '~/generated/graphql'

type SSOAuthCallbackParams<TData> = {
  /** Runs the provider login mutation with the authorization code + state. */
  login: (input: { code: string; state: string }) => Promise<FetchResult<TData>>
  /** Extracts the session token from the login mutation payload. */
  getToken: (data: TData | null | undefined) => string | null | undefined
  /** Provider login route, used for the userinfo-error redirect. */
  providerLoginRoute: string
  /** LagoApiError key matched against the GraphQL errors for a userinfo failure. */
  userinfoErrorKey: keyof typeof LagoApiError
  /** LagoApiError value surfaced in the URL on a userinfo failure. */
  userinfoRedirectCode: LagoApiError
  /** LagoApiError value surfaced in the URL when the login method is not authorized. */
  notAuthorizedRedirectCode: LagoApiError
  /** Invitation-form query param names carrying the code/state back to the invite flow. */
  codeParam: string
  stateParam: string
}

const parseState = (raw: string | null): { state?: string; invitationToken?: string } => {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

/**
 * Shared OAuth callback logic for SSO providers (Okta, Entra ID). Each provider
 * callback page calls this with its own login mutation, error codes, login route
 * and invite param names; the StrictMode guard, state parsing and redirect
 * handling live here so a fix only has to be made once.
 */
export const useSSOAuthCallback = <TData>({
  login,
  getToken,
  providerLoginRoute,
  userinfoErrorKey,
  userinfoRedirectCode,
  notAuthorizedRedirectCode,
  codeParam,
  stateParam,
}: SSOAuthCallbackParams<TData>) => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const hasRun = useRef(false)

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''

  // The IdP echoes `state` back as a URL param. Guard the parse: a non-JSON
  // value would otherwise throw during render and blank the page instead of
  // falling through to the login redirect.
  const { state: providerState = '', invitationToken } = parseState(searchParams.get('state'))

  useEffect(() => {
    // Guard against React StrictMode double-execution.
    // The OAuth code can only be consumed once by the backend.
    if (hasRun.current) return
    hasRun.current = true

    if (!code) {
      navigate(LOGIN_ROUTE)
      return
    }

    const runCallback = async () => {
      if (invitationToken) {
        return navigate({
          pathname: generatePath(INVITATION_ROUTE_FORM, { token: invitationToken }),
          search: `?${codeParam}=${encodeURIComponent(code)}&${stateParam}=${encodeURIComponent(
            providerState,
          )}`,
        })
      }

      const res = await login({ code, state: providerState })

      if (res.errors) {
        if (hasDefinedGQLError(userinfoErrorKey, res.errors)) {
          return navigate({
            pathname: providerLoginRoute,
            search: `?lago_error_code=${userinfoRedirectCode}`,
          })
        }

        if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
          return navigate({
            pathname: LOGIN_ROUTE,
            search: `?lago_error_code=${notAuthorizedRedirectCode}`,
          })
        }

        return navigate({
          pathname: LOGIN_ROUTE,
          search: `?lago_error_code=${
            (res.errors[0].extensions as LagoGQLError['extensions']).code
          }`,
        })
      }

      const token = getToken(res.data)

      if (!token) {
        return
      }

      // The redirect path is already stored in localStorage by the provider login
      // page before the redirect. Home.tsx is the SINGLE point of cleanup for
      // REDIRECT_AFTER_LOGIN_LS_KEY — we do NOT remove it here to avoid a race
      // where onLogIn triggers the route-guard redirect to HOME before this
      // callback can navigate.
      await onLogIn(client, token)
    }

    runCallback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
