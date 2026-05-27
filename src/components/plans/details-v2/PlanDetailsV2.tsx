import { gql } from '@apollo/client'
import { useRef } from 'react'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  LagoApiError,
  PlanForDetailsV2FixedChargesSectionFragmentDoc,
  PlanForDetailsV2PlanSettingsSectionFragmentDoc,
  useGetPlanForDetailsV2Query,
} from '~/generated/graphql'

import {
  PlanDetailsV2FixedChargesSection,
  PlanDetailsV2FixedChargesSectionRef,
} from './PlanDetailsV2FixedChargesSection'
import { PlanDetailsV2LeftSidebar } from './PlanDetailsV2LeftSidebar'
import { PlanDetailsV2PlanSettingsSection } from './PlanDetailsV2PlanSettingsSection'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment PlanDetailsV2 on Plan {
    id
    ...PlanForDetailsV2PlanSettingsSection
    ...PlanForDetailsV2FixedChargesSection
  }

  query getPlanForDetailsV2($planId: ID!) {
    plan(id: $planId) {
      ...PlanDetailsV2
    }
  }

  ${PlanForDetailsV2PlanSettingsSectionFragmentDoc}
  ${PlanForDetailsV2FixedChargesSectionFragmentDoc}
`

const TOP_LEVEL_SECTION_IDS: PlanDetailsV2SectionId[] = [
  PlanDetailsV2SectionId.PlanSettings,
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

  const fixedChargesRef = useRef<PlanDetailsV2FixedChargesSectionRef>(null)

  const advancedVisibleIds = isInSubscriptionForm
    ? ADVANCED_CHILD_SECTION_IDS.filter((id) => !SUB_FLOW_HIDDEN_SECTIONS.has(id))
    : ADVANCED_CHILD_SECTION_IDS

  const handleItemClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleAddClick = (id: PlanDetailsV2SectionId) => {
    if (id === PlanDetailsV2SectionId.FixedCharges) {
      fixedChargesRef.current?.openCreate()
    }
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
        onAddClick={handleAddClick}
      />
      <div className="flex flex-1 flex-col gap-12 py-12 not-last-child:pb-12 not-last-child:shadow-b">
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
          if (id === PlanDetailsV2SectionId.FixedCharges) {
            return (
              <PlanDetailsV2FixedChargesSection
                key={id}
                ref={fixedChargesRef}
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
