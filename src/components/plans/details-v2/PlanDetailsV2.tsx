import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { LagoApiError, useGetPlanForDetailsV2Query } from '~/generated/graphql'

import { PlanDetailsV2LeftSidebar } from './PlanDetailsV2LeftSidebar'
import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment PlanDetailsV2 on Plan {
    id
    name
    code
    description
    interval
    amountCurrency
    hasOverriddenPlans
  }

  query getPlanForDetailsV2($planId: ID!) {
    plan(id: $planId) {
      ...PlanDetailsV2
    }
  }
`

const PLAN_SECTION_IDS: PlanDetailsV2SectionId[] = [
  PlanDetailsV2SectionId.PlanSettings,
  PlanDetailsV2SectionId.SubscriptionFee,
  PlanDetailsV2SectionId.FixedCharges,
  PlanDetailsV2SectionId.UsageCharges,
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
  subscriptionId?: string
}

export const PlanDetailsV2 = ({ planId, isInSubscriptionForm = false }: PlanDetailsV2Props) => {
  const { data, loading } = useGetPlanForDetailsV2Query({
    variables: { planId },
    skip: !planId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const [activeSectionId, setActiveSectionId] = useState<string>(
    PlanDetailsV2SectionId.PlanSettings,
  )

  const visibleSectionIds = isInSubscriptionForm
    ? PLAN_SECTION_IDS.filter((id) => !SUB_FLOW_HIDDEN_SECTIONS.has(id))
    : PLAN_SECTION_IDS

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    if (!data?.plan) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActiveSectionId(visible.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )

    visibleSectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [data, visibleSectionIds])

  const handleItemClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading && !data?.plan) {
    return <DetailsPage.Skeleton />
  }

  if (!data?.plan) {
    return null
  }

  return (
    <div className="flex gap-8 px-12 py-8">
      <PlanDetailsV2LeftSidebar
        activeSectionId={activeSectionId}
        isInSubscriptionForm={isInSubscriptionForm}
        onItemClick={handleItemClick}
      />
      <div className="flex flex-1 flex-col gap-12">
        {visibleSectionIds.map((id) => (
          <section key={id} id={id} className="scroll-mt-12 min-h-48 rounded-xl bg-grey-100" />
        ))}
      </div>
    </div>
  )
}
