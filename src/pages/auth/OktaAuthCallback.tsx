import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'

import { LOGIN_OKTA } from '~/core/router'
import { LagoApiError, useOktaLoginUserMutation } from '~/generated/graphql'

import { useSSOAuthCallback } from './useSSOAuthCallback'

gql`
  mutation oktaLoginUser($input: OktaLoginInput!) {
    oktaLogin(input: $input) {
      token
    }
  }
`

const OktaAuthCallback = () => {
  const [oktaLoginUser] = useOktaLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  useSSOAuthCallback({
    login: (input) => oktaLoginUser({ variables: { input } }),
    getToken: (data) => data?.oktaLogin?.token,
    providerLoginRoute: LOGIN_OKTA,
    userinfoErrorKey: 'OktaUserinfoError',
    userinfoRedirectCode: LagoApiError.OktaUserinfoError,
    notAuthorizedRedirectCode: LagoApiError.OktaLoginMethodNotAuthorized,
    codeParam: 'oktaCode',
    stateParam: 'oktaState',
  })

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default OktaAuthCallback
