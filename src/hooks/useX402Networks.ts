import { gql } from '@apollo/client'

import { useGetX402NetworksQuery, X402NetworkFragment } from '~/generated/graphql'

gql`
  fragment X402Network on X402Network {
    id
    name
    family
    environment
  }

  query getX402Networks {
    x402Networks {
      ...X402Network
    }
  }
`

type UseX402Networks = (options?: { skip?: boolean }) => {
  networks: X402NetworkFragment[]
  loading: boolean
}

export const useX402Networks: UseX402Networks = ({ skip = false } = {}) => {
  const { data, loading } = useGetX402NetworksQuery({ fetchPolicy: 'cache-first', skip })

  return { networks: data?.x402Networks ?? [], loading }
}
