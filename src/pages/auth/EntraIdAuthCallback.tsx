import { gql, useApolloClient, useMutation } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import {
  getItemFromLS,
  hasDefinedGQLError,
  LagoGQLError,
  onLogIn,
  removeItemFromLS,
} from '~/core/apolloClient'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/constants/localStorageKeys'
import { INVITATION_ROUTE_FORM, LOGIN_ENTRA_ID, LOGIN_ROUTE } from '~/core/router'
import { LagoApiError } from '~/generated/graphql'

const ENTRA_ID_USERINFO_ERROR = 'entra_id_userinfo_error'
const ENTRA_ID_LOGIN_METHOD_NOT_AUTHORIZED = 'entra_id_login_method_not_authorized'

const EntraIdAuthCallback = () => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const [entraIdLoginUser] = useMutation<{
    entraIdLogin?: { token?: string }
  }>(gql`
    mutation entraIdLoginUser($input: EntraIdLoginInput!) {
      entraIdLogin(input: $input) {
        token
      }
    }
  `, {
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const state = JSON.parse(searchParams.get('state') || '{}')

  const entraIdState = state.state || ''
  const invitationToken = state.invitationToken || undefined

  if (!code) {
    navigate(LOGIN_ROUTE)
  }

  useEffect(() => {
    const callback = async () => {
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
            pathname: LOGIN_ENTRA_ID,
            search: `?lago_error_code=${ENTRA_ID_USERINFO_ERROR}`,
          })
        }

        if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
          return navigate({
            pathname: LOGIN_ROUTE,
            search: `?lago_error_code=${ENTRA_ID_LOGIN_METHOD_NOT_AUTHORIZED}`,
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

      // Read redirect path from localStorage (set by LoginEntraId before Entra ID redirect)
      const redirectPath = getItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

      await onLogIn(client, res.data?.entraIdLogin?.token)

      removeItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

      if (redirectPath) {
        navigate({ pathname: redirectPath })
      }
    }

    callback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default EntraIdAuthCallback
