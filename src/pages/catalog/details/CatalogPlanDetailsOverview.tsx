import { ReactNode } from 'react'
import { generatePath, useParams } from 'react-router'

import { useAppliedRateCardDrawer } from '~/components/appliedRateCards/drawers/appliedRateCard/useAppliedRateCardDrawer'
import {
  CatalogPlanDetailsTabsOptionsEnum,
  CatalogPlanOverviewSectionsEnum,
} from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { CurrencyEnum } from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'

import { CatalogPlanOverviewNav } from './CatalogPlanOverviewNav'
import { CatalogPlanOverviewSection } from './CatalogPlanOverviewSection'
import { CatalogPlanRateCardsSection } from './CatalogPlanRateCardsSection'

const isOverviewSection = (value?: string): value is CatalogPlanOverviewSectionsEnum =>
  Object.values(CatalogPlanOverviewSectionsEnum).includes(value as CatalogPlanOverviewSectionsEnum)

type CatalogPlanDetailsOverviewComponentProps = {
  currency: CurrencyEnum | undefined
  rateCardsCount?: number
  loading?: boolean
  isRateCardsLocked: boolean
}

export const CatalogPlanDetailsOverview = ({
  currency,
  rateCardsCount,
  loading = false,
  isRateCardsLocked,
}: CatalogPlanDetailsOverviewComponentProps): JSX.Element => {
  const { catalogPlanId = '', section } = useParams()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  // Owned here, not in CatalogPlanOverviewSection: navigating to rate-cards unmounts
  // that component, which would unregister the drawer before it opens.
  const { openDrawer: openAppliedRateCardDrawer } = useAppliedRateCardDrawer()

  // A bare `/overview` URL and an unrecognised segment both resolve to the first
  // section, so the pane is never blank.
  const activeSection = isOverviewSection(section)
    ? section
    : CatalogPlanOverviewSectionsEnum.planOverview

  const canAssignRateCard = hasPermissions(['plansUpdate']) && !isRateCardsLocked && !!currency

  const handleAssignRateCard = (): void => {
    if (!canAssignRateCard || !currency) return

    navigate(
      `${generatePath(CATALOG_PLAN_DETAILS_ROUTE, {
        catalogPlanId,
        tab: CatalogPlanDetailsTabsOptionsEnum.overview,
      })}/${CatalogPlanOverviewSectionsEnum.rateCards}`,
    )
    openAppliedRateCardDrawer({ context: 'plan', planId: catalogPlanId, currency })
  }

  const renderSection = (): ReactNode => {
    if (activeSection === CatalogPlanOverviewSectionsEnum.rateCards) {
      return (
        <CatalogPlanRateCardsSection
          catalogPlanId={catalogPlanId}
          currency={currency}
          isLocked={isRateCardsLocked}
        />
      )
    }

    return (
      <CatalogPlanOverviewSection
        onAssignRateCard={canAssignRateCard ? handleAssignRateCard : undefined}
      />
    )
  }

  return (
    <div className="flex gap-12">
      <CatalogPlanOverviewNav
        catalogPlanId={catalogPlanId}
        activeSection={activeSection}
        rateCardsCount={rateCardsCount}
        loading={loading}
      />
      <div className="min-w-0 flex-1">{renderSection()}</div>
    </div>
  )
}
