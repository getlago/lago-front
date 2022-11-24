import { makeVar, useReactiveVar, ApolloClient } from '@apollo/client'

import { CurrentUserFragment, CurrentOrganizationFragment } from '~/generated/graphql'

import { getItemFromLS, setItemFromLS } from '../cacheUtils'

export const ORGANIZATION_LS_KEY = 'currentOrganization'
const CURRENT_USER_LS_KEY = 'currentUser'

interface CurrentUserInfos {
  user?: CurrentUserFragment
  currentOrganization?: CurrentOrganizationFragment
  organizations?: CurrentOrganizationFragment[]
}

export const currentUserInfosVar = makeVar<CurrentUserInfos>({
  user: getItemFromLS(CURRENT_USER_LS_KEY) ?? undefined,
  currentOrganization: getItemFromLS(ORGANIZATION_LS_KEY) ?? undefined,
})

export const updateCurrentUserInfosVar = (params: CurrentUserInfos) => {
  const currentState = currentUserInfosVar()
  let user = currentState.user
  const currentOrganizationIsValid = !!(params?.user?.organizations || []).find(
    (o) => o.id === currentState?.currentOrganization?.id
  )
  const currentOrganization = currentOrganizationIsValid
    ? currentState?.currentOrganization
    : (params.user?.organizations || [])[0]

  if (!!params.user) {
    user = {
      ...params.user,
    }
    setItemFromLS(CURRENT_USER_LS_KEY, user)
  }

  if (!user) return

  if (!!currentOrganization && currentOrganization?.id !== currentState?.currentOrganization?.id) {
    setItemFromLS(ORGANIZATION_LS_KEY, currentOrganization)
  }

  currentUserInfosVar({
    user,
    currentOrganization,
    organizations: user?.organizations || [],
  })
}

export const udpateCurrentOrganizationInfosVar = (params: CurrentOrganizationFragment) => {
  const currentState = currentUserInfosVar()
  const isUpdatingCurrentOrga = params?.id === currentState?.currentOrganization?.id

  if (!isUpdatingCurrentOrga) return

  const newOrga = { ...currentState?.currentOrganization, ...params }

  setItemFromLS(ORGANIZATION_LS_KEY, newOrga)

  currentUserInfosVar({
    ...currentState,
    currentOrganization: newOrga,
  })
}

export const switchCurrentOrganization = async (
  client: ApolloClient<object>,
  organizationId: string
) => {
  const currentState = currentUserInfosVar()
  const newCurrentOrganization = (currentState?.organizations || []).find(
    (o) => o.id === organizationId
  )

  if (!!newCurrentOrganization) {
    setItemFromLS(ORGANIZATION_LS_KEY, newCurrentOrganization)

    currentUserInfosVar({
      ...currentState,
      currentOrganization: newCurrentOrganization,
    })
  }

  await client.resetStore()
}

export const resetCurrentUserInfosVar = () => {
  currentUserInfosVar({ user: undefined, currentOrganization: undefined, organizations: undefined })
}

export const useCurrentUserInfosVar = () => useReactiveVar(currentUserInfosVar)
