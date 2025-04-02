import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { getIntervalTranslationKey } from '~/core/constants/form'
import {
  CurrencyEnum,
  EditPlanFragmentDoc,
  PlanInterval,
  useGetPlanForDetailsOverviewSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanDetailsAdvancedSettingsSection } from './PlanDetailsAdvancedSettingsSection'
import { PlanDetailsChargesSection } from './PlanDetailsChargesSection'
import { PlanDetailsFixedFeeAccordion } from './PlanDetailsFixedFeeAccordion'

gql`
  query getPlanForDetailsOverviewSection($plan: ID!) {
    plan(id: $plan) {
      ...EditPlan
    }
  }

  ${EditPlanFragmentDoc}
`

export const PlanDetailsOverview = ({ planId }: { planId?: string }) => {
  const { translate } = useInternationalization()
  const { data: planResult, loading: isPlanLoading } = useGetPlanForDetailsOverviewSectionQuery({
    variables: { plan: planId as string },
    skip: !planId,
  })
  const plan = planResult?.plan

  if (!plan && isPlanLoading) {
    return <DetailsPage.Skeleton />
  }

  return (
    <section className="flex flex-col gap-12">
      <section>
        <DetailsPage.SectionTitle variant="subhead" noWrap>
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
        <DetailsPage.SectionTitle variant="subhead" noWrap>
          {translate('text_642d5eb2783a2ad10d670332')}
        </DetailsPage.SectionTitle>
        <PlanDetailsFixedFeeAccordion plan={plan} />
      </section>
      {!!plan?.charges?.length && (
        <section>
          <DetailsPage.SectionTitle variant="subhead" noWrap>
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
      />
    </section>
  )
}
