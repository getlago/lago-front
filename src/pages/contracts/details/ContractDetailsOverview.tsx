import { ReactNode } from 'react'
import { useParams } from 'react-router'

import { ContractOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import { CurrencyEnum } from '~/generated/graphql'

import { ContractOverviewNav } from './ContractOverviewNav'
import { ContractOverviewSection } from './ContractOverviewSection'
import { ContractRateCardsSection } from './ContractRateCardsSection'

const isOverviewSection = (value?: string): value is ContractOverviewSectionsEnum =>
  Object.values(ContractOverviewSectionsEnum).includes(value as ContractOverviewSectionsEnum)

type ContractDetailsOverviewProps = {
  contractExternalId?: string
  currency: CurrencyEnum | undefined
  rateCardsCount?: number
  loading?: boolean
  isRateCardsLocked: boolean
}

export const ContractDetailsOverview = ({
  contractExternalId,
  currency,
  rateCardsCount,
  loading = false,
  isRateCardsLocked,
}: ContractDetailsOverviewProps): JSX.Element => {
  const { id = '', section } = useParams()
  const activeSection = isOverviewSection(section)
    ? section
    : ContractOverviewSectionsEnum.contractOverview

  const renderSection = (): ReactNode => {
    if (activeSection === ContractOverviewSectionsEnum.rateCards) {
      return (
        <ContractRateCardsSection
          contractId={id}
          contractExternalId={contractExternalId}
          currency={currency}
          isLocked={isRateCardsLocked}
        />
      )
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
