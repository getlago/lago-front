import { gql } from '@apollo/client'

gql`
  fragment VolumeRateTier on RateTier {
    toValue
    perUnitAmount
    flatAmount
  }
`
