import { gql, useApolloClient } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect, useRef } from 'react'
// eslint-disable-next-line lago/no-direct-rrd-nav-import -- Auth callback renders outside /:organizationSlug; the slug wrapper would be incorrect here.
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { hasDefinedGQLError, LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_ENTRA_ID_ROUTE, LOGIN_ROUTE } from '~/core/router'
import { LagoApiError, useEntraIdLoginUserMutation } from '~/generated/graphql'

gql`
  mutation entraIdLoginUser($input: EntraIdLoginInput!) {
    entraIdLogin(input: $input) {
      token
    }
  }
`

const EntraIdAuthCallback = () => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const hasRun = useRef(false)
  const [entraIdLoginUser] = useEntraIdLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const state = JSON.parse(searchParams.get('state') || '{}')

  const entraIdState = state.state || ''
  const invitationToken = state.invitationToken || undefined

  useEffect(() => {
    // Guard against React StrictMode double-execution.
    // The OAuth code can only be consumed once by the backend.
    if (hasRun.current) return
    hasRun.current = true

    if (!code) {
      navigate(LOGIN_ROUTE)
      return
    }

    const entraIdCallback = async () => {
      if (invitationToken) {
        return navigate({
          pathname: generatePath(INVITATION_ROUTE_FORM, {
            token: invitationToken as string,
          }),
          search: `?entraIdCode=${code}&entraIdState=${entraIdState}`,
        })
      }

      const res = await entraIdLoginUser({ variables: { input: { code, state: entraIdState } } })

      if (res.errors) {
        if (hasDefinedGQLError('EntraIdUserinfoError', res.errors)) {
          return navigate({
            pathname: LOGIN_ENTRA_ID_ROUTE,
            search: `?lago_error_code=${LagoApiError.EntraIdUserinfoError}`,
          })
        }

        if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
          return navigate({
            pathname: LOGIN_ROUTE,
            search: `?lago_error_code=${LagoApiError.EntraIdLoginMethodNotAuthorized}`,
          })
        }

        return navigate({
          pathname: LOGIN_ROUTE,
          search: `?lago_error_code=${
            (res.errors[0].extensions as LagoGQLError['extensions']).code
          }`,
        })
      }

      if (!res.data?.entraIdLogin) {
        return
      }

      // The redirect path is already stored in localStorage by LoginEntraId before
      // the Entra ID redirect. Home.tsx is the SINGLE point of cleanup for
      // REDIRECT_AFTER_LOGIN_LS_KEY — we do NOT remove it here to avoid
      // a race condition where onLogIn triggers the route guard redirect
      // to HOME before this callback can navigate.
      await onLogIn(client, res.data?.entraIdLogin?.token)
    }

    entraIdCallback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default EntraIdAuthCallback
