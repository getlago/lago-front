import { RealtimeUsageTimeGranularityEnum } from '~/generated/graphql'

export type Series = { key: string; dimensionKey: string; label: string; color: string }

export type PeriodPoint = { time: string; isPartial: boolean } & Record<
  string,
  number | string | boolean
>

export type RealtimeUsageQueryFilters = {
  externalCustomerId?: string
  externalSubscriptionId?: string
  fromDatetime?: string
  toDatetime?: string
}

export type RealtimeUsageReport = {
  timeGranularity: RealtimeUsageTimeGranularityEnum
  dimensions: Array<{ key: string; name?: string | null; other: boolean }>
  points: Array<{ time: string; breakdown: Array<{ dimensionKey: string; units: number }> }>
}
