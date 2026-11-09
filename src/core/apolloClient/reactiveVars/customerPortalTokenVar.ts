import { makeVar } from '@apollo/client'

/** ----------------- VAR ----------------- */
export const customerPortalTokenVar = makeVar<string | undefined>(undefined)

export const updateCustomerPortalTokenVar = (token?: string) => {
  customerPortalTokenVar(token)
}
