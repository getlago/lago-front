import { makeVar, useReactiveVar } from '@apollo/client'

import { CurrentUserFragment, CurrentOrganizationFragment } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const ORGANIZATION_LS_KEY = 'currentOrganization'
const CURRENT_USER_LS_KEY = 'currentUser'

interface CurrentUserInfos {
  user?: CurrentUserFragment
  currentOrganization?: CurrentOrganizationFragment
}

export const currentUserInfosVar = makeVar<CurrentUserInfos>({
  user: getItemFromLS(CURRENT_USER_LS_KEY) ?? undefined,
  currentOrganization: getItemFromLS(ORGANIZATION_LS_KEY) ?? undefined,
})

export const updateCurrentUserInfosVar = (params: CurrentUserInfos) => {
  const currentState = currentUserInfosVar()
  let user = currentState.user
  let currentOrganization =
    (params.user?.organizations || [])[0] ?? currentState.currentOrganization

  if (!!params.user) {
    user = {
      ...params.user,
    }
    setItemFromLS(CURRENT_USER_LS_KEY, user)
  }

  if (!user) return

  if (!!params.user?.organizations && !!params.user?.organizations[0]) {
    setItemFromLS(ORGANIZATION_LS_KEY, currentOrganization)
  }

  currentUserInfosVar({
    user,
    currentOrganization,
  })
}

export const resetCurrentUserInfosVar = () => {
  currentUserInfosVar({ user: undefined, currentOrganization: undefined })
}

export const useCurrentUserInfosVar = () => useReactiveVar(currentUserInfosVar)
