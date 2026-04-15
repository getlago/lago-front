import { makeVar } from '@apollo/client'

import { getItemFromLS, removeItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'

/** ----------------- VAR ----------------- */
export const currentOrganizationVar = makeVar<string | null>(
  getItemFromLS(ORGANIZATION_LS_KEY_ID) || null,
)

export const getCurrentOrganizationId = (): string | null => currentOrganizationVar()

export const setCurrentOrganizationId = (id: string | null): void => {
  currentOrganizationVar(id)

  if (id) {
    setItemFromLS(ORGANIZATION_LS_KEY_ID, id)
  } else {
    removeItemFromLS(ORGANIZATION_LS_KEY_ID)
  }
}
