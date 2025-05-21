import { useEffect } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE } from '~/core/router'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Invoices from '~/pages/analytics/Invoices'
import Mrr from '~/pages/analytics/Mrr'
import PrepaidCredits from '~/pages/analytics/PrepaidCredits'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
import Usage from '~/pages/analytics/Usage'
import { PageHeader } from '~/styles'

const NewAnalytics = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hasAccessToUsage = isFeatureFlagActive(FeatureFlags.ANALYTICS_USAGE)

  // Redirect to revenue-streams when URL is exactly /analytics
  // Cause we support old and new analytics routes, this is needed
  useEffect(() => {
    if (pathname === ANALYTIC_ROUTE) {
      navigate(
        generatePath(ANALYTIC_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
        }),
        { replace: true },
      )
    }
  }, [pathname, navigate])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_6553885df387fd0097fd7384')}
        </Typography>
      </PageHeader.Wrapper>

      <NavigationTab
        className="px-4 md:px-12"
        tabs={[
          {
            title: translate('text_1739203651003n5f5qzxnhin'),
            link: generatePath(ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
            }),
            match: [
              ANALYTIC_ROUTE,
              generatePath(ANALYTIC_ROUTE),
              generatePath(ANALYTIC_TABS_ROUTE, {
                tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
              }),
            ],
            component: <RevenueStreams />,
          },
          {
            title: translate('text_6553885df387fd0097fd738c'),
            link: generatePath(ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.mrr,
            }),
            component: <Mrr />,
          },
          ...(hasAccessToUsage
            ? [
                {
                  title: translate('text_17465414264635ktqocy7leo'),
                  link: generatePath(ANALYTIC_TABS_ROUTE, {
                    tab: NewAnalyticsTabsOptionsEnum.usage,
                  }),
                  component: <Usage />,
                },
              ]
            : []),
          {
            title: translate('text_1744192691931osnm4ckcvzj'),
            link: generatePath(ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.prepaidCredits,
            }),
            component: <PrepaidCredits />,
          },
          {
            title: translate('text_1745933666707rlg89cuv1i0'),
            link: generatePath(ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.invoices,
            }),
            component: <Invoices />,
          },
        ]}
      />
    </>
  )
}

export default NewAnalytics
