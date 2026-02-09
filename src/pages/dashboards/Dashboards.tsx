import { gql } from '@apollo/client'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar } from '~/core/apolloClient'
import { SupersetDashboard, useSupersetDashboardsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import { PageHeader } from '~/styles'

const { lagoSupersetUrl } = envGlobalVar()

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

const currentDashboard = (dashboards: Omit<SupersetDashboard, 'supersetUrl'>[] | undefined) => {
  return dashboards?.find((d) => d.id === '1')
}

const Dashboards = () => {
  const { translate } = useInternationalization()

  const dashboardRef = useRef<string>('')

  const [getSupersetDashboards, { data }] = useSupersetDashboardsLazyQuery({})

  const dashboard = useMemo(() => {
    return currentDashboard(data?.supersetDashboards)
  }, [data?.supersetDashboards])

  const fetchGuestToken = useCallback(async () => {
    const supersetDashboards = await getSupersetDashboards()

    const token = currentDashboard(supersetDashboards?.data?.supersetDashboards)?.guestToken || ''

    return token
  }, [getSupersetDashboards])

  useEffect(() => {
    getSupersetDashboards()
  }, [getSupersetDashboards])

  useEffect(() => {
    if (!dashboard || dashboard?.id === dashboardRef?.current) {
      return
    }

    let embedded: null | EmbeddedDashboard = null

    const mount = async () => {
      const mountPoint = document.getElementById('superset')

      if (!mountPoint) {
        return
      }

      embedded = await embedDashboard({
        id: dashboard.embeddedId,
        supersetDomain: lagoSupersetUrl,
        mountPoint,
        fetchGuestToken,
        dashboardUiConfig: {
          hideTitle: true,
          filters: {
            expanded: true,
          },
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })

      dashboardRef.current = dashboard.id
    }

    mount()

    return () => {
      embedded?.unmount()
    }
  }, [dashboard, fetchGuestToken])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1762346890583hgqcnuvj2rh')}
        </Typography>
      </PageHeader.Wrapper>

      <div className="height-minus-nav relative w-full">
        <div id="superset" className="absolute inset-0 size-full"></div>
      </div>
    </>
  )
}

export default Dashboards
