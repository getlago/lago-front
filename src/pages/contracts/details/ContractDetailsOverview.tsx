import { ReactNode } from 'react'
import { useParams } from 'react-router'

import { ContractOverviewSectionsEnum } from '~/core/constants/tabsOptions'

import { ContractOverviewNav } from './ContractOverviewNav'
import { ContractOverviewSection } from './ContractOverviewSection'
import { ContractRateCardsSection } from './ContractRateCardsSection'

const isOverviewSection = (value?: string): value is ContractOverviewSectionsEnum =>
  Object.values(ContractOverviewSectionsEnum).includes(value as ContractOverviewSectionsEnum)

type ContractDetailsOverviewProps = {
  rateCardsCount?: number
  loading?: boolean
  isRateCardRemovalLocked: boolean
}

export const ContractDetailsOverview = ({
  rateCardsCount,
  loading = false,
  isRateCardRemovalLocked,
}: ContractDetailsOverviewProps): JSX.Element => {
  const { id = '', section } = useParams()
  const activeSection = isOverviewSection(section)
    ? section
    : ContractOverviewSectionsEnum.contractOverview

  const renderSection = (): ReactNode => {
    if (activeSection === ContractOverviewSectionsEnum.rateCards) {
      return <ContractRateCardsSection contractId={id} isRemovalLocked={isRateCardRemovalLocked} />
    }

    return <ContractOverviewSection />
  }

  return (
    <div className="flex gap-12">
      <ContractOverviewNav
        contractId={id}
        activeSection={activeSection}
        rateCardsCount={rateCardsCount}
        loading={loading}
      />
      <div className="min-w-0 flex-1">{renderSection()}</div>
    </div>
  )
}
