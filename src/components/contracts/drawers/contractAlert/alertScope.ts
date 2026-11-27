import { ProductForComboboxData } from '~/components/products/buildProductsComboboxData'
import { ContractAlertTypeEnum, ProductTypeEnum } from '~/generated/graphql'

export const PRODUCT_SCOPE_TYPE = 'product'

type ScopeFilter = { code: string; name: string; invoiceDisplayName?: string | null }

type AppliedRateCardForScope = {
  product: ProductForComboboxData & { productType: ProductTypeEnum }
  rateCard: { productFilter?: ScopeFilter | null }
}

type AlertScope = {
  product: ProductForComboboxData
  productFilters?: ScopeFilter[] | null
}

export type ContractScopeOptions = {
  products: ProductForComboboxData[]
  filtersByProduct: Record<string, ScopeFilter[]>
}

const addFilter = (
  filtersByProduct: Record<string, ScopeFilter[]>,
  productCode: string,
  filter: ScopeFilter,
): void => {
  const filters = filtersByProduct[productCode] ?? []

  if (!filters.some(({ code }) => code === filter.code)) {
    filtersByProduct[productCode] = [...filters, filter]
  }
}

export const deriveContractScopeOptions = (
  appliedRateCards: AppliedRateCardForScope[],
  ownScope?: AlertScope,
): ContractScopeOptions => {
  const products: ProductForComboboxData[] = []
  const filtersByProduct: Record<string, ScopeFilter[]> = {}

  const addProduct = (product: ProductForComboboxData): void => {
    if (!products.some(({ code }) => code === product.code)) products.push(product)
  }

  appliedRateCards.forEach(({ product, rateCard }) => {
    if (product.productType !== ProductTypeEnum.Metered) return

    addProduct(product)
    if (rateCard.productFilter) addFilter(filtersByProduct, product.code, rateCard.productFilter)
  })

  if (ownScope) {
    addProduct(ownScope.product)
    ownScope.productFilters?.forEach((productFilter) =>
      addFilter(filtersByProduct, ownScope.product.code, productFilter),
    )
  }

  return { products, filtersByProduct }
}

type ScopeKeyInput = {
  alertType: string
  productCode?: string | null
  productFilterCode?: string | null
  withProductFilters: boolean
}

export const toScopeKey = ({
  alertType,
  productCode,
  productFilterCode,
  withProductFilters,
}: ScopeKeyInput): string =>
  [alertType, productCode || 'null', productFilterCode || 'null', String(withProductFilters)].join(
    '|',
  )

type ExistingAlertScope = {
  alertType: ContractAlertTypeEnum
  scope: Array<{
    withProductFilters?: boolean | null
    product: { code: string }
    productFilters?: Array<{ code: string }> | null
  }>
}

export const getTakenScopeKeys = (alerts: ExistingAlertScope[]): Set<string> =>
  new Set(
    alerts.map(({ alertType, scope: [entry] }) =>
      toScopeKey({
        alertType,
        productCode: entry?.product.code,
        productFilterCode: entry?.productFilters?.[0]?.code,
        withProductFilters: !!entry?.withProductFilters,
      }),
    ),
  )

export const isFilterDisabled = (
  takenKeys: Set<string>,
  alertType: string,
  productCode: string,
  productFilterCode: string,
): boolean =>
  takenKeys.has(
    toScopeKey({ alertType, productCode, productFilterCode, withProductFilters: false }),
  )

export const isProductDisabled = (
  takenKeys: Set<string>,
  alertType: string,
  productCode: string,
  filterCodes: string[],
): boolean =>
  takenKeys.has(toScopeKey({ alertType, productCode, withProductFilters: false })) &&
  takenKeys.has(toScopeKey({ alertType, productCode, withProductFilters: true })) &&
  filterCodes.every((filterCode) => isFilterDisabled(takenKeys, alertType, productCode, filterCode))

export const getLockedWithProductFilters = (
  takenKeys: Set<string>,
  alertType: string,
  productCode: string,
): boolean | undefined => {
  const isProductOnlyTaken = takenKeys.has(
    toScopeKey({ alertType, productCode, withProductFilters: false }),
  )
  const isAllFiltersTaken = takenKeys.has(
    toScopeKey({ alertType, productCode, withProductFilters: true }),
  )

  if (isAllFiltersTaken) return false
  if (isProductOnlyTaken) return true

  return undefined
}

export const isWholeContractTaken = (takenKeys: Set<string>): boolean =>
  takenKeys.has(
    toScopeKey({ alertType: ContractAlertTypeEnum.UsageAmount, withProductFilters: false }),
  )
