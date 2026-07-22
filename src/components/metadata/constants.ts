// Server-side limits from the API's Metadata::ItemMetadata model
// (polymorphic owner: plans today, other entities later)
export const MAX_ITEM_METADATA_COUNT = 50
export const ITEM_METADATA_KEY_MAX_LENGTH = 100
export const ITEM_METADATA_VALUE_MAX_LENGTH = 255

export type ItemMetadataFormValues = {
  metadata: Array<{ key: string; value: string }>
}

export const DEFAULT_VALUES: ItemMetadataFormValues = {
  metadata: [],
}
