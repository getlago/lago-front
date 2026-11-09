import { makeVar } from '@apollo/client'

import { removeItemFromLS } from '~/core/utils/localStorage'

const CUSTOMER_PORTAL_TOKEN_LS_KEY = 'customerPortalToken'

// Older builds persisted the portal token here; drop whatever they left at rest.
removeItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

/** ----------------- VAR ----------------- */
export const customerPortalTokenVar = makeVar<string | undefined>(undefined)

export const updateCustomerPortalTokenVar = (token?: string) => {
  customerPortalTokenVar(token)
}
