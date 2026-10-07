import {
  GetSubscriptionChargesForRealtimeUsageQuery,
  GetSubscriptionHourlyUsageQuery,
  TimezoneEnum,
} from '~/generated/graphql'

export type RealtimeUsage = GetSubscriptionHourlyUsageQuery['subscriptionHourlyUsage']
export type RealtimeUsageFilter = RealtimeUsage['filters'][number]
export type RealtimeUsageHour = RealtimeUsage['hours'][number]
export type RealtimeUsageBreakdown = RealtimeUsageHour['breakdown'][number]
export type RealtimeUsageCharge = NonNullable<
  NonNullable<GetSubscriptionChargesForRealtimeUsageQuery['subscription']>['plan']['charges']
>[number]

export type RealtimeUsageState = {
  charges: RealtimeUsageCharge[]
  selectedCharge?: RealtimeUsageCharge
  setChargeId: (chargeId: string) => void
  windowInHours: number
  changeWindow: (hours: number) => void
  autoRefreshSeconds: number
  setAutoRefreshSeconds: (seconds: number) => void
  usage?: RealtimeUsage
  isLoading: boolean
  hasError: boolean
  hasUsage: boolean
  hasRealtimeCharge: boolean
  isSwitchingScale: boolean
  timezone: TimezoneEnum
  unitLabel: string
  formatHour: (time: string) => string
}
