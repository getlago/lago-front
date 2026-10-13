import { createContext, ReactNode, useContext } from 'react'

import { AttributedUsageBasisEnum, CurrencyEnum } from '~/generated/graphql'

import { AttributionType, ColumnGroup, ScopeFilter } from './utils'

export type AttributedUsageView = {
  subscriptionId: string
  customerName: string
  currency: CurrencyEnum
  basis: AttributedUsageBasisEnum
  fromDatetime?: string
  toDatetime?: string
  chargeIds: string[]
  splitChargeId?: string
  flatFilters: ScopeFilter[]
  listBy?: AttributionType
  columnGroups: ColumnGroup[]
  childTypeOf: (type: AttributionType) => AttributionType | undefined
}

const AttributedUsageViewContext = createContext<AttributedUsageView | undefined>(undefined)

export const AttributedUsageViewProvider = ({
  value,
  children,
}: {
  value: AttributedUsageView
  children: ReactNode
}): JSX.Element => (
  <AttributedUsageViewContext.Provider value={value}>
    {children}
  </AttributedUsageViewContext.Provider>
)

export const useAttributedUsageView = (): AttributedUsageView => {
  const context = useContext(AttributedUsageViewContext)

  if (!context) throw new Error('useAttributedUsageView must be used within its provider')

  return context
}

// The query variables shared by every level of the view; a level adds its groupBy, scope and page.
export const useLevelVariables = ({
  groupBy,
  scope,
  page,
  limit,
  searchTerm,
}: {
  groupBy: string
  scope: ScopeFilter[]
  page: number
  limit: number
  searchTerm?: string
}): {
  subscriptionId: string
  groupBy: string
  filters: ScopeFilter[]
  basis: AttributedUsageBasisEnum
  fromDatetime?: string
  toDatetime?: string
  chargeIds: string[]
  splitChargeId?: string
  page: number
  limit: number
  searchTerm?: string
} => {
  const view = useAttributedUsageView()

  return {
    subscriptionId: view.subscriptionId,
    groupBy,
    filters: [...scope, ...view.flatFilters],
    basis: view.basis,
    fromDatetime: view.fromDatetime,
    toDatetime: view.toDatetime,
    chargeIds: view.chargeIds,
    splitChargeId: view.splitChargeId,
    page,
    limit,
    searchTerm: searchTerm || undefined,
  }
}
