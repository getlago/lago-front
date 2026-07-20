export const PRODUCT_ITEM_FILTER_FORM_ID = 'product-item-filter-drawer-form'

export const PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID = 'product-item-filter-drawer-submit'

export type ProductItemFilterFormValues = {
  name: string
  code: string
  description: string
  invoiceDisplayName: string
  // Empty string = "no product item selected"; omitted from the create input and
  // never sent on update (the attached product item is create-only).
  productItemId: string
  // The billable metric filter values that define this item filter; each entry
  // pairs a billable metric filter with one of its selectable values.
  values: Array<{ billableMetricFilterId: string; value: string }>
}

export const PRODUCT_ITEM_FILTER_FORM_DEFAULTS: ProductItemFilterFormValues = {
  name: '',
  code: '',
  description: '',
  invoiceDisplayName: '',
  productItemId: '',
  values: [],
}
