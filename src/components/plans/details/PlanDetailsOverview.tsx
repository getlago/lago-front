import { gql } from '@apollo/client'
import styled from 'styled-components'

import SkeletonDetailsPage from '~/components/SkeletonDetailsPage'
import { getIntervalTranslationKey } from '~/core/constants/form'
import {
  CurrencyEnum,
  EditPlanFragmentDoc,
  PlanInterval,
  useGetPlanForDetailsOverviewSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem, DetailsSectionTitle } from '~/styles/detailsPage'

import PlanDetailsChargesSection from './PlanDetailsChargesSection'
import PlanDetailsFixedFeeAccordion from './PlanDetailsFixedFeeAccordion'

gql`
  query getPlanForDetailsOverviewSection($plan: ID!) {
    plan(id: $plan) {
      ...EditPlan
    }
  }

  ${EditPlanFragmentDoc}
`

const PlanDetailsOverview = ({ planId }: { planId?: string }) => {
  const { translate } = useInternationalization()
  const { data: planResult, loading: isPlanLoading } = useGetPlanForDetailsOverviewSectionQuery({
    variables: { plan: planId as string },
    skip: !planId,
  })
  const plan = planResult?.plan

  if (!plan && isPlanLoading) {
    return <SkeletonDetailsPage />
  }

  return (
    <Container>
      <section>
        <DetailsSectionTitle variant="subhead" noWrap>
          {translate('text_642d5eb2783a2ad10d67031a')}
        </DetailsSectionTitle>
        <ContentWrapper>
          <DetailsInfoGrid>
            <DetailsInfoItem
              label={translate('text_62442e40cea25600b0b6d852')}
              value={plan?.name}
            />
            <DetailsInfoItem
              label={translate('text_642d5eb2783a2ad10d670320')}
              value={plan?.code}
            />
            <DetailsInfoItem
              label={translate('text_65201b8216455901fe273dc1')}
              value={translate(getIntervalTranslationKey[plan?.interval as PlanInterval])}
            />
            <DetailsInfoItem
              label={translate('text_632b4acf0c41206cbcb8c324')}
              value={plan?.amountCurrency}
            />
          </DetailsInfoGrid>

          {!!plan?.description && (
            <DetailsInfoItem
              label={translate('text_6388b923e514213fed58331c')}
              value={plan?.description}
            />
          )}
        </ContentWrapper>
      </section>
      <section>
        <DetailsSectionTitle variant="subhead" noWrap>
          {translate('text_642d5eb2783a2ad10d670332')}
        </DetailsSectionTitle>
        <PlanDetailsFixedFeeAccordion plan={plan} />
      </section>
      {!!plan?.charges?.length && (
        <section>
          <ChargeDetailsSectionTitle variant="subhead" noWrap>
            {translate('text_6435888d7cc86500646d8977')}
          </ChargeDetailsSectionTitle>
          <PlanDetailsChargesSection
            plan={plan}
            currency={plan.amountCurrency || CurrencyEnum.Usd}
          />
        </section>
      )}
    </Container>
  )
}

export default PlanDetailsOverview

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const ChargeDetailsSectionTitle = styled(DetailsSectionTitle)`
  margin-bottom: ${theme.spacing(6)};
`
