import { gql } from '@apollo/client'

import { envGlobalVar } from '~/core/apolloClient/reactiveVars'
import { useGetCurrentUserNeedsOrganizationQuery } from '~/generated/graphql'

gql`
  query getCurrentUserNeedsOrganization {
    currentUser {
      id
      needsOrganization
    }
  }
`

type UseNeedsOrganizationReturn = {
  needsOrganization: boolean
  loading: boolean
  hasError: boolean
}

export const useNeedsOrganization = (): UseNeedsOrganizationReturn => {
  const { selfServeEnabled } = envGlobalVar()
  const { data, loading, error } = useGetCurrentUserNeedsOrganizationQuery({
    skip: !selfServeEnabled,
  })

  return {
    needsOrganization: !!data?.currentUser.needsOrganization,
    loading,
    hasError: !!error,
  }
}
