import { gql, useApolloClient } from '@apollo/client'
import { captureException } from '@sentry/react'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

import { FinanceAssistantAnalyticsCta } from '~/components/aiAgent/FinanceAssistantAnalyticsCta'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar } from '~/core/apolloClient'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { getItemFromLS, removeItemFromLS, setItemFromLS } from '~/core/utils/localStorage'
import { encodeRison } from '~/core/utils/risonEncoder'
import { extractNativeFilters, getSupersetFiltersLsKey } from '~/core/utils/supersetFilters'
import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import '~/main.css'
import { createFetchSupersetGuestToken } from '~/pages/dashboards/fetchSupersetGuestToken'
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
  const { currentMembership } = useCurrentUser()
  const client = useApolloClient()

  const dashboardRef = useRef<string>('')

  const { data, error, loading } = useSupersetDashboardsQuery({})

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
    let disposed = false

    const persistFilters = isFeatureFlagActive(FeatureFlags.SUPERSET_PERSISTENT_FILTERS)
    // Filter persistence key is scoped to the org from the URL slug (resolved
    // through `currentMembership`, which is now slug-driven). Reading the orgId
    // directly from LS would scope filters to whatever org was last selected
    // browser-wide, causing cross-org filter leak when multiple tabs are open
    // on different orgs.
    const orgId = currentMembership?.organization.id || ''
    // Scoped by org AND dashboard title so the two dashboards don't share
    // (and overwrite) each other's persisted filters.
    const filtersLsKey = getSupersetFiltersLsKey(orgId, dashboardTitle)

    const debouncedSaveFilters = persistFilters
      ? debounce((dataMask: Record<string, unknown>) => {
          const filters = extractNativeFilters(dataMask)

          if (Object.keys(filters).length > 0) {
            setItemFromLS(filtersLsKey, filters)
          } else {
            removeItemFromLS(filtersLsKey)
          }
        }, 500)
      : null

    const fetchGuestToken = createFetchSupersetGuestToken(
      client,
      dashboard.id,
      dashboard.guestToken,
    )

    const mount = async () => {
      const mountPoint = document.getElementById(mountId)

      if (!mountPoint) {
        return
      }

      let urlParams: Record<string, string> | undefined

      if (persistFilters) {
        const savedFilters = getItemFromLS(filtersLsKey)
        const hasFilters = savedFilters && Object.keys(savedFilters).length > 0

        urlParams = hasFilters ? { native_filters: encodeRison(savedFilters) } : undefined
      }

      embedded = await embedDashboard({
        id: dashboard.embeddedId,
        supersetDomain: lagoSupersetUrl,
        mountPoint,
        fetchGuestToken,
        dashboardUiConfig: {
          hideTitle: true,
          emitDataMasks: persistFilters,
          filters: {
            expanded: true,
          },
          ...(urlParams && { urlParams }),
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })

      // The SDK mounts its iframe before `embedDashboard` resolves, so cleanup that
      // ran while this was in flight had no `embedded` to unmount.
      if (disposed) {
        embedded.unmount()

        return
      }

      if (debouncedSaveFilters) {
        embedded.observeDataMask(debouncedSaveFilters)
      }

      dashboardRef.current = dashboard.id
    }

    // Nothing else observes this promise: uncaught, a bad token from Superset is an
    // unhandled rejection and a silently blank dashboard.
    mount().catch((mountError) => {
      captureException(mountError, {
        tags: { errorType: 'SupersetDashboardMountError', component: 'Dashboard' },
        extra: { dashboardId: dashboard.id },
      })
    })

    return () => {
      disposed = true
      fetchGuestToken.cancel()
      debouncedSaveFilters?.cancel()
      embedded?.unmount()
      dashboardRef.current = ''
    }
  }, [dashboard, currentMembership?.organization.id, client, dashboardTitle, mountId])

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
