import { generatePath } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTIC_TABS_ROUTE } from '~/core/router'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Mrr from '~/pages/analytics/Mrr'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
import { PageHeader } from '~/styles'

const NewAnalytics = () => {
  const { translate } = useInternationalization()
  const hasAccessToMrr = isFeatureFlagActive(FeatureFlags.FTR_NEW_ANALYTICS_MRR)

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
              generatePath(ANALYTIC_TABS_ROUTE, {
                tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
              }),
            ],
            component: <RevenueStreams />,
          },
          ...(hasAccessToMrr
            ? [
                {
                  title: translate('text_6553885df387fd0097fd738c'),
                  link: generatePath(ANALYTIC_TABS_ROUTE, {
                    tab: NewAnalyticsTabsOptionsEnum.mrr,
                  }),
                  component: <Mrr />,
                },
              ]
            : []),
        ]}
      />
    </>
  )
}

export default NewAnalytics
