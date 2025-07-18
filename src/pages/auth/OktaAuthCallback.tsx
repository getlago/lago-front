import { gql, useApolloClient } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { hasDefinedGQLError, LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_OKTA, LOGIN_ROUTE } from '~/core/router'
import { LagoApiError, useOktaLoginUserMutation } from '~/generated/graphql'

gql`
  mutation oktaLoginUser($input: OktaLoginInput!) {
    oktaLogin(input: $input) {
      token
    }
  }
`

const OktaAuthCallback = () => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const [oktaLoginUser] = useOktaLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const state = JSON.parse(searchParams.get('state') || '{}')

  const oktaState = state.state || ''
  const invitationToken = state.invitationToken || undefined

  if (!code) {
    navigate(LOGIN_ROUTE)
  }

  useEffect(() => {
    const oktaCallback = async () => {
      if (invitationToken) {
        navigate({
          pathname: generatePath(INVITATION_ROUTE_FORM, {
            token: invitationToken as string,
          }),
          search: `?oktaCode=${code}&oktaState=${oktaState}`,
        })
      } else {
        const res = await oktaLoginUser({ variables: { input: { code, state: oktaState } } })

        if (res.errors) {
          if (hasDefinedGQLError('OktaUserinfoError', res.errors)) {
            navigate({
              pathname: LOGIN_OKTA,
              search: `?lago_error_code=${LagoApiError.OktaUserinfoError}`,
            })
          } else if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
            navigate({
              pathname: LOGIN_ROUTE,
              search: `?lago_error_code=${LagoApiError.OktaLoginMethodNotAuthorized}`,
            })
          } else {
            navigate({
              pathname: LOGIN_ROUTE,
              search: `?lago_error_code=${
                (res.errors[0].extensions as LagoGQLError['extensions']).code
              }`,
            })
          }
        } else if (!!res.data?.oktaLogin) {
          await onLogIn(client, res.data?.oktaLogin?.token)
        }
      }
    }

    oktaCallback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default OktaAuthCallback
