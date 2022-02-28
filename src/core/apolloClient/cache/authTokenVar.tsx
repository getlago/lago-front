import { makeVar } from '@apollo/client'

import { getItemFromLS, setItemFromLS } from '../utils'

export const AUTH_TOKEN_LS_KEY = 'authToken'

/** ----------------- VAR ----------------- */
export const authTokenVar = makeVar<string>(getItemFromLS(AUTH_TOKEN_LS_KEY))

export const updateAuthTokenVar = (token?: string) => {
  authTokenVar(token)
  setItemFromLS(AUTH_TOKEN_LS_KEY, token)
}
