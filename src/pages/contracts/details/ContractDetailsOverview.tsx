import { gql } from '@apollo/client'
import { ReactNode } from 'react'
import { useParams } from 'react-router'

import { Spinner } from '~/components/designSystem/Spinner'
import { ContractOverviewSectionsEnum } from '~/core/constants/tabsOptions'
import {
  CurrencyEnum,
  FeatureFlagEnum,
  useGetContractAlertsCountForOverviewNavQuery,
} from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { ContractAlertsSection } from './ContractAlertsSection'
import { ContractOverviewNav } from './ContractOverviewNav'
import { ContractOverviewSection } from './ContractOverviewSection'
import { ContractRateCardsSection } from './ContractRateCardsSection'

gql`
  query getContractAlertsCountForOverviewNav($contractId: ID!) {
    contractAlerts(contractId: $contractId, limit: 1) {
      metadata {
        totalCount
      }
    }
  }
`

const isOverviewSection = (value?: string): value is ContractOverviewSectionsEnum =>
  Object.values(ContractOverviewSectionsEnum).includes(value as ContractOverviewSectionsEnum)

type ContractDetailsOverviewProps = {
  currency: CurrencyEnum | undefined
  rateCardsCount?: number
  loading?: boolean
  isRateCardsLocked: boolean
  isAlertsReadOnly: boolean
}

export const ContractDetailsOverview = ({
  currency,
  rateCardsCount,
  loading = false,
  isRateCardsLocked,
  isAlertsReadOnly,
}: ContractDetailsOverviewProps): JSX.Element => {
  const { id = '', section } = useParams()
  const { hasFeatureFlag, organization, loading: organizationLoading } = useOrganizationInfos()
  const { isPremium } = useCurrentUser()
  const isAlertsEnabled = hasFeatureFlag(FeatureFlagEnum.ContractAlerts)

  const isAlertsSectionRequested = section === ContractOverviewSectionsEnum.alerts

  // `hasFeatureFlag` reads `organization.featureFlags`, so it is false until the
  // organization resolves: falling back now would show the overview on an alerts URL.
  const isResolvingAlertsFlag = isAlertsSectionRequested && organizationLoading && !organization

  const getActiveSection = (): ContractOverviewSectionsEnum => {
    if (!isOverviewSection(section)) return ContractOverviewSectionsEnum.contractOverview
    if (isAlertsSectionRequested && !isAlertsEnabled && !isResolvingAlertsFlag) {
      return ContractOverviewSectionsEnum.contractOverview
    }

    return section
  }

  const activeSection = getActiveSection()

  // no-cache: `contractAlerts` is keyed without page/limit, so caching this `limit: 1`
  // result would overwrite the list section's page and blank it.
  const { data: alertsCountData, loading: alertsCountLoading } =
    useGetContractAlertsCountForOverviewNavQuery({
      variables: { contractId: id },
      skip: !id || !isAlertsEnabled || !isPremium,
      fetchPolicy: 'no-cache',
    })

  const renderSection = (): ReactNode => {
    if (isResolvingAlertsFlag) return <Spinner />

    if (activeSection === ContractOverviewSectionsEnum.rateCards) {
      return (
        <ContractRateCardsSection
          contractId={id}
          currency={currency}
          isLocked={isRateCardsLocked}
        />
      )
    }

    if (activeSection === ContractOverviewSectionsEnum.alerts) {
      return <ContractAlertsSection contractId={id} isReadOnly={isAlertsReadOnly} />
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
        isAlertsEnabled={isAlertsEnabled}
        alertsCount={alertsCountData?.contractAlerts?.metadata.totalCount}
        alertsCountLoading={alertsCountLoading}
      />
      <div className="min-w-0 flex-1">{renderSection()}</div>
    </div>
  )
}
