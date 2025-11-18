import { gql } from '@apollo/client'
import { embedDashboard } from '@superset-ui/embedded-sdk'
import { Skeleton, Typography } from 'lago-design-system'
import { useEffect } from 'react'

import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import { PageHeader } from '~/styles'

const SUPERSET_DOMAIN = 'http://localhost:8089'

gql`
  query supersetDashboards {
    supersetDashboards {
      id
      embeddedId
      dashboardTitle
      guestToken
    }
  }
`

const Dashboards = () => {
  const { translate } = useInternationalization()

  const { data, loading } = useSupersetDashboardsQuery({})

  useEffect(() => {
    const dashboard = data?.supersetDashboards?.[0]
    const mountPoint = document.getElementById('superset')

    if (loading || !dashboard || !mountPoint) {
      return
    }

    embedDashboard({
      id: dashboard.embeddedId,
      supersetDomain: SUPERSET_DOMAIN,
      mountPoint,
      fetchGuestToken: async () => dashboard.guestToken,
      dashboardUiConfig: {
        hideTitle: true,
        filters: {
          expanded: true,
        },
      },
      iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
    })
  }, [loading, data?.supersetDashboards])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1762346890583hgqcnuvj2rh')}
        </Typography>
      </PageHeader.Wrapper>

      {loading && (
        <div className="px-8">
          <Skeleton variant="text" className="mb-5 w-70" />
          <Skeleton variant="text" className="mb-4" />
          <Skeleton variant="text" className="w-30" />
        </div>
      )}

      {!loading && (
        <div className="height-minus-nav relative w-full">
          <div id="superset" className="absolute inset-0 size-full"></div>
        </div>
      )}
    </>
  )
}

export default Dashboards
