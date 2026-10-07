import { MockedResponse } from '@apollo/client/testing'

import {
  RealtimeUsage,
  RealtimeUsageBreakdown,
  RealtimeUsageCharge,
  RealtimeUsageFilter,
  RealtimeUsageHour,
} from '~/components/subscriptions/realtimeUsage/common/types'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  GetSubscriptionChargesForRealtimeUsageDocument,
  GetSubscriptionHourlyUsageDocument,
  TimezoneEnum,
} from '~/generated/graphql'

export const SUBSCRIPTION_ID = 'subscription-id'
export const CHARGE_ID = 'charge-id'
export const EU_FILTER_ID = 'filter-eu'
export const US_FILTER_ID = 'filter-us'

export const NOW = '2026-08-24T11:30:00.000Z'
export const FROM_DATETIME_24H = '2026-08-23T12:00:00.000Z'
export const FROM_DATETIME_6H = '2026-08-24T06:00:00.000Z'

type ChargeOverrides = Partial<Omit<RealtimeUsageCharge, 'billableMetric'>> & {
  billableMetric?: Partial<RealtimeUsageCharge['billableMetric']>
}

export const buildCharge = ({
  billableMetric,
  ...overrides
}: ChargeOverrides = {}): RealtimeUsageCharge => ({
  id: CHARGE_ID,
  invoiceDisplayName: 'API calls',
  chargeModel: ChargeModelEnum.Standard,
  payInAdvance: false,
  prorated: false,
  ...overrides,
  billableMetric: {
    id: 'bm-id',
    code: 'count_bm',
    name: 'Count BM',
    aggregationType: AggregationTypeEnum.CountAgg,
    recurring: false,
    expression: null,
    ...billableMetric,
  },
})

export const buildChargesMock = (
  charges: RealtimeUsageCharge[] = [buildCharge()],
  timezone: TimezoneEnum = TimezoneEnum.TzUtc,
): MockedResponse => ({
  request: {
    query: GetSubscriptionChargesForRealtimeUsageDocument,
    variables: { subscriptionId: SUBSCRIPTION_ID },
  },
  result: {
    data: {
      subscription: {
        id: SUBSCRIPTION_ID,
        customer: { id: 'customer-id', applicableTimezone: timezone },
        plan: { id: 'plan-id', charges },
      },
    },
  },
})

type FilterInput = Pick<RealtimeUsageFilter, 'chargeFilterId' | 'units'> &
  Partial<RealtimeUsageFilter>
type BreakdownInput = Pick<RealtimeUsageBreakdown, 'chargeFilterId' | 'units'> &
  Partial<RealtimeUsageBreakdown>
type HourInput = Pick<RealtimeUsageHour, 'time' | 'units'> & { breakdown: BreakdownInput[] }

export const buildFilter = (filter: FilterInput): RealtimeUsageFilter => ({
  invoiceDisplayName: null,
  values: {},
  other: false,
  eventsCount: filter.units,
  ...filter,
})

export const buildHour = ({ breakdown, ...hour }: HourInput): RealtimeUsageHour => ({
  eventsCount: hour.units,
  ...hour,
  breakdown: breakdown.map((item) => ({ other: false, ...item })),
})

export const buildHourlyUsage = (filters: FilterInput[], hours: HourInput[]): RealtimeUsage => ({
  fromDatetime: '2026-08-24T09:00:00Z',
  toDatetime: '2026-08-24T11:30:00Z',
  timezone: TimezoneEnum.TzUtc,
  aggregationType: AggregationTypeEnum.CountAgg,
  filters: filters.map(buildFilter),
  hours: hours.map(buildHour),
})

type HourlyUsageMockOptions = {
  filters: FilterInput[]
  hours: HourInput[]
  chargeId?: string
  fromDatetime?: string
}

// Without `fromDatetime` the mock answers any window of the charge, for tests
// that do not care which one was requested.
export const buildHourlyUsageMock = ({
  filters,
  hours,
  chargeId = CHARGE_ID,
  fromDatetime,
}: HourlyUsageMockOptions): MockedResponse => {
  const result = { data: { subscriptionHourlyUsage: buildHourlyUsage(filters, hours) } }

  if (fromDatetime) {
    return {
      request: {
        query: GetSubscriptionHourlyUsageDocument,
        variables: { subscriptionId: SUBSCRIPTION_ID, chargeId, fromDatetime },
      },
      maxUsageCount: Number.POSITIVE_INFINITY,
      result,
    }
  }

  return {
    request: { query: GetSubscriptionHourlyUsageDocument },
    variableMatcher: (variables) => variables.chargeId === chargeId,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result,
  }
}

export const buildHourlyUsageErrorMock = ({
  chargeId = CHARGE_ID,
  fromDatetime,
}: { chargeId?: string; fromDatetime?: string } = {}): MockedResponse => ({
  request: { query: GetSubscriptionHourlyUsageDocument },
  variableMatcher: (variables) =>
    variables.chargeId === chargeId && (!fromDatetime || variables.fromDatetime === fromDatetime),
  error: new Error('usage_buckets_read_failure'),
})

export const buildChargesErrorMock = (): MockedResponse => ({
  request: {
    query: GetSubscriptionChargesForRealtimeUsageDocument,
    variables: { subscriptionId: SUBSCRIPTION_ID },
  },
  error: new Error('internal_error'),
})
