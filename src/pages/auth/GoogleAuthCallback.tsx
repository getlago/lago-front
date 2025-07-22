import { gql, useApolloClient } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { GoogleAuthModeEnum } from '~/components/auth/GoogleAuthButton'
import { hasDefinedGQLError, LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { LagoApiError, useGoogleLoginUserMutation } from '~/generated/graphql'

gql`
  mutation googleLoginUser($input: GoogleLoginUserInput!) {
    googleLoginUser(input: $input) {
      token
    }
  }
`

const GoogleAuthCallback = () => {
  const navigate = useNavigate()
  const client = useApolloClient()
  const [googleLoginUser] = useGoogleLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const state = JSON.parse(searchParams.get('state') || '{}')
  const invitationToken = state.invitationToken || ''
  const mode = state.mode as GoogleAuthModeEnum

  if (!code) {
    navigate(LOGIN_ROUTE)
  }

  useEffect(() => {
    const googleCallback = async () => {
      if (mode === 'login') {
        const res = await googleLoginUser({
          variables: {
            input: {
              code,
            },
          },
        })

        if (res.errors) {
          if (hasDefinedGQLError('LoginMethodNotAuthorized', res.errors)) {
            navigate({
              pathname: LOGIN_ROUTE,
              search: `?lago_error_code=${LagoApiError.GoogleLoginMethodNotAuthorized}`,
            })
          } else {
            navigate({
              pathname: LOGIN_ROUTE,
              search: `?lago_error_code=${
                (res.errors[0].extensions as LagoGQLError['extensions'])?.details.base[0]
              }`,
            })
          }
        } else if (!!res.data?.googleLoginUser) {
          await onLogIn(client, res.data?.googleLoginUser?.token)
        }
      } else if (mode === 'signup') {
        navigate({
          pathname: SIGN_UP_ROUTE,
          search: `?code=${code}`,
        })
      } else if (mode === 'invite') {
        navigate({
          pathname: generatePath(INVITATION_ROUTE_FORM, { token: invitationToken as string }),
          search: `?code=${code}`,
        })
      }
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
