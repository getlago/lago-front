import { AuthenticationMethodsEnum } from '~/generated/graphql'

export const authenticationMethodsMapping: Record<AuthenticationMethodsEnum, string> = {
  [AuthenticationMethodsEnum.EmailPassword]: 'text_1752158380555c18bvtn8gd8',
  [AuthenticationMethodsEnum.EntraId]: 'text_17843073442548zt904xoinv',
  [AuthenticationMethodsEnum.GoogleOauth]: 'text_1752158380555upqjf6cxtq9',
  [AuthenticationMethodsEnum.Okta]: 'text_664c732c264d7eed1c74fda2',
}
