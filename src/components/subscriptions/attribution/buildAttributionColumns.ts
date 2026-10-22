import { composeChargeFilterDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  ChargeModelEnum,
} from '~/generated/graphql'

export const COLLAPSED_FILTER_COLUMNS = 3

export enum AttributionGroupByEnum {
  hierarchical = 'hierarchical',
  flat = 'flat',
}

export type AttributionColumn = {
  key: string
  chargeId: string
  chargeFilterId: string | null
  label: string | null
}

type AttributionColumnsResult = {
  columns: AttributionColumn[]
  hiddenColumnsCount: number
}

type AttributionCharge = AttributionChargeUsageFragment['charge']

type AttributionUsageValue = {
  units: number
  amountCents: string | null
}

export const getAttributionChargeLabel = (charge: AttributionCharge): string =>
  charge.invoiceDisplayName || charge.billableMetric.name

export const isAttributionAmountAvailable = (charges: AttributionCharge[]): boolean =>
  charges.some((charge) => charge.chargeModel === ChargeModelEnum.Standard)

export const buildAttributionColumns = ({
  chargesUsage,
  selectedChargeId,
  isExpanded,
}: {
  chargesUsage: AttributionChargeUsageFragment[]
  selectedChargeId: string | null
  isExpanded: boolean
}): AttributionColumnsResult => {
  if (!selectedChargeId) return { columns: [], hiddenColumnsCount: 0 }

  const columns = chargesUsage
    .filter(({ charge }) => charge.id === selectedChargeId)
    .map(({ charge, chargeFilter }) => ({
      key: `${charge.id}-${chargeFilter?.id ?? 'default'}`,
      chargeId: charge.id,
      chargeFilterId: chargeFilter?.id ?? null,
      label: chargeFilter ? composeChargeFilterDisplayName(chargeFilter) : null,
    }))

  const filterColumns = columns.filter(({ chargeFilterId }) => !!chargeFilterId)

  if (isExpanded || filterColumns.length <= COLLAPSED_FILTER_COLUMNS) {
    return { columns, hiddenColumnsCount: 0 }
  }

  const defaultColumns = columns.filter(({ chargeFilterId }) => !chargeFilterId)

  return {
    columns: [...filterColumns.slice(0, COLLAPSED_FILTER_COLUMNS), ...defaultColumns],
    hiddenColumnsCount: filterColumns.length - COLLAPSED_FILTER_COLUMNS,
  }
}

export const getAttributionCellUsage = (
  chargesUsage: AttributionChargeUsageFragment[],
  column: AttributionColumn,
): AttributionUsageValue | null => {
  const usage = chargesUsage.find(
    ({ charge, chargeFilter }) =>
      charge.id === column.chargeId && (chargeFilter?.id ?? null) === column.chargeFilterId,
  )

  if (!usage) return null

  return { units: usage.units, amountCents: usage.amountCents ?? null }
}

export const getAttributionTotalUsage = ({
  chargesUsage,
  amountCents,
}: {
  chargesUsage: AttributionChargeUsageFragment[]
  amountCents?: string | null
}): AttributionUsageValue => ({
  units: chargesUsage.reduce((total, usage) => total + usage.units, 0),
  amountCents: amountCents ?? null,
})

export const getAttributionDisplayedValue = ({
  basis,
  usage,
}: {
  basis: AttributedUsageBasisEnum
  usage: AttributionUsageValue | null
}): number | null => {
  if (!usage) return null

  const value = basis === AttributedUsageBasisEnum.Amount ? Number(usage.amountCents) : usage.units

  if (!value || Number.isNaN(value)) return null

  return value
}
