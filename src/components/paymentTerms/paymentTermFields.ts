import { gql } from '@apollo/client'

gql`
  fragment PaymentTermFields on PaymentTerm {
    termType
    days
    dayOfMonth
    monthOffset
  }
`
