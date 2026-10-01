import { gql } from '@apollo/client'

gql`
  fragment GraduatedPercentageRateTier on RatePercentageTier {
    toValue
    rate
    flatAmount
  }
`
