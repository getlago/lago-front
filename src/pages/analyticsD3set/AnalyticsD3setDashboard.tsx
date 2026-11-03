import 'd3set/style.css'
import { useMemo } from 'react'
import { generatePath, useParams } from 'react-router'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { usePageSearchParam } from '~/components/designSystem/Pagination'
import { ANALYTICS_D3SET_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import './analyticsD3set.css'
import { AnalyticsD3setChartCard } from './AnalyticsD3setChartCard'
import { AnalyticsD3setFilterBar } from './AnalyticsD3setFilterBar'
import { filtersOfView } from './common/filters'
import { AnalyticsDashboard } from './common/types'
import { useAnalyticsDashboard } from './common/useAnalyticsDashboard'
import { useAnalyticsFilters } from './common/useAnalyticsFilters'
import { findView, viewSlugs } from './common/views'

export const ANALYTICS_D3SET_DASHBOARD_TEST_ID = 'analytics-d3set-dashboard'
export const ANALYTICS_D3SET_ERROR_TEST_ID = 'analytics-d3set-error'

export type AnalyticsD3setRoutes = { base: string; tab: string }

type DashboardViewProps = {
  baseUrl: string
  dashboard: AnalyticsDashboard
  routes: AnalyticsD3setRoutes
}

const DashboardView = ({ baseUrl, dashboard, routes }: DashboardViewProps) => {
  const { tab: tabParam } = useParams<{ tab?: string }>()
  const slugs = useMemo(() => viewSlugs(dashboard), [dashboard])
  const { tab, view } = findView(dashboard, slugs, tabParam)
  const filters = useMemo(
    () => (tab && view ? filtersOfView(dashboard.filters, tab, view) : []),
    [dashboard.filters, tab, view],
  )
  const { values, hasValues, setValue, reset } = useAnalyticsFilters(filters)
  const { page, goToPage } = usePageSearchParam(ANALYTICS_D3SET_FILTER_PREFIX)

  const linkTo = (viewId: string): string =>
    generatePath(routes.tab, { tab: slugs.get(viewId) ?? viewId })

  const tabs = useMemo(
    () =>
      dashboard.tabs.map((item, index) => ({
        title: item.title,
        link: linkTo(item.views[0]?.id ?? item.id),
        match: [...item.views.map((v) => linkTo(v.id)), ...(index === 0 ? [routes.base] : [])],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dashboard.tabs, slugs, routes],
  )

  if (!tab || !view) return null

  const viewTabs = tab.views.map((item, index) => ({
    title: item.title,
    link: linkTo(item.id),
    match: [linkTo(item.id), ...(index === 0 && tab === dashboard.tabs[0] ? [routes.base] : [])],
  }))

  return (
    <div className="flex flex-col gap-6" data-test={ANALYTICS_D3SET_DASHBOARD_TEST_ID}>
      <div className="flex flex-col">
        <NavigationTab name="analytics-tabs" tabs={tabs} />
        <NavigationTab name="analytics-views" tabs={viewTabs} />
      </div>
      <AnalyticsD3setFilterBar
        baseUrl={baseUrl}
        filters={filters}
        values={values}
        hasValues={hasValues}
        onChange={setValue}
        onReset={reset}
      />
      {view.rows.map((row, rowIndex) => (
        <div key={`${view.id}-${rowIndex}`} className="grid grid-cols-12 gap-6">
          {row.map((cell) => {
            const chart = dashboard.charts[cell.chart]

            if (!chart) return null

            return (
              <div
                key={cell.chart}
                className="min-w-0"
                style={{ gridColumn: `span ${Math.min(12, Math.max(1, cell.width))}` }}
              >
                <AnalyticsD3setChartCard
                  baseUrl={baseUrl}
                  chart={chart}
                  filters={filters}
                  values={values}
                  page={page}
                  onPageChange={goToPage}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

type AnalyticsD3setDashboardProps = {
  baseUrl: string
  routes: AnalyticsD3setRoutes
}

export const AnalyticsD3setDashboard = ({ baseUrl, routes }: AnalyticsD3setDashboardProps) => {
  const { translate } = useInternationalization()
  const state = useAnalyticsDashboard(baseUrl)

  if (state.status === 'error') {
    return (
      <div data-test={ANALYTICS_D3SET_ERROR_TEST_ID}>
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      </div>
    )
  }

  if (state.status === 'loading') {
    return <div className="h-80 animate-pulse rounded-xl bg-grey-100" />
  }

  return <DashboardView baseUrl={baseUrl} dashboard={state.dashboard} routes={routes} />
}
