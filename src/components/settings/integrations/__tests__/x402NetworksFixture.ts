import {
  X402NetworkEnvironmentEnum,
  X402NetworkFamilyEnum,
  X402NetworkFragment,
} from '~/generated/graphql'

export const X402_TEST_CATALOG: X402NetworkFragment[] = [
  {
    id: 'eip155:8453',
    name: 'Base',
    family: X402NetworkFamilyEnum.Evm,
    environment: X402NetworkEnvironmentEnum.Mainnet,
  },
  {
    id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    name: 'Solana',
    family: X402NetworkFamilyEnum.Svm,
    environment: X402NetworkEnvironmentEnum.Mainnet,
  },
  {
    id: 'eip155:84532',
    name: 'Base Sepolia',
    family: X402NetworkFamilyEnum.Evm,
    environment: X402NetworkEnvironmentEnum.Testnet,
  },
  {
    id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    name: 'Solana Devnet',
    family: X402NetworkFamilyEnum.Svm,
    environment: X402NetworkEnvironmentEnum.Testnet,
  },
]
