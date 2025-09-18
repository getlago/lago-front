import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { getIntervalTranslationKey } from '~/core/constants/form'
import {
  CurrencyEnum,
  EditPlanFragmentDoc,
  LagoApiError,
  PlanInterval,
  useGetPlanForDetailsOverviewSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanDetailsSubscriptionFeeAccordion } from './PlanDetailsAdvancedFeeAccordion'
import { PlanDetailsAdvancedSettingsSection } from './PlanDetailsAdvancedSettingsSection'
import { PlanDetailsChargesSection } from './PlanDetailsChargesSection'

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
}: {
  planId?: string
  showEntitlementSection?: boolean
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
        <div className="flex flex-col gap-4">
          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_62442e40cea25600b0b6d852'),
                value: plan?.name,
              },
              {
                label: translate('text_642d5eb2783a2ad10d670320'),
                value: plan?.code,
              },
              {
                label: translate('text_65201b8216455901fe273dc1'),
                value: translate(getIntervalTranslationKey[plan?.interval as PlanInterval]),
              },
              {
                label: translate('text_632b4acf0c41206cbcb8c324'),
                value: plan?.amountCurrency,
              },
            ]}
          />

          {!!plan?.description && (
            <DetailsPage.InfoGridItem
              label={translate('text_6388b923e514213fed58331c')}
              value={plan?.description}
            />
          )}
        </div>
      </section>
      <section>
        <DetailsPage.SectionTitle variant="subhead1" noWrap>
          {translate('text_642d5eb2783a2ad10d670332')}
        </DetailsPage.SectionTitle>
        <PlanDetailsSubscriptionFeeAccordion plan={plan} />
      </section>
      {!!plan?.charges?.length && (
        <section>
          <DetailsPage.SectionTitle variant="subhead1" noWrap>
            {translate('text_6435888d7cc86500646d8977')}
          </DetailsPage.SectionTitle>
          <PlanDetailsChargesSection
            plan={plan}
            currency={plan?.amountCurrency || CurrencyEnum.Usd}
          />
        </section>
      )}

      <PlanDetailsAdvancedSettingsSection
        plan={plan}
        currency={plan?.amountCurrency || CurrencyEnum.Usd}
        showEntitlementSection={showEntitlementSection}
      />
    </section>
  )
}
