import { gql } from '@apollo/client'

gql`
  fragment AddOnForFixedChargesSection on AddOn {
    id
    name
    code
  }
`

export const FixedChargesSection = () => null

FixedChargesSection.displayName = 'FixedChargesSection'
