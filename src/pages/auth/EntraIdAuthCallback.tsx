import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'

import { LOGIN_ENTRA_ID_ROUTE } from '~/core/router'
import { LagoApiError, useEntraIdLoginUserMutation } from '~/generated/graphql'

import { useSSOAuthCallback } from './useSSOAuthCallback'

gql`
  mutation entraIdLoginUser($input: EntraIdLoginInput!) {
    entraIdLogin(input: $input) {
      token
    }
  }
`

const EntraIdAuthCallback = () => {
  const [entraIdLoginUser] = useEntraIdLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  useSSOAuthCallback({
    login: (input) => entraIdLoginUser({ variables: { input } }),
    getToken: (data) => data?.entraIdLogin?.token,
    providerLoginRoute: LOGIN_ENTRA_ID_ROUTE,
    userinfoErrorKey: 'EntraIdUserinfoError',
    userinfoRedirectCode: LagoApiError.EntraIdUserinfoError,
    notAuthorizedRedirectCode: LagoApiError.EntraIdLoginMethodNotAuthorized,
    codeParam: 'entraIdCode',
    stateParam: 'entraIdState',
  })

  return (
    <div className="m-auto flex h-40 w-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default EntraIdAuthCallback
