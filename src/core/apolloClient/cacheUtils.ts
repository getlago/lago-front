import { ApolloClient, gql } from '@apollo/client'

import {
  LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
  ORGANIZATION_LS_KEY_ID,
} from '~/core/constants/localStorageKeys'
import { CurrentUserFragment } from '~/generated/graphql'

import {
  resetLocationHistoryVar,
  updateAuthTokenVar,
  updateCustomerPortalTokenVar,
} from './reactiveVars'

gql`
  fragment CurrentUser on User {
    id
    organizations {
      id
      name
      timezone
    }
  }
`

// --------------------- Local storage utils ---------------------
export const getItemFromLS = (key: string) => {
  const data = typeof window !== 'undefined' ? localStorage.getItem(key) : ''

  try {
    return data === 'undefined' ? undefined : !!data ? JSON.parse(data) : data
  } catch {
    return data
  }
}

export const setItemFromLS = (key: string, value: unknown) => {
  const stringify = typeof value !== 'string' ? JSON.stringify(value) : value

  return localStorage.setItem(key, stringify)
}

export const removeItemFromLS = (key: string) => {
  return localStorage.removeItem(key)
}

// --------------------- Auth utils ---------------------
export const logOut = async (client: ApolloClient<object>, resetLocationHistory?: boolean) => {
  // Prevent active queries re-fetch
  await client.clearStore()
  // Clear store
  await client.cache.reset()
  updateAuthTokenVar()
  resetLocationHistory && resetLocationHistoryVar()
}

export const onLogIn = (token: string, user: CurrentUserFragment) => {
  updateAuthTokenVar(token)
  const previousOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)
  let organization

  // Check if user has already logged in an orga and find it in the list
  if (previousOrganizationId) {
    organization = (user?.organizations || []).find((org) => org.id === previousOrganizationId)
  } else {
    // if no orga have been found, any redirection logic should be prevented later
    removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
  }

  // If still not organization, take the first one
  if (!organization)
    organization = (user?.organizations || []).sort(
      (a, b) => a.name.toLowerCase()?.localeCompare(b.name.toLowerCase() ?? '') ?? 0,
    )[0]

  // Set the organization id in local storage
  setItemFromLS(ORGANIZATION_LS_KEY_ID, organization?.id)
}

export const switchCurrentOrganization = async (
  client: ApolloClient<object>,
  organizationId: string,
) => {
  // Stop the client to prevent active queries re-fetch
  client.stop()

  // We should not be redirected to any route on orga switch, but rather bring to home (prevent )
  removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
  // Set the new organization id in local storage
  setItemFromLS(ORGANIZATION_LS_KEY_ID, organizationId)
}

export const onAccessCustomerPortal = (token?: string) => {
  updateCustomerPortalTokenVar(token)
}

// --------------------- Omit __typename ---------------------
const omitDeepArrayWalk = (arr: Array<unknown>, key: string): unknown => {
  return arr.map((val) => {
    if (Array.isArray(val)) return omitDeepArrayWalk(val, key)
    // @ts-expect-error: val could be null which would cause type error when passing to omitDeep
    else if (typeof val === 'object') return omitDeep(val, key)
    return val
  })
}

export const omitDeep = (obj: Record<string | number, unknown>, key: string) => {
  const keys = Object.keys(obj)
  const newObj: Record<string | number, unknown> = {}

  keys.forEach((i) => {
    if (i !== key) {
      const val = obj[i]

      if (val instanceof Date) newObj[i] = val
      else if (Array.isArray(val)) newObj[i] = omitDeepArrayWalk(val, key)
      else if (typeof val === 'object' && val !== null)
        // @ts-expect-error: val could be any object type which would cause type error when passing to omitDeep
        newObj[i] = omitDeep(val, key)
      else newObj[i] = val
    }
  })
  return newObj
}
