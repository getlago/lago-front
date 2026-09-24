export type AppliedRateCardRow = {
  id: string
  ratePhasesCount: number
  product: {
    id: string
    name: string
    invoiceDisplayName?: string | null
    productCategory?: {
      id: string
      name: string
      invoiceDisplayName?: string | null
    } | null
  }
  rateCard: {
    id: string
    name: string
    code: string
    productFilter?: {
      id: string
      name: string
      invoiceDisplayName?: string | null
    } | null
  }
}

export const STANDALONE_GROUP_KEY = '__standalone__'
