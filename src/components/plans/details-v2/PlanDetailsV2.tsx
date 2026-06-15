import { gql } from '@apollo/client'
import { ReactNode, useRef } from 'react'

import { openAccordionThenScrollTo } from '~/core/utils/domUtils'
import {
  EntitlementForPlanDetailsSidebarFragmentDoc,
  FixedChargeForPlanDetailsSidebarFragmentDoc,
  LagoApiError,
  PlanForDetailsV2AdvancedSectionFragmentDoc,
  PlanForDetailsV2FixedChargesSectionFragmentDoc,
  PlanForDetailsV2PlanSettingsSectionFragmentDoc,
  PlanForDetailsV2UsageChargesSectionFragmentDoc,
  UsageChargeForPlanDetailsSidebarFragmentDoc,
  useGetPlanForDetailsV2Query,
} from '~/generated/graphql'
import { useDetailsV2ChargeMutations } from '~/hooks/plans/useDetailsV2ChargeMutations'

import { EntitlementAccordionRef } from './accordions/EntitlementAccordion'
import { PlanDetailsV2AdvancedSection } from './PlanDetailsV2AdvancedSection'
import {
  PlanDetailsV2FixedChargesSection,
  PlanDetailsV2FixedChargesSectionRef,
} from './PlanDetailsV2FixedChargesSection'
import { PlanDetailsV2LeftSidebar } from './PlanDetailsV2LeftSidebar'
import { PlanDetailsV2PlanSettingsSection } from './PlanDetailsV2PlanSettingsSection'
import { PlanDetailsV2Skeleton } from './PlanDetailsV2Skeleton'
import {
  PlanDetailsV2UsageChargesSection,
  PlanDetailsV2UsageChargesSectionRef,
} from './PlanDetailsV2UsageChargesSection'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment PlanDetailsV2 on Plan {
    id
    fixedCharges {
      ...FixedChargeForPlanDetailsSidebar
    }
    charges {
      ...UsageChargeForPlanDetailsSidebar
    }
    entitlements {
      ...EntitlementForPlanDetailsSidebar
    }
    ...PlanForDetailsV2PlanSettingsSection
    ...PlanForDetailsV2FixedChargesSection
    ...PlanForDetailsV2UsageChargesSection
    ...PlanForDetailsV2AdvancedSection
  }

  query getPlanForDetailsV2($planId: ID!) {
    plan(id: $planId) {
      ...PlanDetailsV2
    }
  }

  ${FixedChargeForPlanDetailsSidebarFragmentDoc}
  ${UsageChargeForPlanDetailsSidebarFragmentDoc}
  ${EntitlementForPlanDetailsSidebarFragmentDoc}
  ${PlanForDetailsV2PlanSettingsSectionFragmentDoc}
  ${PlanForDetailsV2FixedChargesSectionFragmentDoc}
  ${PlanForDetailsV2UsageChargesSectionFragmentDoc}
  ${PlanForDetailsV2AdvancedSectionFragmentDoc}
`

const TOP_LEVEL_SECTION_IDS: PlanDetailsV2SectionId[] = [
  PlanDetailsV2SectionId.PlanSettings,
  PlanDetailsV2SectionId.FixedCharges,
  PlanDetailsV2SectionId.UsageCharges,
]

type PlanDetailsV2Props = {
  planId: string
  isInSubscriptionForm?: boolean
  subscriptionId?: string
  banner?: ReactNode
}

export const PlanDetailsV2 = ({
  planId,
  isInSubscriptionForm = false,
  subscriptionId,
  banner,
}: PlanDetailsV2Props) => {
  const { data, loading } = useGetPlanForDetailsV2Query({
    variables: { planId },
    skip: !planId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const fixedChargesRef = useRef<PlanDetailsV2FixedChargesSectionRef>(null)
  const usageChargesRef = useRef<PlanDetailsV2UsageChargesSectionRef>(null)
  const entitlementRef = useRef<EntitlementAccordionRef>(null)

  const { usageChargeMutations, fixedChargeMutations } = useDetailsV2ChargeMutations({
    plan: data?.plan,
    subscriptionId,
  })

  // BIL-160: open the target accordion first, then scroll to + focus it.
  const handleItemClick = (id: string) => {
    openAccordionThenScrollTo(id)
  }

  const handleAddClick = (id: string) => {
    if (id === PlanDetailsV2SectionId.FixedCharges) {
      fixedChargesRef.current?.openCreate()
    }
    if (id === PlanDetailsV2SectionId.UsageCharges) {
      usageChargesRef.current?.openCreate()
    }
    if (id === PlanDetailsV2SectionId.Entitlements) {
      entitlementRef.current?.openCreate()
    }
  }

  if (loading && !data?.plan) {
    return <PlanDetailsV2Skeleton />
  }

  const plan = data?.plan

  if (!plan) {
    return null
  }

  return (
    <div className="flex gap-12">
      <PlanDetailsV2LeftSidebar
        isInSubscriptionForm={isInSubscriptionForm}
        fixedCharges={plan.fixedCharges ?? []}
        usageCharges={plan.charges ?? []}
        entitlements={plan.entitlements ?? []}
        onItemClick={handleItemClick}
        onAddClick={handleAddClick}
      />
      <div className="flex flex-1 flex-col">
        {!!banner && <div className="-ml-12">{banner}</div>}
        <div className="flex flex-col gap-12 py-12 not-last-child:pb-12 not-last-child:shadow-b">
          {TOP_LEVEL_SECTION_IDS.map((id) => {
            if (id === PlanDetailsV2SectionId.PlanSettings) {
              return (
                <PlanDetailsV2PlanSettingsSection
                  key={id}
                  plan={plan}
                  isInSubscriptionForm={isInSubscriptionForm}
                  subscriptionId={subscriptionId}
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
                  fixedChargeMutations={fixedChargeMutations}
                />
              )
            }
            if (id === PlanDetailsV2SectionId.UsageCharges) {
              return (
                <PlanDetailsV2UsageChargesSection
                  key={id}
                  ref={usageChargesRef}
                  plan={plan}
                  isInSubscriptionForm={isInSubscriptionForm}
                  chargeMutations={usageChargeMutations}
                />
              )
            }
            return (
              <section key={id} id={id} className="min-h-48 scroll-mt-12 rounded-xl bg-grey-100" />
            )
          })}
          <PlanDetailsV2AdvancedSection
            plan={plan}
            isInSubscriptionForm={isInSubscriptionForm}
            subscriptionId={subscriptionId}
            entitlementRef={entitlementRef}
          />
        </div>
      </div>
    </div>
  )
}
