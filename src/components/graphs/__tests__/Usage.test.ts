import { DateTime } from 'luxon'

import { InvoicedUsageFakeData } from '~/components/designSystem/graphs/fixtures'
import { CurrencyEnum } from '~/generated/graphql'

import { AnalyticsPeriodScopeEnum } from '../MonthSelectorDropdown'
import { getDataForUsageDisplay, LAST_USAGE_GRAPH_LINE_KEY_NAME } from '../Usage'
import { GRAPH_YEAR_MONTH_DAY_DATE_FORMAT } from '../utils'

describe('components/graphs/Usage', () => {
  describe('getAllDataForGrossDisplay', () => {
    it('should return data for year blur mode', () => {
      const res = getDataForUsageDisplay({
        data: InvoicedUsageFakeData,
        currency: CurrencyEnum.Eur,
        demoMode: false,
        blur: true,
        period: AnalyticsPeriodScopeEnum.Year,
      })

      expect(typeof res.totalAmount).toBe('number')
      expect(res.dataBarForDisplay.length).toBe(1)
      expect(res.hasNoDataToDisplay).toBeFalsy()
      expect(res.dataLinesForDisplay.length).toBe(5)
      expect(res.dateFrom).toBe(
        DateTime.now()
          .minus({ month: 12 })
          .startOf('month')
          .toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
      expect(res.dateTo).toBe(
        DateTime.now().startOf('month').toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
    })

    it('should return data for year demo mode', () => {
      const res = getDataForUsageDisplay({
        data: InvoicedUsageFakeData,
        currency: CurrencyEnum.Eur,
        demoMode: true,
        blur: false,
        period: AnalyticsPeriodScopeEnum.Year,
      })

      expect(typeof res.totalAmount).toBe('number')
      expect(res.dataBarForDisplay.length).toBe(1)
      expect(res.hasNoDataToDisplay).toBeFalsy()
      expect(res.dataLinesForDisplay.length).toBe(5)
      expect(res.dateFrom).toBe(
        DateTime.now()
          .minus({ month: 12 })
          .startOf('month')
          .toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
      expect(res.dateTo).toBe(
        DateTime.now().startOf('month').toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
    })

    it('should return data for quarter demo mode', () => {
      const res = getDataForUsageDisplay({
        data: InvoicedUsageFakeData,
        currency: CurrencyEnum.Eur,
        demoMode: true,
        blur: false,
        period: AnalyticsPeriodScopeEnum.Quarter,
      })

      expect(typeof res.totalAmount).toBe('number')
      expect(res.dataBarForDisplay.length).toBe(1)
      expect(res.hasNoDataToDisplay).toBeFalsy()
      expect(res.dataLinesForDisplay.length).toBe(5)
      expect(res.dateFrom).toBe(
        DateTime.now()
          .minus({ month: 3 })
          .startOf('month')
          .toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
      expect(res.dateTo).toBe(
        DateTime.now().startOf('month').toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
    })

    it('should return data for month demo mode', () => {
      const res = getDataForUsageDisplay({
        data: InvoicedUsageFakeData,
        currency: CurrencyEnum.Eur,
        demoMode: true,
        blur: false,
        period: AnalyticsPeriodScopeEnum.Month,
      })

      expect(typeof res.totalAmount).toBe('number')
      expect(res.dataBarForDisplay.length).toBe(1)
      expect(res.hasNoDataToDisplay).toBeFalsy()
      expect(res.dataLinesForDisplay.length).toBe(5)
      expect(res.dateFrom).toBe(
        DateTime.now()
          .minus({ month: 1 })
          .startOf('month')
          .toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
      expect(res.dateTo).toBe(
        DateTime.now().startOf('month').toFormat(GRAPH_YEAR_MONTH_DAY_DATE_FORMAT)
      )
    })
  })

  it('should contain the Other as last items if more than 5 items', () => {
    const res = getDataForUsageDisplay({
      data: [
        {
          amountCents: '42500',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'sum_bm',
        },
        {
          amountCents: '45100',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm',
        },
        {
          amountCents: '43130',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_two_dimensions',
        },
        {
          amountCents: '42300',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_one_dimension',
        },
        {
          amountCents: '42300',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'user_seats',
        },
        {
          amountCents: '40020',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'gb',
        },
      ],
      currency: CurrencyEnum.Eur,
      demoMode: false,
      blur: false,
      period: AnalyticsPeriodScopeEnum.Month,
    })

    expect(res.dataLinesForDisplay[res.dataLinesForDisplay.length - 1][0]).toBe(
      LAST_USAGE_GRAPH_LINE_KEY_NAME
    )
  })

  it('should contain the last key as last items if contains 5 items', () => {
    const res = getDataForUsageDisplay({
      data: [
        {
          amountCents: '42500',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'sum_bm',
        },
        {
          amountCents: '45100',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm',
        },
        {
          amountCents: '43130',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_two_dimensions',
        },
        {
          amountCents: '42300',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_one_dimension',
        },
        {
          amountCents: '42300',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'user_seats',
        },
      ],
      currency: CurrencyEnum.Eur,
      demoMode: false,
      blur: false,
      period: AnalyticsPeriodScopeEnum.Month,
    })

    expect(res.dataLinesForDisplay[res.dataLinesForDisplay.length - 1][0]).toBe('user_seats')
  })

  it('should contain the last key as last items if contains 4 items', () => {
    const res = getDataForUsageDisplay({
      data: [
        {
          amountCents: '42500',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'sum_bm',
        },
        {
          amountCents: '45100',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm',
        },
        {
          amountCents: '43130',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_two_dimensions',
        },
        {
          amountCents: '42300',
          month: DateTime.now().startOf('month').toISO(),
          currency: CurrencyEnum.Eur,
          code: 'count_bm_one_dimension',
        },
      ],
      currency: CurrencyEnum.Eur,
      demoMode: false,
      blur: false,
      period: AnalyticsPeriodScopeEnum.Month,
    })

    expect(res.dataLinesForDisplay[res.dataLinesForDisplay.length - 1][0]).toBe(
      'count_bm_one_dimension'
    )
  })
})
