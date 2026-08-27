export const PRODUCT_ITEM_FORM_ID = 'product-item-drawer-form'

export const PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID = 'product-item-drawer-submit'

export const PRODUCT_ITEM_FORM_DEFAULTS = {
  name: '',
  code: '',
  description: '',
  invoiceDisplayName: '',
  // Empty string = "no productCategory" (standalone item); omitted from the create input.
  productCategoryId: '',
  // '' | 'fixed' | 'usage' — drives the usage-only reveal of the billable metric.
  productType: '',
  billableMetricId: '',
}

export type ProductFormValues = typeof PRODUCT_ITEM_FORM_DEFAULTS
