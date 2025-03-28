import { CurrencyEnum, TimeGranularityEnum } from '~/generated/graphql'

import { formatMrrDataForAreaChart } from '../utils'

jest.mock('~/components/designSystem/Filters', () => ({
  AvailableFiltersEnum: {
    currency: 'currency',
    date: 'date',
    timeGranularity: 'timeGranularity',
  },
  getFilterValue: jest.fn(),
}))

describe('formatMrrDataForAreaChart', () => {
  const mockData = [
    {
      endOfPeriodDt: '2023-01-31',
      endingMrr: '100000',
      mrrChange: '10000',
      mrrChurn: '5000',
      mrrContraction: '3000',
      mrrExpansion: '8000',
      mrrNew: '15000',
      startOfPeriodDt: '2023-01-01',
      startingMrr: '90000',
    },
    {
      endOfPeriodDt: '2023-02-28',
      endingMrr: '120000',
      mrrChange: '20000',
      mrrChurn: '6000',
      mrrContraction: '4000',
      mrrExpansion: '10000',
      mrrNew: '20000',
      startOfPeriodDt: '2023-02-01',
      startingMrr: '100000',
    },
  ]

  it('should format MRR data for monthly area chart display', () => {
    const result = formatMrrDataForAreaChart({
      data: mockData,
      timeGranularity: TimeGranularityEnum.Monthly,
      selectedCurrency: CurrencyEnum.Eur,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      tooltipLabel: 'Jan 2023: €1,000.00',
      value: 100000,
      axisName: 'Jan 1, 2023',
    })
    expect(result[1]).toEqual({
      tooltipLabel: 'Feb 2023: €1,200.00',
      value: 120000,
      axisName: 'Feb 1, 2023',
    })
  })

  it('should format MRR data for daily area chart display', () => {
    const result = formatMrrDataForAreaChart({
      data: mockData,
      timeGranularity: TimeGranularityEnum.Daily,
      selectedCurrency: CurrencyEnum.Eur,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      tooltipLabel: 'Jan 1, 23: €1,000.00',
      value: 100000,
      axisName: 'Jan 1, 2023',
    })
    expect(result[1]).toEqual({
      tooltipLabel: 'Feb 1, 23: €1,200.00',
      value: 120000,
      axisName: 'Feb 1, 2023',
    })
  })

  it('should format MRR data for weekly area chart display', () => {
    const result = formatMrrDataForAreaChart({
      data: mockData,
      timeGranularity: TimeGranularityEnum.Weekly,
      selectedCurrency: CurrencyEnum.Eur,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      tooltipLabel: 'Jan 1, 23 - Jan 31, 23: €1,000.00',
      value: 100000,
      axisName: 'Jan 1, 2023',
    })
    expect(result[1]).toEqual({
      tooltipLabel: 'Feb 1, 23 - Feb 28, 23: €1,200.00',
      value: 120000,
      axisName: 'Feb 1, 2023',
    })
  })

  it('should handle different currencies', () => {
    const result = formatMrrDataForAreaChart({
      data: mockData,
      timeGranularity: TimeGranularityEnum.Monthly,
      selectedCurrency: CurrencyEnum.Usd,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      tooltipLabel: 'Jan 2023: $1,000.00',
      value: 100000,
      axisName: 'Jan 1, 2023',
    })
    expect(result[1]).toEqual({
      tooltipLabel: 'Feb 2023: $1,200.00',
      value: 120000,
      axisName: 'Feb 1, 2023',
    })
  })

  it('should handle empty data array', () => {
    const result = formatMrrDataForAreaChart({
      data: [],
      timeGranularity: TimeGranularityEnum.Monthly,
      selectedCurrency: CurrencyEnum.Eur,
    })

    expect(result).toHaveLength(0)
  })
})
