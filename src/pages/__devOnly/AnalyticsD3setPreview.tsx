import { envGlobalVar } from '~/core/apolloClient'
import {
  ONLY_DEV_ANALYTICS_D3SET_PREVIEW_ROUTE,
  ONLY_DEV_ANALYTICS_D3SET_PREVIEW_TAB_ROUTE,
} from '~/core/router'
import { AnalyticsD3setDashboard } from '~/pages/analyticsD3set/AnalyticsD3setDashboard'

const ROUTES = {
  base: ONLY_DEV_ANALYTICS_D3SET_PREVIEW_ROUTE,
  tab: ONLY_DEV_ANALYTICS_D3SET_PREVIEW_TAB_ROUTE,
}

// Dev and QA builds only, outside the login: the page against the mock server, with no app shell.
const AnalyticsD3setPreview = () => {
  const { lagoAnalyticsUrl } = envGlobalVar()

  return (
    <div className="flex w-full flex-col gap-12 p-12">
      <AnalyticsD3setDashboard baseUrl={lagoAnalyticsUrl} routes={ROUTES} />
    </div>
  )
}

export default AnalyticsD3setPreview
