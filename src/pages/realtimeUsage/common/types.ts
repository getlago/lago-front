import { Series } from '~/components/realtimeUsage/types'
import { RealtimeUsageTimeGranularityEnum } from '~/generated/graphql'

export type DimensionSeries = Series & { dimensionKey: string }

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
