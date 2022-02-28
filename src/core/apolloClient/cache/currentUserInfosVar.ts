import { makeVar, useReactiveVar } from '@apollo/client'

import { CurrentUserFragment } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../utils'

export const WORKSPACE_LS_KEY = 'currentWorkspace'
const CURRENT_USER_LS_KEY = 'currentUser'

interface CurrentUserInfos {
  user?: CurrentUserFragment
}

export const currentUserInfosVar = makeVar<CurrentUserInfos>({
  user: getItemFromLS(CURRENT_USER_LS_KEY) ?? undefined,
})

export const updateCurrentUserInfosVar = (params: CurrentUserInfos) => {
  const currentState = currentUserInfosVar()
  let user = currentState.user

  if (!!params.user) {
    user = {
      ...params.user,
    }
    setItemFromLS(CURRENT_USER_LS_KEY, user)
  }

  if (!user) return

  currentUserInfosVar({
    user,
  })
}

export const resetCurrentUserInfosVar = () => {
  currentUserInfosVar({ user: undefined })
}

export const useCurrentUserInfosVar = () => useReactiveVar(currentUserInfosVar)
