import { generatePath, Outlet } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { NEW_ANALYTIC_ROUTE, NEW_ANALYTIC_TABS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Invoices from '~/pages/analytics/Invoices'
import Mrr from '~/pages/analytics/Mrr'
import PrepaidCredits from '~/pages/analytics/PrepaidCredits'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
import Usage from '~/pages/analytics/Usage'
import { PageHeader } from '~/styles'

const NewAnalytics = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_6553885df387fd0097fd7384')}
        </Typography>
      </PageHeader.Wrapper>

      <NavigationTab
        tabs={[
          {
            title: translate('text_62d175066d2dbf1d50bc937c'),
            link: generatePath(NEW_ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
            }),
            match: [
              generatePath(NEW_ANALYTIC_ROUTE),
              generatePath(NEW_ANALYTIC_TABS_ROUTE, {
                tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
              }),
            ],
            component: <RevenueStreams />,
          },
          {
            title: translate('text_6553885df387fd0097fd738c'),
            link: generatePath(NEW_ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.mrr,
            }),
            component: <Mrr />,
          },
          {
            title: translate('text_17391997655892qv3sstq46n'),
            link: generatePath(NEW_ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.usage,
            }),
            component: <Usage />,
          },
          {
            title: translate('text_637ccf8133d2c9a7d11ce6e1'),
            link: generatePath(NEW_ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.prepaidCredits,
            }),
            component: <PrepaidCredits />,
          },
          {
            title: translate('text_63ac86d797f728a87b2f9f85'),
            link: generatePath(NEW_ANALYTIC_TABS_ROUTE, {
              tab: NewAnalyticsTabsOptionsEnum.invoices,
            }),
            component: <Invoices />,
          },
        ]}
      />

      <Outlet />
    </>
  )
}

export default NewAnalytics
