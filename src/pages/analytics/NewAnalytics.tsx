import { generatePath } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTIC_TABS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
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
        ]}
      />
    </>
  )
}

export default NewAnalytics
