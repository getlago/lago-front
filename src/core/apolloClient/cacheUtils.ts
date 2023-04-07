import { gql } from '@apollo/client'
import { ApolloClient } from '@apollo/client'

import { CurrentUserFragment } from '~/generated/graphql'

import {
  updateAuthTokenVar,
  resetLocationHistoryVar,
  ORGANIZATION_LS_KEY_ID,
  updateCustomerPortalTokenVar,
} from './reactiveVars'

gql`
  fragment CurrentUser on User {
    id
    organizations {
      id
      timezone
    }
  }
`

// --------------------- Local storage utils ---------------------
export const getItemFromLS = (key: string) => {
  const data = typeof window !== 'undefined' ? localStorage.getItem(key) : ''

  try {
    return data === 'undefined' ? undefined : !!data ? JSON.parse(data) : data
  } catch (err) {
    return data
  }
}

export const setItemFromLS = (key: string, value: unknown) => {
  const stringify = typeof value !== 'string' ? JSON.stringify(value) : value

  return localStorage.setItem(key, stringify)
}

export const removeItem = (key: string) => {
  localStorage.removeItem(key)
}

// --------------------- Auth utils ---------------------
export const logOut = async (client: ApolloClient<object>, resetLocationHistory?: boolean) => {
  localStorage && localStorage.clear()

  await client.cache.reset()
  updateAuthTokenVar()
  resetLocationHistory && resetLocationHistoryVar()
}

export const onLogIn = (token: string, user: CurrentUserFragment) => {
  updateAuthTokenVar(token)
  const organization = (user?.organizations || [])[0]

  setItemFromLS(ORGANIZATION_LS_KEY_ID, organization?.id)
}

export const switchCurrentOrganization = async (
  client: ApolloClient<object>,
  organizationId: string
) => {
  setItemFromLS(ORGANIZATION_LS_KEY_ID, organizationId)

  await client.resetStore()
}

export const onAccessCustomerPortal = (token?: string) => {
  updateCustomerPortalTokenVar(token)
}

// --------------------- Omit __typename ---------------------
const omitDeepArrayWalk = (arr: Array<unknown>, key: string): unknown => {
  return arr.map((val) => {
    if (Array.isArray(val)) return omitDeepArrayWalk(val, key)
    // @ts-expect-error
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
        // @ts-expect-error
        newObj[i] = omitDeep(val, key)
      else newObj[i] = val
    }
  })
  return newObj
}
