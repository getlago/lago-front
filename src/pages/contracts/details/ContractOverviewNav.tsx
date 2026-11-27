import { generatePath } from 'react-router'

import { IconName } from '~/components/designSystem/Icon'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import {
  ContractDetailsTabsOptionsEnum,
  ContractOverviewSectionsEnum,
} from '~/core/constants/tabsOptions'
import { CONTRACT_DETAILS_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CONTRACT_OVERVIEW_NAV_TEST_ID = 'contract-overview-nav'

type ContractOverviewNavItem = {
  section: ContractOverviewSectionsEnum
  icon: IconName
  labelKey: string
  count?: number
  isCountLoading?: boolean
}

type ContractOverviewNavProps = {
  contractId: string
  activeSection: ContractOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
  isAlertsEnabled: boolean
  alertsCount?: number
  alertsCountLoading: boolean
}

export const ContractOverviewNav = ({
  contractId,
  activeSection,
  rateCardsCount,
  loading = false,
  isAlertsEnabled,
  alertsCount,
  alertsCountLoading,
}: ContractOverviewNavProps): JSX.Element => {
  const { translate } = useInternationalization()
  const overviewPath = generatePath(CONTRACT_DETAILS_TAB_ROUTE, {
    id: contractId,
    tab: ContractDetailsTabsOptionsEnum.overview,
  })

  const items: ContractOverviewNavItem[] = [
    {
      section: ContractOverviewSectionsEnum.contractOverview,
      icon: 'file',
      labelKey: 'text_17897233021145awow0e13vf',
    },
    {
      section: ContractOverviewSectionsEnum.rateCards,
      icon: 'book',
      labelKey: 'text_1783104239825nxqno33u945',
      count: rateCardsCount,
      isCountLoading: loading,
    },
  ]

  if (isAlertsEnabled) {
    items.push({
      section: ContractOverviewSectionsEnum.alerts,
      icon: 'bell',
      labelKey: 'text_17465238490269pahbvl3s2m',
      count: alertsCount,
      isCountLoading: alertsCountLoading,
    })
  }

  const renderCount = (item: ContractOverviewNavItem): JSX.Element | undefined => {
    if (item.isCountLoading) return <Skeleton variant="text" className="w-4" />
    if (item.count === undefined) return undefined

    return (
      <Typography variant="caption" color="inherit" noWrap>
        {item.count}
      </Typography>
    )
  }

  return (
    <nav
      className="flex w-58 flex-shrink-0 flex-col gap-1"
      data-test={CONTRACT_OVERVIEW_NAV_TEST_ID}
    >
      <VerticalMenu
        tabs={items.map((item) => ({
          link:
            item.section === ContractOverviewSectionsEnum.contractOverview
              ? overviewPath
              : `${overviewPath}/${item.section}`,
          title: translate(item.labelKey),
          icon: item.icon,
          active: item.section === activeSection,
          canBeClickedOnActive: true,
          extraComponent: renderCount(item),
        }))}
      />
    </nav>
  )
}
