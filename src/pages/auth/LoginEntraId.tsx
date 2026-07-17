import { gql } from '@apollo/client'

import { LagoApiError, useFetchEntraIdAuthorizeUrlMutation } from '~/generated/graphql'

import { LoginSSO } from './components/LoginSSO'

const getErrorKey = (code: LagoApiError): string => {
  switch (code) {
    case LagoApiError.EntraIdUserinfoError:
      return 'text_178430734425582hoo5w7p20'
    case LagoApiError.DomainNotConfigured:
      return 'text_17843073442557vu1j14mu7s'
    default:
      return 'text_62b31e1f6a5b8b1b745ece48'
  }
}

gql`
  mutation fetchEntraIdAuthorizeUrl($input: EntraIdAuthorizeInput!) {
    entraIdAuthorize(input: $input) {
      url
    }
  }
`

const LoginEntraId = () => (
  <LoginSSO
    useAuthorizeMutation={useFetchEntraIdAuthorizeUrlMutation}
    getAuthorizeUrl={(data) => data?.entraIdAuthorize?.url}
    getErrorKey={getErrorKey}
    titleKey={'text_1784307344254zepa808t6gd'}
    subtitleKey={'text_1784307344255tyy4spapa0w'}
    footerKey={'text_178430734425578xg4dxyfcq'}
    errorAlertDataTest="login-entra-id-error-alert"
  />
)

export default LoginEntraId
