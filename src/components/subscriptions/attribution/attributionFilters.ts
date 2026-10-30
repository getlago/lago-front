import { ApolloError } from '@apollo/client'
import { DateTime, DurationLike } from 'luxon'

import {
  isValidDateRangeValue,
  keyWithPrefix,
  unescapeFilterLabel,
} from '~/components/Filters/graphql/utils'
import { DynamicFilterKey } from '~/components/Filters/presentation/types'
import { getTimezoneConfig } from '~/core/timezone'
import { AttributedUsageFilterInput, PlanInterval, TimezoneEnum } from '~/generated/graphql'

export const ATTRIBUTION_FILTERS_PREFIX = 'attribution'
export const ATTRIBUTION_TIME_RANGE_FILTER_KEY: DynamicFilterKey = 'dynamic.timeRange'

export enum AttributionTimeRangeEnum {
  current = 'current',
  past = 'past',
  custom = 'custom',
}

type AttributionTimeRangeArgs = {
  fromDatetime?: string
  toDatetime?: string
}

export type AttributionSubscriptionPeriod = {
  startedAt?: string | null
  currentBillingPeriodStartedAt?: string | null
  plan: { interval?: PlanInterval | null }
  customer?: { applicableTimezone?: TimezoneEnum | null } | null
}

export const MAX_TIME_RANGE_DAYS = 31

const ATTRIBUTION_GUARD_ERROR_CODES = ['too_many_groups', 'query_timeout', 'memory_limit_exceeded']

const PLAN_INTERVAL_DURATION: Record<PlanInterval, DurationLike> = {
  [PlanInterval.Weekly]: { weeks: 1 },
  [PlanInterval.Monthly]: { months: 1 },
  [PlanInterval.Quarterly]: { months: 3 },
  [PlanInterval.Semiannual]: { months: 6 },
  [PlanInterval.Yearly]: { years: 1 },
}

export const getAttributionEntityFilterKey = (code: string): DynamicFilterKey =>
  `dynamic.entity.${code}`

export const getAttributionTimeRangeType = (value?: string | null): AttributionTimeRangeEnum => {
  if (value === AttributionTimeRangeEnum.past) return AttributionTimeRangeEnum.past
  if (value?.includes(',')) return AttributionTimeRangeEnum.custom

  return AttributionTimeRangeEnum.current
}

const isTimeRangeWithinLimit = (from: DateTime, to: DateTime): boolean =>
  to.diff(from).as('days') <= MAX_TIME_RANGE_DAYS

export const isAttributionTimeRangeValid = (value?: string | null): boolean => {
  if (getAttributionTimeRangeType(value) !== AttributionTimeRangeEnum.custom) return true
  if (!value || !isValidDateRangeValue(value)) return false

  const [from, to] = value.split(',')

  return isTimeRangeWithinLimit(DateTime.fromISO(from), DateTime.fromISO(to))
}

const getPastPeriodArgs = (
  subscription?: AttributionSubscriptionPeriod | null,
): AttributionTimeRangeArgs | null => {
  const interval = subscription?.plan.interval

  if (!subscription?.currentBillingPeriodStartedAt || !interval) return null

  // The backend anchors billing periods to the customer's applicable timezone, so subtracting
  // an interval in UTC lands an hour off across a DST transition.
  const zone = getTimezoneConfig(subscription.customer?.applicableTimezone).name
  const periodStart = DateTime.fromISO(subscription.currentBillingPeriodStartedAt, { zone })
  const startedAt = subscription.startedAt
    ? DateTime.fromISO(subscription.startedAt, { zone })
    : null

  if (!periodStart.isValid || (startedAt && periodStart <= startedAt)) return null

  const to = periodStart.minus({ seconds: 1 })
  const periodFrom = periodStart.minus(PLAN_INTERVAL_DURATION[interval])
  const from = isTimeRangeWithinLimit(periodFrom, to)
    ? periodFrom
    : to.minus({ days: MAX_TIME_RANGE_DAYS })

  return {
    fromDatetime: from.toUTC().toISO() ?? undefined,
    toDatetime: to.toUTC().toISO() ?? undefined,
  }
}

export const hasAttributionPastPeriod = (
  subscription?: AttributionSubscriptionPeriod | null,
): boolean => !!getPastPeriodArgs(subscription)

export const getAttributionTimeRangeArgs = ({
  value,
  subscription,
}: {
  value?: string | null
  subscription?: AttributionSubscriptionPeriod | null
}): AttributionTimeRangeArgs => {
  const type = getAttributionTimeRangeType(value)

  if (type === AttributionTimeRangeEnum.past) return getPastPeriodArgs(subscription) ?? {}
  if (type !== AttributionTimeRangeEnum.custom || !value || !isAttributionTimeRangeValid(value)) {
    return {}
  }

  const [fromDatetime, toDatetime] = value.split(',')

  return { fromDatetime, toDatetime }
}

export const getAttributionTimeRangeValue = (searchParams: URLSearchParams): string | null =>
  searchParams.get(keyWithPrefix(ATTRIBUTION_TIME_RANGE_FILTER_KEY, ATTRIBUTION_FILTERS_PREFIX))

export const splitAttributionFilterValues = (value?: string | null): string[] =>
  (value ?? '')
    .split(',')
    .filter((entry) => !!entry)
    .map(unescapeFilterLabel)

export const getAttributionEntityFilters = ({
  searchParams,
  codes,
}: {
  searchParams: URLSearchParams
  codes: string[]
}): AttributedUsageFilterInput[] =>
  codes.flatMap((code) => {
    const values = splitAttributionFilterValues(
      searchParams.get(
        keyWithPrefix(getAttributionEntityFilterKey(code), ATTRIBUTION_FILTERS_PREFIX),
      ),
    )

    return values.length ? [{ code, values }] : []
  })

export const isAttributionGuardError = (error: unknown): boolean =>
  error instanceof ApolloError &&
  error.graphQLErrors.some(({ extensions }) =>
    ATTRIBUTION_GUARD_ERROR_CODES.includes(String(extensions?.code)),
  )
