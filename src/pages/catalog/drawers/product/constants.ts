export const PRODUCT_ITEM_FORM_ID = 'product-item-drawer-form'

export const PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID = 'product-item-drawer-submit'

export type ProductFormValues = {
  name: string
  code: string
  description: string
  invoiceDisplayName: string
  // Empty string or undefined = "no productCategory" (standalone item); omitted from
  // the create input either way.
  productCategoryId?: string
  // '' | 'fixed' | 'metered' - drives the metered-only reveal of the billable metric.
  productType: string
  billableMetricId: string
}

export const PRODUCT_ITEM_FORM_DEFAULTS: ProductFormValues = {
  name: '',
  code: '',
  description: '',
  invoiceDisplayName: '',
  productCategoryId: '',
  productType: '',
  billableMetricId: '',
}
