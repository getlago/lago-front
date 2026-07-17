import { gql } from '@apollo/client'

import { LagoApiError, useFetchOktaAuthorizeUrlMutation } from '~/generated/graphql'

import { LoginSSO } from './components/LoginSSO'

const getErrorKey = (code: LagoApiError): string => {
  switch (code) {
    case LagoApiError.OktaUserinfoError:
      return 'text_664c98989d08a3f733357f73'
    case LagoApiError.DomainNotConfigured:
      return 'text_664c90c9b2b6c2012aa50bd6'
    default:
      return 'text_62b31e1f6a5b8b1b745ece48'
  }
}

gql`
  mutation fetchOktaAuthorizeUrl($input: OktaAuthorizeInput!) {
    oktaAuthorize(input: $input) {
      url
    }
  }
`

const LoginOkta = () => (
  <LoginSSO
    useAuthorizeMutation={useFetchOktaAuthorizeUrlMutation}
    getAuthorizeUrl={(data) => data?.oktaAuthorize?.url}
    getErrorKey={getErrorKey}
    titleKey="text_664c90c9b2b6c2012aa50bce"
    subtitleKey="text_664c90c9b2b6c2012aa50bd0"
    footerKey="text_664c90c9b2b6c2012aa50bda"
    errorAlertDataTest="login-okta-error-alert"
  />
)

export default LoginOkta
