import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  LagoApiError,
  TaxForPlanSettingsSectionFragmentDoc,
  useGetPlanForDetailsV2Query,
} from '~/generated/graphql'

import { PlanDetailsV2LeftSidebar } from './PlanDetailsV2LeftSidebar'
import { PlanDetailsV2PlanSettingsSection } from './PlanDetailsV2PlanSettingsSection'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment PlanDetailsV2 on Plan {
    id
    name
    code
    description
    interval
    amountCurrency
    amountCents
    payInAdvance
    trialPeriod
    invoiceDisplayName
    hasOverriddenPlans
    billFixedChargesMonthly
    billChargesMonthly
    taxes {
      ...TaxForPlanSettingsSection
    }
    fixedCharges {
      id
    }
    charges {
      id
    }
  }

  query getPlanForDetailsV2($planId: ID!) {
    plan(id: $planId) {
      ...PlanDetailsV2
    }
  }

  ${TaxForPlanSettingsSectionFragmentDoc}
`

const TOP_LEVEL_SECTION_IDS: PlanDetailsV2SectionId[] = [
  PlanDetailsV2SectionId.PlanSettings,
  PlanDetailsV2SectionId.SubscriptionFee,
  PlanDetailsV2SectionId.FixedCharges,
  PlanDetailsV2SectionId.UsageCharges,
]

const ADVANCED_CHILD_SECTION_IDS: PlanDetailsV2SectionId[] = [
  PlanDetailsV2SectionId.MinimumCommitment,
  PlanDetailsV2SectionId.ProgressiveBilling,
  PlanDetailsV2SectionId.Entitlements,
]

const SUB_FLOW_HIDDEN_SECTIONS = new Set<PlanDetailsV2SectionId>([
  PlanDetailsV2SectionId.ProgressiveBilling,
  PlanDetailsV2SectionId.Entitlements,
])

type PlanDetailsV2Props = {
  planId: string
  isInSubscriptionForm?: boolean
}

export const PlanDetailsV2 = ({ planId, isInSubscriptionForm = false }: PlanDetailsV2Props) => {
  const { data, loading } = useGetPlanForDetailsV2Query({
    variables: { planId },
    skip: !planId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const advancedVisibleIds = isInSubscriptionForm
    ? ADVANCED_CHILD_SECTION_IDS.filter((id) => !SUB_FLOW_HIDDEN_SECTIONS.has(id))
    : ADVANCED_CHILD_SECTION_IDS

  const handleItemClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading && !data?.plan) {
    return <DetailsPage.Skeleton />
  }

  const plan = data?.plan

  if (!plan) {
    return null
  }

  return (
    <div className="flex gap-8 px-12">
      <PlanDetailsV2LeftSidebar
        isInSubscriptionForm={isInSubscriptionForm}
        onItemClick={handleItemClick}
      />
      <div className="flex flex-1 flex-col gap-12 py-12">
        {TOP_LEVEL_SECTION_IDS.map((id) => {
          if (id === PlanDetailsV2SectionId.PlanSettings) {
            return (
              <PlanDetailsV2PlanSettingsSection
                key={id}
                plan={plan}
                isInSubscriptionForm={isInSubscriptionForm}
              />
            )
          }
          return (
            <section key={id} id={id} className="min-h-48 scroll-mt-12 rounded-xl bg-grey-100" />
          )
        })}
        <section
          id={PlanDetailsV2SectionId.AdvancedSettings}
          className="flex scroll-mt-12 flex-col gap-12"
        >
          {advancedVisibleIds.map((id) => (
            <section key={id} id={id} className="min-h-48 scroll-mt-12 rounded-xl bg-grey-100" />
          ))}
        </section>
      </div>
    </div>
  )
}
