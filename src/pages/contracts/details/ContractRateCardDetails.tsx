import { gql } from '@apollo/client'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { CONTRACTS_ROUTE } from '~/core/router'
import {
  ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  ProductForAppliedRateCardDrawerFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ThinkingImage from '~/public/images/maneki/thinking.svg'

gql`
  fragment ContractAppliedRateCardForDetails on ContractAppliedRateCard {
    id
    units
    effectiveDate
    contract {
      id
      name
      status
      plan {
        id
        name
      }
    }
    ...ContractAppliedRateCardForAppliedRateCardsTable
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

  query getContractAppliedRateCardForDetails($appliedRateCardId: ID!) {
    contractAppliedRateCard(id: $appliedRateCardId) {
      id
      ...ContractAppliedRateCardForDetails
    }
  }

  ${ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc}
  ${ProductForAppliedRateCardDrawerFragmentDoc}
  ${RateCardForAppliedRateCardDrawerFragmentDoc}
  ${RatePhaseForDrawerFragmentDoc}
`

const ContractRateCardDetails = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          { label: translate('text_17894894166553ysarr965xr'), path: CONTRACTS_ROUTE },
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

export default ContractRateCardDetails
