import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import {
  CatalogPlanDetailsTabsOptionsEnum,
  CatalogPlanOverviewSectionsEnum,
} from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CATALOG_PLAN_OVERVIEW_NAV_TEST_ID = 'catalog-plan-overview-nav'

type CatalogPlanOverviewNavItem = {
  section: CatalogPlanOverviewSectionsEnum
  icon: IconName
  labelKey: string
  hasCount: boolean
  count?: number
}

type CatalogPlanOverviewNavProps = {
  catalogPlanId: string
  activeSection: CatalogPlanOverviewSectionsEnum
  rateCardsCount?: number
  loading?: boolean
}

export const CatalogPlanOverviewNav = ({
  catalogPlanId,
  activeSection,
  rateCardsCount,
  loading = false,
}: CatalogPlanOverviewNavProps): JSX.Element => {
  const { translate } = useInternationalization()

  const overviewPath = generatePath(CATALOG_PLAN_DETAILS_ROUTE, {
    catalogPlanId,
    tab: CatalogPlanDetailsTabsOptionsEnum.overview,
  })

  // Static list: six Figma sections have no schema field yet (scheduled invoices,
  // commitments, credits, progressive billing, entitlements, alerts) and are added here once they do.
  const items: CatalogPlanOverviewNavItem[] = [
    {
      section: CatalogPlanOverviewSectionsEnum.planOverview,
      icon: 'file',
      labelKey: 'text_1789030049529z30uq3e7z48',
      hasCount: false,
    },
    {
      section: CatalogPlanOverviewSectionsEnum.rateCards,
      icon: 'book',
      labelKey: 'text_1783104239825nxqno33u945',
      hasCount: true,
      count: rateCardsCount,
    },
  ]

  const getItemPath = (section: CatalogPlanOverviewSectionsEnum): string => {
    if (section === CatalogPlanOverviewSectionsEnum.planOverview) return overviewPath

    return `${overviewPath}/${section}`
  }

  const renderCount = (item: CatalogPlanOverviewNavItem): JSX.Element | null => {
    if (!item.hasCount) return null
    if (loading) return <Skeleton variant="text" className="w-4" />
    if (item.count === undefined) return null

    return (
      <Typography variant="caption" color="inherit" noWrap>
        {item.count}
      </Typography>
    )
  }

  return (
    <nav
      className="flex w-58 flex-shrink-0 flex-col gap-1"
      data-test={CATALOG_PLAN_OVERVIEW_NAV_TEST_ID}
    >
      <VerticalMenu
        tabs={items.map((item) => ({
          link: getItemPath(item.section),
          title: translate(item.labelKey),
          icon: item.icon,
          active: item.section === activeSection,
          canBeClickedOnActive: true,
          extraComponent: renderCount(item) ?? undefined,
        }))}
      />
    </nav>
  )
}
