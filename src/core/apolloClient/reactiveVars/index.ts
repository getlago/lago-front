import { makeVar } from '@apollo/client'

import { getItemFromLS } from '../cacheUtils'

export const AUTH_TOKEN_LS_KEY = 'authToken'
export const ORGANIZATION_LS_KEY_ID = 'currentOrganization'
export const isAuthenticatedVar = makeVar<boolean>(!!getItemFromLS(AUTH_TOKEN_LS_KEY))

export * from './authTokenVar'
export * from './customerPortalTokenVar'
export * from './envGlobalVar'
export * from './internationalizationVar'
export * from './locationHistoryVar'
export * from './duplicatePlanVar'
export * from './toastVar'
