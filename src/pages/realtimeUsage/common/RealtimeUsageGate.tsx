import { ReactNode } from 'react'

import { Spinner } from '~/components/designSystem/Spinner'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Error404InApp from '~/pages/Error404InApp'

// The reports read the real-time usage buckets, which only exist for the organizations the
// pipeline serves: anywhere else the pages do not exist.
export const RealtimeUsageGate = ({ children }: { children: ReactNode }): JSX.Element => {
  const { organization, loading } = useOrganizationInfos()

  if (loading && !organization) return <Spinner />
  if (!organization?.realtimeUsageEnabled) return <Error404InApp />

  return <>{children}</>
}
