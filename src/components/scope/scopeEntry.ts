export type ScopeEntryFormValues = {
  type?: string
  productCode?: string
  productFilterCode?: string
  withProductFilters: boolean
  isFilterAdded?: boolean
}

export const EMPTY_SCOPE_ENTRY: ScopeEntryFormValues = {
  type: '',
  productCode: '',
  productFilterCode: '',
  withProductFilters: false,
  isFilterAdded: false,
}
