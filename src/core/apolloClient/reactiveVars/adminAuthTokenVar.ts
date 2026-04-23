import { makeVar } from '@apollo/client'

import { getItemFromLS, removeItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'

export const ADMIN_AUTH_TOKEN_LS_KEY = 'adminAuthToken'
export const ADMIN_ROLE_LS_KEY = 'adminRole'
export const ADMIN_EMAIL_LS_KEY = 'adminEmail'

export type AdminRole = 'admin' | 'cs'

/** ----------------- VARS ----------------- */
export const adminAuthTokenVar = makeVar<string>(getItemFromLS(ADMIN_AUTH_TOKEN_LS_KEY))
export const adminRoleVar = makeVar<AdminRole | undefined>(
  (getItemFromLS(ADMIN_ROLE_LS_KEY) as AdminRole) || undefined,
)
export const adminEmailVar = makeVar<string | undefined>(
  getItemFromLS(ADMIN_EMAIL_LS_KEY) || undefined,
)

export const updateAdminAuthTokenVar = (token?: string) => {
  token ? setItemFromLS(ADMIN_AUTH_TOKEN_LS_KEY, token) : removeItemFromLS(ADMIN_AUTH_TOKEN_LS_KEY)
  adminAuthTokenVar(token)
}

export const updateAdminRoleVar = (role?: AdminRole) => {
  role ? setItemFromLS(ADMIN_ROLE_LS_KEY, role) : removeItemFromLS(ADMIN_ROLE_LS_KEY)
  adminRoleVar(role)
}

export const updateAdminEmailVar = (email?: string) => {
  email ? setItemFromLS(ADMIN_EMAIL_LS_KEY, email) : removeItemFromLS(ADMIN_EMAIL_LS_KEY)
  adminEmailVar(email)
}
