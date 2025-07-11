import { makeVar } from '@apollo/client'

import { getItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'

export const AUTH_TOKEN_LS_KEY = 'authToken'
export const TMP_AUTH_TOKEN_LS_KEY = 'tmpAuthToken'

/** ----------------- VAR ----------------- */
export const authTokenVar = makeVar<string>(getItemFromLS(AUTH_TOKEN_LS_KEY))

export const updateAuthTokenVar = (token?: string) => {
  setItemFromLS(AUTH_TOKEN_LS_KEY, token)
  authTokenVar(token)
}
