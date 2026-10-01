import { gql } from '@apollo/client'

gql`
  fragment GraduatedRateTier on RateTier {
    toValue
    perUnitAmount
    flatAmount
  }
`
