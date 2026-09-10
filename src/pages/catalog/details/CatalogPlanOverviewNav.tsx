import { Icon, IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import {
  CatalogPlanDetailsTabsOptionsEnum,
  CatalogPlanOverviewSectionsEnum,
} from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE, Link } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

export const CATALOG_PLAN_OVERVIEW_NAV_TEST_ID = 'catalog-plan-overview-nav'

type CatalogPlanOverviewNavItem = {
  section: CatalogPlanOverviewSectionsEnum
  icon: IconName
  labelKey: string
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
    },
    {
      section: CatalogPlanOverviewSectionsEnum.rateCards,
      icon: 'book',
      labelKey: 'text_1783104239825nxqno33u945',
      count: rateCardsCount,
    },
  ]

  const getItemPath = (section: CatalogPlanOverviewSectionsEnum): string => {
    if (section === CatalogPlanOverviewSectionsEnum.planOverview) return overviewPath

    return `${overviewPath}/${section}`
  }

  const renderCount = (count?: number): JSX.Element | null => {
    if (loading) return <Skeleton variant="text" className="w-4" />
    if (count === undefined) return null

    return (
      <Typography variant="body" color="grey600" noWrap>
        {count}
      </Typography>
    )
  }

  return (
    <nav
      className="flex w-58 flex-shrink-0 flex-col gap-1"
      data-test={CATALOG_PLAN_OVERVIEW_NAV_TEST_ID}
    >
      {items.map((item) => {
        const isActive = item.section === activeSection

        return (
          <Link
            key={item.section}
            to={getItemPath(item.section)}
            aria-current={isActive ? 'page' : undefined}
            className={tw(
              'flex items-center gap-2 rounded-lg px-3 py-1 no-underline focus-visible:ring',
              isActive ? 'bg-grey-200' : 'hover:bg-grey-100',
            )}
          >
            <Icon name={item.icon} size="small" color={isActive ? 'primary' : 'dark'} />
            <Typography
              className="flex-1"
              variant="body"
              color={isActive ? 'primary600' : 'grey600'}
              noWrap
            >
              {translate(item.labelKey)}
            </Typography>
            {renderCount(item.count)}
          </Link>
        )
      })}
    </nav>
  )
}
