import { ApolloClient, ApolloQueryResult, gql } from '@apollo/client'

import {
  LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
  ORGANIZATION_LS_KEY_ID,
} from '~/core/constants/localStorageKeys'
import {
  CurrentUserFragmentDoc,
  GetCurrentUserInfosForLoginQuery,
  LagoApiError,
} from '~/generated/graphql'
import { DEVTOOL_AUTO_SAVE_KEY } from '~/hooks/useDeveloperTool'

import {
  addToast,
  AUTH_TOKEN_LS_KEY,
  resetLocationHistoryVar,
  TMP_AUTH_TOKEN_LS_KEY,
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
      accessibleByCurrentSession
    }
  }
`

// --------------------- Local storage utils ---------------------
export const getItemFromLS = (key: string) => {
  const data = typeof window !== 'undefined' ? localStorage.getItem(key) : ''

  try {
    if (data === 'undefined') {
      return undefined
    }

    return !!data ? JSON.parse(data) : data
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
  // Cancels active operations
  client.stop()
  // Removes cached data and prevents active queries re-fetch
  await client.clearStore()
  updateAuthTokenVar()

  resetLocationHistory && resetLocationHistoryVar()
}

const getCurrentUserOrganization = async (client: ApolloClient<object>, token: string) => {
  try {
    // Set a temporary auth token to query the current user infos
    // We don't want to use the AUTH_TOKEN_LS_KEY as it would means that the user is already authenticated.
    // Here we are logged in but we are not authenticated yet.
    setItemFromLS(TMP_AUTH_TOKEN_LS_KEY, token)

    // Then get the current user infos to query organizations
    const response = await client.query({
      query: gql`
        query getCurrentUserInfosForLogin {
          currentUser {
            id
            ...CurrentUser
          }
        }

        ${CurrentUserFragmentDoc}
      `,
      context: {
        fetchPolicy: 'network-only',
      },
    })

    return response as ApolloQueryResult<GetCurrentUserInfosForLoginQuery>
  } catch {
    return undefined
  } finally {
    // Remove the temporary auth token in any case
    removeItemFromLS(TMP_AUTH_TOKEN_LS_KEY)
  }
}

export const onLogIn = async (client: ApolloClient<object>, token: string) => {
  let organization
  const previousOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

  try {
    const response = await getCurrentUserOrganization(client, token)

    // If no response, it means that the current user could not have been fetched.
    if (!response) {
      throw new Error(LagoApiError.InternalError)
    }

    const { data } = response

    // Set the auth token in local storage
    updateAuthTokenVar(token)

    // Check if user has already logged in an organization and find it in the list
    if (previousOrganizationId) {
      const previousOrganization = (data?.currentUser?.organizations || []).find(
        (org) => org.id === previousOrganizationId,
      )

      // If the previous organization is still accessible by the current session, set it as the current organization
      if (previousOrganization && previousOrganization.accessibleByCurrentSession) {
        organization = previousOrganization
      } else {
        removeItemFromLS(ORGANIZATION_LS_KEY_ID)
      }
    } else {
      // If no organization have been found, any redirection logic should be prevented later
      removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
    }

    // If still no organization, take the first one that is accessible by the current session
    if (!organization)
      organization = (data?.currentUser?.organizations || [])
        .filter((org) => org.accessibleByCurrentSession)
        .sort((a, b) => a.name.toLowerCase()?.localeCompare(b.name.toLowerCase() ?? '') ?? 0)[0]

    // Set the organization id in local storage
    setItemFromLS(ORGANIZATION_LS_KEY_ID, organization?.id)
  } catch {
    // If an error occurs, display a toast to inform the user that the login failed
    addToast({
      severity: 'danger',
      translateKey: 'text_622f7a3dc32ce100c46a5154',
    })

    // Remove all local storage items related to the auth
    removeItemFromLS(AUTH_TOKEN_LS_KEY)
    removeItemFromLS(ORGANIZATION_LS_KEY_ID)

    // In case of error, we want to log out the user
    logOut(client, true)
  }
}

export const switchCurrentOrganization = async (
  client: ApolloClient<object>,
  organizationId: string,
) => {
  // Removes cached data and prevents active queries re-fetch
  await client.clearStore()

  // We should not be redirected to any route on orga switch, but rather bring to home (prevent )
  removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)

  // Clear the devtools state
  removeItemFromLS(DEVTOOL_AUTO_SAVE_KEY)

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
