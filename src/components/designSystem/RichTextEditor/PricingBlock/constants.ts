export interface AddOnItem {
  addOnId: string
  name: string
  code: string
  units: string
  unitAmountCents: string
}

export const pricingDrawerDefaultValues: {
  planId?: string
  addOnSelector?: string
  addOnItems: AddOnItem[]
} = {
  planId: undefined,
  addOnSelector: '',
  addOnItems: [],
}
