export const PRODUCT_ITEM_FORM_ID = 'product-item-drawer-form'

export const PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID = 'product-item-drawer-submit'

export const PRODUCT_ITEM_FORM_DEFAULTS = {
  name: '',
  code: '',
  description: '',
  invoiceDisplayName: '',
  // Empty string = "no product" (standalone item); omitted from the create input.
  productId: '',
  // '' | 'fixed' | 'usage' — drives the usage-only reveal of the billable metric.
  itemType: '',
  billableMetricId: '',
}

export type ProductItemFormValues = typeof PRODUCT_ITEM_FORM_DEFAULTS
