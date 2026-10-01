import { gql } from '@apollo/client'

import {
  CustomChargeForRateFragmentDoc,
  GraduatedPercentageRateTierFragmentDoc,
  GraduatedRateTierFragmentDoc,
  PackageChargeForRateFragmentDoc,
  PercentageChargeForRateFragmentDoc,
  PricingGroupKeysForRateFragmentDoc,
  StandardChargeForRateFragmentDoc,
  VolumeRateTierFragmentDoc,
} from '~/generated/graphql'

gql`
  fragment RatePropertiesForWrapperSwitch on RateProperties {
    ...StandardChargeForRate
    ...PackageChargeForRate
    ...PercentageChargeForRate
    ...CustomChargeForRate
    ...PricingGroupKeysForRate
    graduatedRanges {
      ...GraduatedRateTier
    }
    graduatedPercentageRanges {
      ...GraduatedPercentageRateTier
    }
    volumeRanges {
      ...VolumeRateTier
    }
  }

  ${StandardChargeForRateFragmentDoc}
  ${PackageChargeForRateFragmentDoc}
  ${PercentageChargeForRateFragmentDoc}
  ${CustomChargeForRateFragmentDoc}
  ${PricingGroupKeysForRateFragmentDoc}
  ${GraduatedRateTierFragmentDoc}
  ${GraduatedPercentageRateTierFragmentDoc}
  ${VolumeRateTierFragmentDoc}
`
