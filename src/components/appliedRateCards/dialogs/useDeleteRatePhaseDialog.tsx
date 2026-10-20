import { gql } from '@apollo/client'

gql`
  mutation destroyRatePhase($input: DestroyRatePhaseInput!) {
    destroyRatePhase(input: $input) {
      id
    }
  }

  mutation destroyContractRatePhase($input: DestroyContractRatePhaseInput!) {
    destroyContractRatePhase(input: $input) {
      id
    }
  }
`
