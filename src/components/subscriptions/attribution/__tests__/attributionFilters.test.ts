import { ApolloError } from '@apollo/client'
import { GraphQLError } from 'graphql'

import { PlanInterval } from '~/generated/graphql'

import {
  ATTRIBUTION_FILTERS_PREFIX,
  ATTRIBUTION_TIME_RANGE_FILTER_KEY,
  AttributionSubscriptionPeriod,
  AttributionTimeRangeEnum,
  getAttributionEntityFilterKey,
  getAttributionEntityFilters,
  getAttributionTimeRangeArgs,
  getAttributionTimeRangeType,
  getAttributionTimeRangeValue,
  hasAttributionPastPeriod,
  isAttributionGuardError,
  isAttributionTimeRangeValid,
  splitAttributionFilterValues,
} from '../attributionFilters'

const subscriptionOf = (
  interval: PlanInterval | null,
  overrides: Partial<AttributionSubscriptionPeriod> = {},
): AttributionSubscriptionPeriod => ({
  startedAt: '2025-01-01T00:00:00Z',
  currentBillingPeriodStartedAt: '2026-10-01T00:00:00Z',
  plan: { interval },
  ...overrides,
})

const CUSTOM_31_DAYS = '2026-09-01T00:00:00.000Z,2026-10-02T00:00:00.000Z'

describe('attributionFilters', () => {
  describe('GIVEN a time range URL value', () => {
    describe('WHEN reading its type', () => {
      it.each([
        [null, AttributionTimeRangeEnum.current],
        ['current', AttributionTimeRangeEnum.current],
        ['unknown', AttributionTimeRangeEnum.current],
        ['past', AttributionTimeRangeEnum.past],
        [',', AttributionTimeRangeEnum.custom],
        ['2026-09-01T00:00:00Z,2026-09-10T23:59:59Z', AttributionTimeRangeEnum.custom],
      ])('THEN %p should be %p', (value, expected) => {
        expect(getAttributionTimeRangeType(value)).toBe(expected)
      })
    })

    describe('WHEN validating it', () => {
      it.each([
        ['current', true],
        ['past', true],
        [',', false],
        ['2026-09-10T00:00:00Z,2026-09-01T00:00:00Z', false],
        ['2026-09-01T00:00:00.000Z,2026-10-01T23:59:59.999Z', true],
        ['2026-09-01T00:00:00.000Z,2026-10-02T23:59:59.999Z', false],
      ])('THEN %p should be valid: %p', (value, expected) => {
        expect(isAttributionTimeRangeValid(value)).toBe(expected)
      })

      it('THEN should accept a window of exactly 31 days, like the backend', () => {
        expect(isAttributionTimeRangeValid(CUSTOM_31_DAYS)).toBe(true)
      })
    })
  })

  describe('GIVEN the current billing period', () => {
    describe('WHEN mapping it to query args', () => {
      it.each([[null], ['current']])('THEN %p should send no bounds', (value) => {
        expect(
          getAttributionTimeRangeArgs({
            value,
            subscription: subscriptionOf(PlanInterval.Monthly),
          }),
        ).toEqual({})
      })
    })
  })

  describe('GIVEN the past billing period', () => {
    describe('WHEN the plan is monthly', () => {
      it('THEN should send the previous month up to one second before the current period', () => {
        expect(
          getAttributionTimeRangeArgs({
            value: 'past',
            subscription: subscriptionOf(PlanInterval.Monthly),
          }),
        ).toEqual({
          fromDatetime: '2026-09-01T00:00:00.000Z',
          toDatetime: '2026-09-30T23:59:59.000Z',
        })
      })
    })

    describe('WHEN the plan is weekly', () => {
      it('THEN should send the previous week', () => {
        expect(
          getAttributionTimeRangeArgs({
            value: 'past',
            subscription: subscriptionOf(PlanInterval.Weekly),
          }),
        ).toEqual({
          fromDatetime: '2026-09-24T00:00:00.000Z',
          toDatetime: '2026-09-30T23:59:59.000Z',
        })
      })
    })

    describe.each([[PlanInterval.Quarterly], [PlanInterval.Semiannual], [PlanInterval.Yearly]])(
      'WHEN the plan is %s',
      (interval) => {
        it('THEN should narrow the previous period to its last 31 days', () => {
          expect(
            getAttributionTimeRangeArgs({ value: 'past', subscription: subscriptionOf(interval) }),
          ).toEqual({
            fromDatetime: '2026-08-30T23:59:59.000Z',
            toDatetime: '2026-09-30T23:59:59.000Z',
          })
        })
      },
    )

    describe('WHEN the subscription started in the current period', () => {
      const subscription = subscriptionOf(PlanInterval.Monthly, {
        startedAt: '2026-10-05T00:00:00Z',
        currentBillingPeriodStartedAt: '2026-10-05T00:00:00Z',
      })

      it('THEN should report no past period', () => {
        expect(hasAttributionPastPeriod(subscription)).toBe(false)
      })

      it('THEN should fall back to the current period args', () => {
        expect(getAttributionTimeRangeArgs({ value: 'past', subscription })).toEqual({})
      })
    })

    describe.each([
      ['no subscription', null],
      ['no interval', subscriptionOf(null)],
      [
        'no current period start',
        subscriptionOf(PlanInterval.Monthly, { currentBillingPeriodStartedAt: null }),
      ],
    ])('WHEN there is %s', (_, subscription) => {
      it('THEN should report no past period', () => {
        expect(hasAttributionPastPeriod(subscription)).toBe(false)
      })
    })

    describe('WHEN the subscription has a previous period', () => {
      it('THEN should report it', () => {
        expect(hasAttributionPastPeriod(subscriptionOf(PlanInterval.Monthly))).toBe(true)
      })
    })
  })

  describe('GIVEN a custom time range', () => {
    describe('WHEN it is valid', () => {
      it('THEN should send its bounds as-is', () => {
        expect(
          getAttributionTimeRangeArgs({
            value: '2026-09-01T00:00:00.000Z,2026-09-10T23:59:59.999Z',
            subscription: subscriptionOf(PlanInterval.Monthly),
          }),
        ).toEqual({
          fromDatetime: '2026-09-01T00:00:00.000Z',
          toDatetime: '2026-09-10T23:59:59.999Z',
        })
      })
    })

    describe.each([
      ['longer than 31 days', '2026-08-01T00:00:00.000Z,2026-10-01T23:59:59.999Z'],
      ['incomplete', '2026-08-01T00:00:00.000Z,'],
    ])('WHEN it is %s', (_, value) => {
      it('THEN should never send it and fall back to the current period', () => {
        expect(
          getAttributionTimeRangeArgs({
            value,
            subscription: subscriptionOf(PlanInterval.Monthly),
          }),
        ).toEqual({})
      })
    })
  })

  describe('GIVEN filters in the URL', () => {
    const prefixed = (key: string): string => `${ATTRIBUTION_FILTERS_PREFIX}_${key}`

    describe('WHEN reading the time range value', () => {
      it('THEN should read the prefixed time range key', () => {
        const searchParams = new URLSearchParams({
          [prefixed(ATTRIBUTION_TIME_RANGE_FILTER_KEY)]: 'past',
        })

        expect(getAttributionTimeRangeValue(searchParams)).toBe('past')
      })
    })

    describe('WHEN mapping entity filters to the query input', () => {
      it('THEN should build one entry per code with unescaped values, in codes order', () => {
        const searchParams = new URLSearchParams({
          [prefixed(getAttributionEntityFilterKey('team'))]: 'eng,data|-COMMA-|science',
          [prefixed(getAttributionEntityFilterKey('department'))]: 'rnd',
          [prefixed(getAttributionEntityFilterKey('api_key'))]: '',
        })

        expect(
          getAttributionEntityFilters({
            searchParams,
            codes: ['department', 'team', 'api_key', 'agent'],
          }),
        ).toEqual([
          { code: 'department', values: ['rnd'] },
          { code: 'team', values: ['eng', 'data,science'] },
        ])
      })
    })

    describe('WHEN splitting a stored value', () => {
      it('THEN should drop empty entries', () => {
        expect(splitAttributionFilterValues(',a,,b,')).toEqual(['a', 'b'])
      })

      it('THEN should return nothing for a missing value', () => {
        expect(splitAttributionFilterValues(undefined)).toEqual([])
      })
    })
  })

  describe('GIVEN a query error', () => {
    const apolloErrorWithCode = (code: string): ApolloError =>
      new ApolloError({
        graphQLErrors: [new GraphQLError('Unprocessable Entity', { extensions: { code } })],
      })

    describe('WHEN it carries a guard code', () => {
      it.each([['too_many_groups'], ['query_timeout'], ['memory_limit_exceeded']])(
        'THEN %s should be a guard error',
        (code) => {
          expect(isAttributionGuardError(apolloErrorWithCode(code))).toBe(true)
        },
      )
    })

    describe('WHEN it is any other error', () => {
      it.each([
        ['another GraphQL code', apolloErrorWithCode('not_found')],
        ['a network error', new ApolloError({ networkError: new Error('offline') })],
        ['a plain error', new Error('too_many_groups')],
        ['nothing', undefined],
      ])('THEN %s should not be a guard error', (_, error) => {
        expect(isAttributionGuardError(error)).toBe(false)
      })
    })
  })
})
