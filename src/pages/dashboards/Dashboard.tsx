import { gql } from '@apollo/client'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar, getItemFromLS, removeItemFromLS, setItemFromLS } from '~/core/apolloClient'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { encodeRison } from '~/core/utils/risonEncoder'
import { extractNativeFilters, getSupersetFiltersLsKey } from '~/core/utils/supersetFilters'
import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import '~/main.css'
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

type DashboardProps = {
  contentTitle: string
  dashboardTitle: string
  dashboardTitleTestKey: string
}

const Dashboard = ({ contentTitle, dashboardTitle, dashboardTitleTestKey }: DashboardProps) => {
  const { translate } = useInternationalization()
  const { currentMembership } = useCurrentUser()

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
        fetchGuestToken: async () => dashboard?.guestToken,
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

      if (debouncedSaveFilters) {
        embedded.observeDataMask(debouncedSaveFilters)
      }

      dashboardRef.current = dashboard.id
    }

    mount()

    return () => {
      debouncedSaveFilters?.cancel()
      embedded?.unmount()
      dashboardRef.current = ''
    }
  }, [dashboard, currentMembership?.organization.id, dashboardTitle, mountId])

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
      </div>
    </>
  )
}

export default Dashboard
