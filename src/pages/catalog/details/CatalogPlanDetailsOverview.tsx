import { ReactNode } from 'react'
import { useParams } from 'react-router'

import { CatalogPlanOverviewSectionsEnum } from '~/core/constants/tabsOptions'

import { CatalogPlanOverviewNav } from './CatalogPlanOverviewNav'
import { CatalogPlanOverviewSection } from './CatalogPlanOverviewSection'
import { CatalogPlanRateCardsSection } from './CatalogPlanRateCardsSection'

const isOverviewSection = (value?: string): value is CatalogPlanOverviewSectionsEnum =>
  Object.values(CatalogPlanOverviewSectionsEnum).includes(value as CatalogPlanOverviewSectionsEnum)

type CatalogPlanDetailsOverviewComponentProps = {
  rateCardsCount?: number
  loading?: boolean
}

export const CatalogPlanDetailsOverview = ({
  rateCardsCount,
  loading = false,
}: CatalogPlanDetailsOverviewComponentProps): JSX.Element => {
  const { catalogPlanId = '', section } = useParams()

  // A bare `/overview` URL and an unrecognised segment both resolve to the first
  // section, so the pane is never blank.
  const activeSection = isOverviewSection(section)
    ? section
    : CatalogPlanOverviewSectionsEnum.planOverview

  const renderSection = (): ReactNode => {
    if (activeSection === CatalogPlanOverviewSectionsEnum.rateCards) {
      return <CatalogPlanRateCardsSection />
    }

    return <CatalogPlanOverviewSection />
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
