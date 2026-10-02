import type { CurrencyMappingItem, MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'

export type NetsuiteAdditionalMappingsProps = {
  integrationId: string
}

export type NetsuiteAdditionalMappingDrawerProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  itemId?: string | undefined
  mappings?: Array<CurrencyMappingItem>
}
