import { makeVar } from '@apollo/client'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const AUTH_TOKEN_LS_KEY = 'authToken'

/** ----------------- VAR ----------------- */
export const authTokenVar = makeVar<string>(getItemFromLS(AUTH_TOKEN_LS_KEY))

export const updateAuthTokenVar = (token?: string) => {
  setItemFromLS(AUTH_TOKEN_LS_KEY, token)
  authTokenVar(token)
}
