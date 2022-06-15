import { makeVar } from '@apollo/client'

import { getItemFromLS } from '../utils'

export const AUTH_TOKEN_LS_KEY = 'authToken'
export const isAuthenticatedVar = makeVar<boolean>(!!getItemFromLS(AUTH_TOKEN_LS_KEY))

export * from './authTokenVar'
export * from './toastVar'
export * from './currentUserInfosVar'
export * from './internationalizationVar'
