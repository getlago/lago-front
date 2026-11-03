import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { envGlobalVar } from '~/core/apolloClient'
import { ANALYTICS_D3SET_ROUTE, ANALYTICS_D3SET_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AnalyticsD3setDashboard } from './AnalyticsD3setDashboard'

const ROUTES = { base: ANALYTICS_D3SET_ROUTE, tab: ANALYTICS_D3SET_TAB_ROUTE }

const AnalyticsD3set = () => {
  const { translate } = useInternationalization()
  const { lagoAnalyticsUrl } = envGlobalVar()

  return (
    <>
      <MainHeader.Configure entity={{ viewName: translate('text_6553885df387fd0097fd7384') }} />
      <FullscreenPage.Wrapper>
        <AnalyticsD3setDashboard baseUrl={lagoAnalyticsUrl} routes={ROUTES} />
      </FullscreenPage.Wrapper>
    </>
  )
}

export default AnalyticsD3set
