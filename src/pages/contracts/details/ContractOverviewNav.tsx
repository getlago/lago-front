import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router'

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
}

type ContractOverviewNavProps = {
  contractId: string
  activeSection: ContractOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
}

export const ContractOverviewNav = ({
  contractId,
  activeSection,
  rateCardsCount,
  loading = false,
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
    },
  ]

  const renderCount = (item: ContractOverviewNavItem): JSX.Element | undefined => {
    if (item.section !== ContractOverviewSectionsEnum.rateCards) return undefined
    if (loading) return <Skeleton variant="text" className="w-4" />
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
