import {
  X402NetworkEnvironmentEnum,
  X402NetworkFamilyEnum,
  X402NetworkFragment,
  X402SettlementKindEnum,
} from '~/generated/graphql'

export const X402_ENVIRONMENT_TRANSLATIONS: Record<X402NetworkEnvironmentEnum, string> = {
  [X402NetworkEnvironmentEnum.Testnet]: 'text_1793132394869vkrr831kjd7',
  [X402NetworkEnvironmentEnum.Mainnet]: 'text_1793132394869qwdol6ok2cm',
}

export const X402_SETTLEMENT_KIND_TRANSLATIONS: Record<X402SettlementKindEnum, string> = {
  [X402SettlementKindEnum.CreditPurchase]: 'text_1793137178565p638pj01m11',
  [X402SettlementKindEnum.InvoicePayment]: 'text_1793137178565lnwwik8dvve',
}

export const MAX_ALLOWED_ORIGINS = 10

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']
const ORIGIN_REGEX =
  /^(https?):\/\/(\[[0-9a-f:.]+\]|[a-z0-9-]+(?:\.[a-z0-9-]+)*)(?::(\d{1,5}))?\/?$/i

export const getX402Network = (
  id: string,
  catalog: X402NetworkFragment[],
): X402NetworkFragment | undefined => catalog.find((network) => network.id === id)

export const getX402NetworkName = (id: string, catalog: X402NetworkFragment[]): string =>
  getX402Network(id, catalog)?.name || id

export const getX402Environment = (
  networks: string[],
  catalog: X402NetworkFragment[],
): X402NetworkEnvironmentEnum | undefined =>
  networks.map((id) => getX402Network(id, catalog)).find((network) => !!network)?.environment

const CAIP_NAMESPACE_FAMILIES: Record<string, X402NetworkFamilyEnum> = {
  eip155: X402NetworkFamilyEnum.Evm,
  solana: X402NetworkFamilyEnum.Svm,
}

// The CAIP-2 namespace names the family, so the form needs no catalog to validate payouts.
export const getX402Family = (id: string): X402NetworkFamilyEnum | undefined =>
  CAIP_NAMESPACE_FAMILIES[id.split(':')[0]]

export const getX402Families = (networks: string[]): X402NetworkFamilyEnum[] =>
  Array.from(
    new Set(
      networks.map(getX402Family).filter((family): family is X402NetworkFamilyEnum => !!family),
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
