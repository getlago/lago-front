import { gql } from '@apollo/client'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { useEffect, useMemo, useRef } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar, getItemFromLS, setItemFromLS } from '~/core/apolloClient'
import {
  ORGANIZATION_LS_KEY_ID,
  SUPERSET_FILTERS_LS_KEY_PREFIX,
} from '~/core/constants/localStorageKeys'
import { encodeRison } from '~/core/utils/risonEncoder'
import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'

const SUPERSET_TEST_DASHBOARD_TITLE_LS_KEY = 'superset-dashboard-test-name'
const SUPERSET_DEFAULT_DASHBOARD_TITLE = 'Lago Dashboard'

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

const Dashboards = () => {
  const { translate } = useInternationalization()

  const dashboardRef = useRef<string>('')

  const { data, error, loading } = useSupersetDashboardsQuery({})

  const dashboardTitle =
    getItemFromLS(SUPERSET_TEST_DASHBOARD_TITLE_LS_KEY) || SUPERSET_DEFAULT_DASHBOARD_TITLE

  const dashboard = useMemo(() => {
    return data?.supersetDashboards?.find((d) => d.dashboardTitle === dashboardTitle)
  }, [data?.supersetDashboards, dashboardTitle])

  useEffect(() => {
    if (!dashboard || dashboard?.id === dashboardRef?.current) {
      return
    }

    let embedded: null | EmbeddedDashboard = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const mount = async () => {
      const mountPoint = document.getElementById('superset')

      if (!mountPoint) {
        return
      }

      const orgId = getItemFromLS(ORGANIZATION_LS_KEY_ID) || ''
      const filtersLsKey = SUPERSET_FILTERS_LS_KEY_PREFIX + orgId + '-' + dashboard.embeddedId
      const savedFilters = getItemFromLS(filtersLsKey)
      const hasFilters = savedFilters && Object.keys(savedFilters).length > 0
      const urlParams = hasFilters ? { native_filters: encodeRison(savedFilters) } : undefined

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
          ...(urlParams && { urlParams }),
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })

      embedded.observeDataMask((dataMask) => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          const filters: Record<string, { filterState: Record<string, unknown> }> = {}

          for (const [key, entry] of Object.entries(dataMask)) {
            if (!key.startsWith('NATIVE_FILTER-')) continue

            const filterState = (entry as { filterState?: Record<string, unknown> })?.filterState
            if (!filterState) continue

            const val = filterState.value
            if (val === null || val === undefined) continue
            if (Array.isArray(val) && val.length === 0) continue

            filters[key] = { filterState }
          }

          if (Object.keys(filters).length > 0) {
            setItemFromLS(filtersLsKey, filters)
          }
        }, 500)
      })

      dashboardRef.current = dashboard.id
    }

    mount()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      embedded?.unmount()
      dashboardRef.current = ''
    }
  }, [dashboard])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_6553885df387fd0097fd7384')}
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

        <div id="superset" className="absolute inset-0 size-full"></div>
      </div>
    </>
  )
}

export default Dashboards
