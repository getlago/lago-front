import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { GoogleAuthModeEnum } from '~/components/auth/GoogleAuthButton'
import { Icon } from '~/components/designSystem'
import { LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import {
  CurrentUserFragmentDoc,
  LagoApiError,
  useGoogleLoginUserMutation,
} from '~/generated/graphql'

gql`
  mutation googleLoginUser($input: GoogleLoginUserInput!) {
    googleLoginUser(input: $input) {
      user {
        id
        ...CurrentUser
      }
      token
    }
  }

  ${CurrentUserFragmentDoc}
`

const GoogleAuthCallback = () => {
  const navigate = useNavigate()
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
          navigate({
            pathname: LOGIN_ROUTE,
            search: `?lago_error_code=${
              (res.errors[0].extensions as LagoGQLError['extensions'])?.details.base[0]
            }`,
          })
        } else if (!!res.data?.googleLoginUser) {
          onLogIn(res.data?.googleLoginUser?.token, res.data?.googleLoginUser?.user)
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
    <Loader>
      <Icon name="processing" color="info" size="large" animation="spin" />
    </Loader>
  )
}

export default GoogleAuthCallback

const Loader = styled.div`
  height: 160px;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`
