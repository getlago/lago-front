import { useReactiveVar } from '@apollo/client'

import { authTokenVar } from '~/core/apolloClient'

type useIsAuthenticatedReturn = () => {
  isAuthenticated: boolean
  token?: string
}

export const useIsAuthenticated: useIsAuthenticatedReturn = () => {
  const token = useReactiveVar(authTokenVar)

  return {
    isAuthenticated: !!token,
    token,
  }
}
