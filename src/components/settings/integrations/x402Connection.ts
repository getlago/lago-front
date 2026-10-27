import { X402SettlementKindEnum } from '~/generated/graphql'

export enum X402EnvironmentEnum {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export enum X402FamilyEnum {
  Evm = 'evm',
  Svm = 'svm',
}

type X402Network = {
  id: string
  name: string
  family: X402FamilyEnum
  environment: X402EnvironmentEnum
}

// Mirrors `X402::Network::NETWORKS` in lago-api, which refuses any other network.
export const X402_NETWORKS: X402Network[] = [
  {
    id: 'eip155:8453',
    name: 'Base',
    family: X402FamilyEnum.Evm,
    environment: X402EnvironmentEnum.Mainnet,
  },
  {
    id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    name: 'Solana',
    family: X402FamilyEnum.Svm,
    environment: X402EnvironmentEnum.Mainnet,
  },
  {
    id: 'eip155:84532',
    name: 'Base Sepolia',
    family: X402FamilyEnum.Evm,
    environment: X402EnvironmentEnum.Testnet,
  },
  {
    id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    name: 'Solana Devnet',
    family: X402FamilyEnum.Svm,
    environment: X402EnvironmentEnum.Testnet,
  },
]

export const X402_ENVIRONMENT_TRANSLATIONS: Record<X402EnvironmentEnum, string> = {
  [X402EnvironmentEnum.Testnet]: 'text_1793132394869vkrr831kjd7',
  [X402EnvironmentEnum.Mainnet]: 'text_1793132394869qwdol6ok2cm',
}

export const X402_SETTLEMENT_KIND_TRANSLATIONS: Record<X402SettlementKindEnum, string> = {
  [X402SettlementKindEnum.CreditPurchase]: 'text_1793137178565p638pj01m11',
  [X402SettlementKindEnum.InvoicePayment]: 'text_1793137178565lnwwik8dvve',
}

export const MAX_ALLOWED_ORIGINS = 10

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']
const ORIGIN_REGEX =
  /^(https?):\/\/(\[[0-9a-f:.]+\]|[a-z0-9-]+(?:\.[a-z0-9-]+)*)(?::(\d{1,5}))?\/?$/i

export const getX402Network = (id: string): X402Network | undefined =>
  X402_NETWORKS.find((network) => network.id === id)

export const getX402Environment = (networks: string[]): X402EnvironmentEnum | undefined =>
  networks.map(getX402Network).find((network) => !!network)?.environment

export const getX402Families = (networks: string[]): X402FamilyEnum[] =>
  Array.from(
    new Set(
      networks
        .map((id) => getX402Network(id)?.family)
        .filter((family): family is X402FamilyEnum => !!family),
    ),
  )

export const parseAllowedOrigins = (value: string): string[] =>
  value
    .split(/[\s,]+/)
    .map((origin) => origin.trim())
    .filter(Boolean)

// Same rule as `X402::Origin.normalize` in lago-api, so the form refuses what the API would.
export const isValidAllowedOrigin = (origin: string): boolean => {
  const match = ORIGIN_REGEX.exec(origin)

  if (!match) return false

  const [, scheme, host, port] = match

  if (port && (Number(port) < 1 || Number(port) > 65535)) return false

  return scheme.toLowerCase() === 'https' || LOOPBACK_HOSTS.includes(host.toLowerCase())
}
