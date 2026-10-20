import { gql } from '@apollo/client'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { PLAN_PRICING_ROUTE } from '~/core/router'
import {
  PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  ProductForAppliedRateCardDrawerFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ThinkingImage from '~/public/images/maneki/thinking.svg'

gql`
  fragment PlanAppliedRateCardForDetails on PlanAppliedRateCard {
    id
    units
    catalogPlan {
      id
      name
      attachedToContracts
    }
    ...PlanAppliedRateCardForAppliedRateCardsTable
    product {
      id
      ...ProductForAppliedRateCardDrawer
    }
    rateCard {
      id
      ...RateCardForAppliedRateCardDrawer
    }
    ratePhases {
      id
      ...RatePhaseForDrawer
    }
  }

  query getPlanAppliedRateCardForDetails($appliedRateCardId: ID!) {
    planAppliedRateCard(id: $appliedRateCardId) {
      id
      ...PlanAppliedRateCardForDetails
    }
  }

  ${PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc}
  ${ProductForAppliedRateCardDrawerFragmentDoc}
  ${RateCardForAppliedRateCardDrawerFragmentDoc}
  ${RatePhaseForDrawerFragmentDoc}
`

const CatalogPlanRateCardDetails = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          { label: translate('text_62442e40cea25600b0b6d85a'), path: PLAN_PRICING_ROUTE },
          { label: translate('text_17902866782060xpq8p9bh3a') },
        ]}
        entity={{ viewName: translate('text_17902866782060xpq8p9bh3a') }}
      />
      <DetailsPage.Container className="pt-6">
        <GenericPlaceholder
          title={translate('text_1790286678206zy40b7ktge5')}
          subtitle={translate('text_17902866782061brel90bgxt')}
          image={<ThinkingImage />}
        />
      </DetailsPage.Container>
    </>
  )
}

export default CatalogPlanRateCardDetails
