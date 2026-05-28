export interface AddOnItem {
  addOnId: string
  name: string
  code: string
  units: string
  unitAmountCents: string
  fromDatetime: string
  toDatetime: string
}

export const pricingDrawerDefaultValues = {
  planId: '',
  addOnItems: [] as AddOnItem[],
}

export type PricingDrawerFormValues = typeof pricingDrawerDefaultValues
