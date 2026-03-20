import { useEffect, useMemo } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTICS_V2_ROUTE, ANALYTICS_V2_TABS_ROUTE } from '~/core/router'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Invoices from '~/pages/analytics/Invoices'
import Mrr from '~/pages/analytics/Mrr'
import PrepaidCredits from '~/pages/analytics/PrepaidCredits'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
import Usage from '~/pages/analytics/Usage'

const NewAnalytics = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToUsage = hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.RevenueAnalytics)

  // Redirect to revenue-streams when URL is exactly /analytics
  // Cause we support old and new analytics routes, this is needed
  useEffect(() => {
    if (pathname === ANALYTICS_V2_ROUTE) {
      navigate(
        generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
        }),
        { replace: true },
      )
    }
  }, [pathname, navigate])

  const tabs = useMemo(
    () => [
      {
        title: translate('text_1739203651003n5f5qzxnhin'),
        link: generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
        }),
        match: [
          ANALYTICS_V2_ROUTE,
          generatePath(ANALYTICS_V2_ROUTE),
          generatePath(ANALYTICS_V2_TABS_ROUTE, {
            tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
          }),
        ],
        content: <RevenueStreams />,
      },
      {
        title: translate('text_6553885df387fd0097fd738c'),
        link: generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.mrr,
        }),
        content: <Mrr />,
      },
      {
        title: translate('text_17465414264635ktqocy7leo'),
        link: generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.usage,
        }),
        hidden: !hasAccessToUsage,
        content: <Usage />,
      },
      {
        title: translate('text_1744192691931osnm4ckcvzj'),
        link: generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.prepaidCredits,
        }),
        content: <PrepaidCredits />,
      },
      {
        title: translate('text_1745933666707rlg89cuv1i0'),
        link: generatePath(ANALYTICS_V2_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.invoices,
        }),
        content: <Invoices />,
      },
    ],
    [translate, hasAccessToUsage],
  )

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_6553885df387fd0097fd7384'),
        }}
        tabs={tabs}
      />

      {activeTabContent}
    </>
  )
}

export default NewAnalytics
