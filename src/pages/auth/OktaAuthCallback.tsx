import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { Icon } from '~/components/designSystem'
import { hasDefinedGQLError, LagoGQLError, onLogIn } from '~/core/apolloClient'
import { INVITATION_ROUTE_FORM, LOGIN_OKTA, LOGIN_ROUTE } from '~/core/router'
import { CurrentUserFragmentDoc, LagoApiError, useOktaLoginUserMutation } from '~/generated/graphql'

gql`
  mutation oktaLoginUser($input: OktaLoginInput!) {
    oktaLogin(input: $input) {
      user {
        id
        ...CurrentUser
      }
      token
    }
  }

  ${CurrentUserFragmentDoc}
`

const OktaAuthCallback = () => {
  const navigate = useNavigate()
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
          } else {
            navigate({
              pathname: LOGIN_ROUTE,
              search: `?lago_error_code=${
                (res.errors[0].extensions as LagoGQLError['extensions']).code
              }`,
            })
          }
        } else if (!!res.data?.oktaLogin) {
          onLogIn(res.data?.oktaLogin?.token, res.data?.oktaLogin?.user)
        }
      }
    }

    oktaCallback()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Loader>
      <Icon name="processing" color="info" size="large" animation="spin" />
    </Loader>
  )
}

export default OktaAuthCallback

const Loader = styled.div`
  height: 160px;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`
