import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PlanDetailsFixedChargesSection } from '~/components/plans/details/PlanDetailsFixedChargesSection'
import { PlanSettingsInfo } from '~/components/plans/PlanSettingsInfo'
import {
  CurrencyEnum,
  EditPlanFragmentDoc,
  LagoApiError,
  useGetPlanForDetailsOverviewSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanDetailsSubscriptionFeeAccordion } from './PlanDetailsAdvancedFeeAccordion'
import { PlanDetailsAdvancedSettingsSection } from './PlanDetailsAdvancedSettingsSection'
import { PlanDetailsUsageChargesSection } from './PlanDetailsUsageChargesSection'

gql`
  query getPlanForDetailsOverviewSection($plan: ID!) {
    plan(id: $plan) {
      ...EditPlan
    }
  }

  ${EditPlanFragmentDoc}
`

export const PlanDetailsOverview = ({
  planId,
  showEntitlementSection = true,
  showProgressiveBillingSection = true,
}: {
  planId?: string
  showEntitlementSection?: boolean
  showProgressiveBillingSection?: boolean
}) => {
  const { translate } = useInternationalization()
  const { data: planResult, loading: isPlanLoading } = useGetPlanForDetailsOverviewSectionQuery({
    variables: { plan: planId as string },
    skip: !planId,
    context: {
      silentError: [LagoApiError.NotFound],
    },
  })

  const plan = planResult?.plan
  const currency = plan?.amountCurrency || CurrencyEnum.Usd

  if (!plan && isPlanLoading) {
    return <DetailsPage.Skeleton />
  }

  if (!plan) {
    return null
  }

  return (
    <section className="flex flex-col gap-12">
      <section>
        <DetailsPage.SectionTitle variant="subhead1" noWrap>
          {translate('text_642d5eb2783a2ad10d67031a')}
        </DetailsPage.SectionTitle>
        <PlanSettingsInfo plan={plan} />
      </section>
      <section>
        <DetailsPage.SectionTitle variant="subhead1" noWrap>
          {translate('text_642d5eb2783a2ad10d670336')}
        </DetailsPage.SectionTitle>
        <PlanDetailsSubscriptionFeeAccordion plan={plan} />
      </section>

      {!!plan?.fixedCharges?.length && (
        <section>
          <DetailsPage.SectionTitle variant="subhead1" noWrap>
            {translate('text_176072970726728iw4tc8ucl')}
          </DetailsPage.SectionTitle>
          <PlanDetailsFixedChargesSection currency={currency} plan={plan} />
        </section>
      )}

      {!!plan?.charges?.length && (
        <section>
          <DetailsPage.SectionTitle variant="subhead1" noWrap>
            {translate('text_6435888d7cc86500646d8977')}
          </DetailsPage.SectionTitle>
          <PlanDetailsUsageChargesSection currency={currency} plan={plan} />
        </section>
      )}

      <PlanDetailsAdvancedSettingsSection
        currency={currency}
        plan={plan}
        showProgressiveBillingSection={showProgressiveBillingSection}
        showEntitlementSection={showEntitlementSection}
      />
    </section>
  )
}
