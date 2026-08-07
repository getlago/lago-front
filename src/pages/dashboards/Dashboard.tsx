import { gql } from '@apollo/client'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { useEffect, useMemo, useRef, useState } from 'react'

import { FinanceAssistantAnalyticsCta } from '~/components/aiAgent/FinanceAssistantAnalyticsCta'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar } from '~/core/apolloClient'
import { useNavigate } from '~/core/router'
import { getItemFromLS } from '~/core/utils/localStorage'
import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import {
  attachDashboardStateSync,
  DASHBOARD_STATE_SEARCH_PARAM,
} from '~/pages/dashboards/dashboardStateSync'
import ErrorImage from '~/public/images/maneki/error.svg'
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

export const DASHBOARD_MOUNT_TEST_ID = 'superset-dashboard-mount'

export type DashboardProps = {
  contentTitle: string
  dashboardTitle: string
  dashboardTitleTestKey: string
}

const Dashboard = ({ contentTitle, dashboardTitle, dashboardTitleTestKey }: DashboardProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const dashboardRef = useRef<string>('')
  // The slug-aware wrapper returns a new function every render, so keeping it
  // in a ref is what lets the embed effect stay out of the render loop.
  const navigateRef = useRef(navigate)

  useEffect(() => {
    navigateRef.current = navigate
  })

  const { data, error, loading } = useSupersetDashboardsQuery({})

  // Read once. Subscribing to the search params would re-render on every state
  // write, and putting the key in the embed effect's deps would remount the
  // iframe (a full dashboard reload) each time a filter moves.
  const [initialStateKey] = useState(() =>
    new URLSearchParams(window.location.search).get(DASHBOARD_STATE_SEARCH_PARAM),
  )

  const currentDashboardTitle = getItemFromLS(dashboardTitleTestKey) || dashboardTitle

  // Mount id is derived from the dashboard title so each dashboard instance
  // targets its own DOM node instead of a shared global id.
  const mountId = `superset-${dashboardTitle.toLowerCase().split(' ').join('-')}`

  const dashboard = useMemo(() => {
    return data?.supersetDashboards?.find((d) => d.dashboardTitle === currentDashboardTitle)
  }, [data?.supersetDashboards, currentDashboardTitle])

  useEffect(() => {
    if (!dashboard || dashboard?.id === dashboardRef?.current) {
      return
    }

    let embedded: null | EmbeddedDashboard = null
    let detachStateSync: (() => void) | null = null

    const writeStateKeyToUrl = (key: string): void => {
      const search = new URLSearchParams(window.location.search)

      search.set(DASHBOARD_STATE_SEARCH_PARAM, key)

      // An object target without a pathname is a documented pass-through of the
      // slug-aware wrapper, so the org slug is neither dropped nor doubled.
      navigateRef.current({ search: `?${search.toString()}` }, { replace: true })
    }

    const mount = async () => {
      const mountPoint = document.getElementById(mountId)

      if (!mountPoint) {
        return
      }

      embedded = await embedDashboard({
        id: dashboard.embeddedId,
        supersetDomain: lagoSupersetUrl,
        mountPoint,
        fetchGuestToken: async () => dashboard?.guestToken,
        dashboardUiConfig: {
          hideTitle: true,
          emitDataMasks: true,
          filters: {
            expanded: true,
          },
          ...(initialStateKey && { urlParams: { permalink_key: initialStateKey } }),
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })

      detachStateSync = attachDashboardStateSync({
        embedded,
        onStateKey: writeStateKeyToUrl,
      })

      dashboardRef.current = dashboard.id
    }

    mount()

    return () => {
      detachStateSync?.()
      embedded?.unmount()
      dashboardRef.current = ''
    }
  }, [dashboard, mountId, initialStateKey])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {contentTitle}
        </Typography>
      </PageHeader.Wrapper>

      <div className="height-minus-nav relative w-full">
        {error && !loading && (
          <GenericPlaceholder
            title={translate('text_629728388c4d2300e2d380d5')}
            subtitle={translate('text_629728388c4d2300e2d380eb')}
            buttonTitle={translate('text_629728388c4d2300e2d38110')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        )}

        <div
          id={mountId}
          data-test={DASHBOARD_MOUNT_TEST_ID}
          className="superset-dashboard absolute inset-0 size-full"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 px-4">
          <FinanceAssistantAnalyticsCta />
        </div>
      </div>
    </>
  )
}

export default Dashboard
