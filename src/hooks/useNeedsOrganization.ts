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
  retry: () => Promise<void>
}

export const useNeedsOrganization = (): UseNeedsOrganizationReturn => {
  const { selfServeEnabled } = envGlobalVar()
  const { data, loading, error, refetch } = useGetCurrentUserNeedsOrganizationQuery({
    skip: !selfServeEnabled,
    // A retry shows as loading again, then as its answer
    notifyOnNetworkStatusChange: true,
  })

  return {
    needsOrganization: !!data?.currentUser.needsOrganization,
    loading,
    hasError: !!error,
    retry: async () => {
      await refetch().catch(() => undefined)
    },
  }
}
