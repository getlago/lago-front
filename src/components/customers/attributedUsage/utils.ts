import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  AggregationTypeEnum,
  AttributedUsageBasisEnum,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
  UsageAttributionTypeRoleEnum,
} from '~/generated/graphql'

// Limits enforced by the read endpoint, mirrored here so the UI blocks a request before it fails.
export const LEVEL_PAGE_SIZE = 50
export const FLAT_PAGE_SIZE = 5
export const SEARCH_RESULTS_SIZE = 6
export const FILTER_VALUES_SIZE = 20
export const MAX_FLAT_FILTERS = 3
export const MAX_FILTER_VALUES = 20
export const MAX_SPLIT_FILTERS = 10
export const MAX_SELECTED_CHARGES = 5
export const MAX_CUSTOM_WINDOW_DAYS = 31

export const QUERY_LIMIT_ERROR_CODES = ['too_many_groups', 'query_timeout', 'memory_limit_exceeded']

const SUPPORTED_AGGREGATIONS = [AggregationTypeEnum.CountAgg, AggregationTypeEnum.SumAgg]

export type AttributionType = {
  id: string
  code: string
  name?: string | null
  role: UsageAttributionTypeRoleEnum
  parent?: { id: string } | null
}

export type PlanCharge = {
  id: string
  invoiceDisplayName?: string | null
  chargeModel: ChargeModelEnum
  billableMetric: {
    id: string
    name: string
    code: string
    aggregationType: AggregationTypeEnum
    recurring: boolean
  }
  filters?: Array<{ id: string; invoiceDisplayName?: string | null; values: unknown }> | null
}

export type ScopeFilter = { code: string; values: string[] }

export type CellData = {
  charge: { id: string }
  chargeFilter?: { id: string } | null
  units: number
  preciseAmountCents?: number | null
  eventsCount: number
}

export type AggregateData = {
  preciseAmountCents?: number | null
  eventsCount: number
  chargesUsage: CellData[]
}

export type Column = {
  key: string
  label: string
  isDefault: boolean
}

export type ColumnGroup = {
  charge: PlanCharge
  label: string
  split: boolean
  canSplit: boolean
  splitBlockedReason?: string
  unitsOnly: boolean
  columns: Column[]
}

export const typeLabel = (type: Pick<AttributionType, 'code' | 'name'>) => type.name || type.code

export const chargeLabel = (charge: PlanCharge) =>
  charge.invoiceDisplayName || charge.billableMetric.name

export const isAttributableCharge = (charge: PlanCharge) =>
  SUPPORTED_AGGREGATIONS.includes(charge.billableMetric.aggregationType) &&
  !charge.billableMetric.recurring

export const isPricedCharge = (charge: PlanCharge) =>
  charge.chargeModel === ChargeModelEnum.Standard

export const aggregationLabel = (aggregationType: AggregationTypeEnum) =>
  ({
    [AggregationTypeEnum.CountAgg]: 'Count',
    [AggregationTypeEnum.SumAgg]: 'Sum',
    [AggregationTypeEnum.MaxAgg]: 'Max',
    [AggregationTypeEnum.UniqueCountAgg]: 'Unique count',
    [AggregationTypeEnum.WeightedSumAgg]: 'Weighted sum',
    [AggregationTypeEnum.LatestAgg]: 'Latest',
    [AggregationTypeEnum.CustomAgg]: 'Custom',
  })[aggregationType]

export const chargeModelLabel = (chargeModel: ChargeModelEnum) =>
  chargeModel.charAt(0).toUpperCase() + chargeModel.slice(1).replace('_', ' ')

export const chargeMeta = (charge: PlanCharge) => {
  const parts = [
    isPricedCharge(charge) ? 'Per unit' : `${chargeModelLabel(charge.chargeModel)} · units only`,
  ]
  const filtersCount = charge.filters?.length ?? 0

  if (filtersCount) parts.push(`${filtersCount} filter${filtersCount > 1 ? 's' : ''}`)

  return parts.join(' · ')
}

const filterLabel = (filter: { invoiceDisplayName?: string | null; values: unknown }) => {
  if (filter.invoiceDisplayName) return filter.invoiceDisplayName

  const values = filter.values as Record<string, string[]> | null

  return Object.values(values ?? {})
    .flat()
    .join(', ')
}

export const cellKey = (chargeId: string, chargeFilterId?: string | null) =>
  `${chargeId}:${chargeFilterId ?? ''}`

export const buildColumnGroups = ({
  charges,
  splitChargeId,
  basis,
}: {
  charges: PlanCharge[]
  splitChargeId?: string
  basis: AttributedUsageBasisEnum
}): ColumnGroup[] =>
  charges.map((charge) => {
    const filters = charge.filters ?? []
    const split = charge.id === splitChargeId
    const tooManyFilters = filters.length > MAX_SPLIT_FILTERS

    const columns: Column[] = split
      ? [
          ...filters.map((filter) => ({
            key: cellKey(charge.id, filter.id),
            label: filterLabel(filter),
            isDefault: false,
          })),
          { key: cellKey(charge.id), label: 'Default', isDefault: true },
        ]
      : [{ key: cellKey(charge.id), label: '', isDefault: false }]

    return {
      charge,
      label: chargeLabel(charge),
      split,
      canSplit: filters.length > 0 && !tooManyFilters,
      splitBlockedReason: tooManyFilters
        ? `Split is limited to ${MAX_SPLIT_FILTERS} filters`
        : undefined,
      unitsOnly: basis === AttributedUsageBasisEnum.Amount && !isPricedCharge(charge),
      columns,
    }
  })

export const SPLIT_COLUMN_WIDTH = 96
export const CHARGE_COLUMN_WIDTH = 132
export const TOTAL_COLUMN_WIDTH = 132

export const columnWidth = (group: ColumnGroup) =>
  group.split ? SPLIT_COLUMN_WIDTH : CHARGE_COLUMN_WIDTH

export const formatAmountCents = (cents: number, currency: CurrencyEnum) =>
  intlFormatNumber(deserializeAmount(cents, currency), { currency })

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatUnits = (units: number) =>
  units >= 10_000
    ? compactFormatter.format(units)
    : intlFormatNumber(units, { style: 'decimal', maximumFractionDigits: 2 })

export const formatCount = (count: number) => count.toLocaleString('en-US')

export type CellDisplay = { value: string; title?: string; muted: boolean }

export const displayCell = ({
  cell,
  group,
  basis,
  currency,
}: {
  cell?: CellData
  group: ColumnGroup
  basis: AttributedUsageBasisEnum
  currency: CurrencyEnum
}): CellDisplay => {
  if (basis === AttributedUsageBasisEnum.Amount) {
    if (!isPricedCharge(group.charge)) {
      return { value: '—', title: 'Amount not available for this pricing model', muted: true }
    }

    const cents = cell?.preciseAmountCents ?? 0

    if (cell?.preciseAmountCents === null && cell.units > 0) {
      return { value: '—', title: 'Amount not available for this charge', muted: true }
    }

    return Math.abs(cents) < 0.5
      ? { value: '—', muted: true }
      : { value: formatAmountCents(cents, currency), muted: false }
  }

  const units = cell?.units ?? 0

  return units === 0 ? { value: '—', muted: true } : { value: formatUnits(units), muted: false }
}

export const displayTotal = ({
  aggregate,
  basis,
  currency,
}: {
  aggregate?: AggregateData
  basis: AttributedUsageBasisEnum
  currency: CurrencyEnum
}) => {
  if (!aggregate) return '—'

  if (basis === AttributedUsageBasisEnum.Amount) {
    return formatAmountCents(aggregate.preciseAmountCents ?? 0, currency)
  }

  return formatCount(aggregate.eventsCount)
}

// Units of different charges cannot be added up, so the units basis has no total column.
export const hasTotalColumn = (basis: AttributedUsageBasisEnum) =>
  basis === AttributedUsageBasisEnum.Amount

// The units of each charge, its filter cells added up.
export const chargeUnits = (columnGroups: ColumnGroup[], aggregate?: AggregateData) =>
  columnGroups.map((group) => ({
    group,
    units: (aggregate?.chargesUsage ?? [])
      .filter((cell) => cell.charge.id === group.charge.id)
      .reduce((sum, cell) => sum + cell.units, 0),
  }))

export const indexCells = (cells: CellData[] = []) =>
  new Map(cells.map((cell) => [cellKey(cell.charge.id, cell.chargeFilter?.id), cell]))

/* Period */

export enum PeriodKindEnum {
  current = 'current',
  previous = 'previous',
  custom = 'custom',
}

export type Period =
  | { kind: PeriodKindEnum.current }
  | { kind: PeriodKindEnum.previous }
  | { kind: PeriodKindEnum.custom; from: string; to: string }

export type SubscriptionPeriodInfo = {
  startedAt?: string | null
  currentBillingPeriodStartedAt?: string | null
  currentBillingPeriodEndingAt?: string | null
  plan: { interval?: PlanInterval | null }
}

const PREVIOUS_PERIOD_DURATION: Partial<Record<PlanInterval, { weeks?: number; months?: number }>> =
  {
    [PlanInterval.Weekly]: { weeks: 1 },
    [PlanInterval.Monthly]: { months: 1 },
  }

export const previousPeriodRange = (subscription?: SubscriptionPeriodInfo) => {
  const interval = subscription?.plan.interval
  const duration = interval ? PREVIOUS_PERIOD_DURATION[interval] : undefined
  const currentStart = subscription?.currentBillingPeriodStartedAt

  if (!duration || !currentStart) return undefined

  const to = DateTime.fromISO(currentStart, { zone: 'utc' })
  const from = to.minus(duration)
  const startedAt = subscription?.startedAt
    ? DateTime.fromISO(subscription.startedAt, { zone: 'utc' })
    : undefined

  if (startedAt && to <= startedAt) return undefined

  return { from, to }
}

// The window sent to the endpoint. The current period sends no boundary: the endpoint defaults to it.
export const periodDatetimes = (
  period: Period,
  subscription?: SubscriptionPeriodInfo,
): { fromDatetime?: string; toDatetime?: string } => {
  if (period.kind === PeriodKindEnum.custom) {
    return {
      fromDatetime:
        DateTime.fromISO(period.from, { zone: 'utc' }).startOf('day').toISO() ?? undefined,
      toDatetime: DateTime.fromISO(period.to, { zone: 'utc' }).endOf('day').toISO() ?? undefined,
    }
  }

  if (period.kind === PeriodKindEnum.previous) {
    const range = previousPeriodRange(subscription)

    if (range) {
      return {
        fromDatetime: range.from.toISO() ?? undefined,
        toDatetime: range.to.minus({ seconds: 1 }).toISO() ?? undefined,
      }
    }
  }

  return {}
}

export const formatRange = (from?: string | DateTime | null, to?: string | DateTime | null) => {
  if (!from || !to) return '—'

  const start = typeof from === 'string' ? DateTime.fromISO(from, { zone: 'utc' }) : from
  const end = typeof to === 'string' ? DateTime.fromISO(to, { zone: 'utc' }) : to

  return start.year === end.year
    ? `${start.toFormat('LLL d')} – ${end.toFormat('LLL d, yyyy')}`
    : `${start.toFormat('LLL d, yyyy')} – ${end.toFormat('LLL d, yyyy')}`
}

export const countDays = (from: string, to: string) =>
  Math.round(
    DateTime.fromISO(to, { zone: 'utc' }).diff(DateTime.fromISO(from, { zone: 'utc' }), 'days')
      .days,
  ) + 1

export const customRangeError = ({
  from,
  to,
  minDate,
  maxDate,
}: {
  from?: string
  to?: string
  minDate?: string
  maxDate: string
}) => {
  if (!from || !to) return 'Pick a start and an end date.'
  if (minDate && from < minDate) {
    return `Start on or after ${DateTime.fromISO(minDate).toFormat('LLL d, yyyy')}, when this subscription started.`
  }
  if (to > maxDate) return 'End on or before today.'

  const days = countDays(from, to)

  if (days < 1) return 'The end date must be after the start date.'
  if (days > MAX_CUSTOM_WINDOW_DAYS) {
    return `Ranges are limited to ${MAX_CUSTOM_WINDOW_DAYS} days. This one is ${days} days — shorten it or split it into several views.`
  }

  return undefined
}

export const getErrorCode = (error?: { graphQLErrors?: ReadonlyArray<{ extensions?: unknown }> }) =>
  (error?.graphQLErrors?.[0]?.extensions as { code?: string } | undefined)?.code

export const isQueryLimitError = (error?: {
  graphQLErrors?: ReadonlyArray<{ extensions?: unknown }>
}) => QUERY_LIMIT_ERROR_CODES.includes(getErrorCode(error) ?? '')

export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}
