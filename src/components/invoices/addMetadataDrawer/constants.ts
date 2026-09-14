export const ADD_METADATA_DRAWER_FORM_ID = 'add-metadata-drawer-form'

export const MAX_METADATA_COUNT = 5
export const METADATA_VALUE_MAX_LENGTH = 255

export type InvoiceMetadataFormValues = {
  metadata: Array<{ id?: string; key: string; value: string }>
}

export const DEFAULT_VALUES: InvoiceMetadataFormValues = {
  metadata: [],
}
