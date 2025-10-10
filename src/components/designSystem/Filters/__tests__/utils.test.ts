import { DateTime } from 'luxon'

import { AvailableFiltersEnum, filterDataInlineSeparator } from '../types'
import {
  defineDefaultToDateValue,
  formatActiveFilterValueDisplay,
  formatFiltersForInvoiceQuery,
  formatFiltersForMrrQuery,
  formatFiltersForQuery,
  formatFiltersForRevenueStreamsQuery,
  formatMetadataFilter,
  getFilterValue,
  keyWithPrefix,
  parseFromToValue,
  parseMetadataFilter,
} from '../utils'

describe('Filters utils', () => {
  describe('formatFiltersForInvoiceQuery', () => {
    it('should format filters for invoice query', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('paymentStatus', 'failed,pending')
      searchParams.set('invoiceType', 'advance_charges,credit,one_off,subscription')
      searchParams.set('status', 'finalized')
      searchParams.set('paymentDisputeLost', 'false')
      searchParams.set('paymentOverdue', 'true')
      searchParams.set(
        'customerExternalId',
        `externalCustomerIdValue${filterDataInlineSeparator}my name to be displayed`,
      )
      searchParams.set('randomSearchUrlParam', 'anditsvalue')

      const result = formatFiltersForInvoiceQuery(searchParams)

      expect(result).toEqual({
        customerExternalId: 'externalCustomerIdValue',
        invoiceType: ['advance_charges', 'credit', 'one_off', 'subscription'],
        paymentDisputeLost: false,
        paymentOverdue: true,
        paymentStatus: ['failed', 'pending'],
        status: ['finalized'],
      })

      expect(result).not.toHaveProperty('randomSearchUrlParam')
    })

    it('should return empty object when filters are not valid', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('invalidFilter', 'value')

      const result = formatFiltersForInvoiceQuery(searchParams)

      expect(result).toEqual({})
    })
  })

  describe('formatFiltersForRevenueStreamsQuery', () => {
    it('should format filters for revenue streams query', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('timeGranularity', 'day')
      searchParams.set('customerType', 'company')
      searchParams.set('invoiceType', 'advance_charges,credit,one_off,subscription')
      searchParams.set('status', 'finalized')
      searchParams.set('currency', 'USD')
      searchParams.set('paymentOverdue', 'true')
      searchParams.set('date', '2022-01-01,2022-01-31')
      searchParams.set('country', 'US')
      searchParams.set(
        'customerExternalId',
        `externalCustomerIdValue${filterDataInlineSeparator}my name to be displayed`,
      )
      searchParams.set('planCode', 'planCodeValue')
      searchParams.set('partiallyPaid', 'true')
      searchParams.set('selfBilled', 'true')

      const result = formatFiltersForRevenueStreamsQuery(searchParams)

      expect(result).toEqual({
        customerType: 'company',
        fromDate: '2022-01-01',
        planCode: 'planCodeValue',
        timeGranularity: 'day',
        toDate: '2022-01-31',
        currency: 'USD',
        customerCountry: 'US',
        externalCustomerId: 'externalCustomerIdValue',
      })
    })
  })

  describe('formatFiltersForMrrQuery', () => {
    it('should format filters for MRR query', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('timeGranularity', 'month')
      searchParams.set('customerType', 'individual')
      searchParams.set('invoiceType', 'advance_charges,credit,one_off,subscription')
      searchParams.set('status', 'finalized')
      searchParams.set('currency', 'EUR')
      searchParams.set('paymentOverdue', 'true')
      searchParams.set('date', '2023-01-01,2023-01-31')
      searchParams.set('country', 'FR')
      searchParams.set(
        'customerExternalId',
        `customer123${filterDataInlineSeparator}Customer Display Name`,
      )
      searchParams.set('planCode', 'premium')
      searchParams.set('partiallyPaid', 'true')
      searchParams.set('selfBilled', 'true')

      const result = formatFiltersForMrrQuery(searchParams)

      expect(result).toEqual({
        customerType: 'individual',
        fromDate: '2023-01-01',
        timeGranularity: 'month',
        toDate: '2023-01-31',
        currency: 'EUR',
        customerCountry: 'FR',
        externalCustomerId: 'customer123',
      })
    })
  })

  describe('formatActiveFilterValueDisplay', () => {
    it('should format active filter country value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.country, 'US')

      expect(result).toBe('US')
    })
    it('should format active filter currency value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.currency, 'USD')

      expect(result).toBe('USD')
    })
    it('should format active filter customerExternalId value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.customerExternalId,
        `externalCustomerIdValue${filterDataInlineSeparator}my name to be displayed`,
      )

      expect(result).toBe('my name to be displayed')
    })
    it('should format active filter issuingDate value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.issuingDate,
        '2022-01-01,2022-01-31',
      )

      expect(result).toBe('1/1/2022 - 1/31/2022')
    })
    it('should format active filter date value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.date,
        '2022-01-01,2022-01-31',
      )

      expect(result).toBe('1/1/2022 - 1/31/2022')
    })
    it('should format active filter paymentStatus value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.paymentStatus,
        'failed,pending',
      )

      expect(result).toBe('Failed, Pending')
    })
    it('should format active filter planCode value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.planCode, 'planCodeValue')

      expect(result).toBe('PlanCodeValue')
    })
    it('should format active filter paymentDisputeLost value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.paymentDisputeLost, 'true')

      expect(result).toBe('True')
    })
    it('should format active filter paymentOverdue value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.paymentOverdue, 'true')

      expect(result).toBe('True')
    })
    it('should format active filter invoiceType value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.invoiceType,
        'advance_charges,credit,one_off,subscription',
      )

      expect(result).toBe('Advance charges, Credit, One off, Subscription')
    })
    it('should format active filter status value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.status, 'finalized')

      expect(result).toBe('Finalized')
    })
    it('should format active filter subscriptionExternalId value display', () => {
      const result = formatActiveFilterValueDisplay(
        AvailableFiltersEnum.subscriptionExternalId,
        '1234',
      )

      expect(result).toBe('1234')
    })
    it('should format active filter timeGranularity value display', () => {
      const result = formatActiveFilterValueDisplay(AvailableFiltersEnum.timeGranularity, 'daily')

      expect(result).toBe('Daily')
    })
  })

  describe('getFilterValue', () => {
    it('should return null when filter value is not set', () => {
      const searchParams = new URLSearchParams()

      const result = getFilterValue({
        key: AvailableFiltersEnum.timeGranularity,
        searchParams,
      })

      expect(result).toBeNull()
    })

    it('should get filter value', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('timeGranularity', 'day')
      searchParams.set('randomFilter', 'randomValue')

      const result = getFilterValue({
        key: AvailableFiltersEnum.timeGranularity,
        searchParams,
      })

      expect(result).toBe('day')
    })

    it('should get filter value with prefix', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('timeGranularity', 'daily')
      searchParams.set('rs_timeGranularity', 'monthly')
      searchParams.set('rs_randomFilter', 'randomValue')

      const result = getFilterValue({
        key: AvailableFiltersEnum.timeGranularity,
        searchParams,
        prefix: 'rs',
      })

      expect(result).toBe('monthly')
    })
  })

  describe('parseFromToValue', () => {
    it('should handle zero values correctly', () => {
      const result = parseFromToValue('isEqualTo,0,0', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: 0,
        to: 0,
      })
    })

    it('should handle empty values correctly', () => {
      const result = parseFromToValue('isEqualTo,,', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: null,
        to: null,
      })
    })

    it('should handle positive numbers correctly', () => {
      const result = parseFromToValue('isBetween,5,10', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: 5,
        to: 10,
      })
    })

    it('should handle isEqualTo interval', () => {
      const result = parseFromToValue('isEqualTo,7,', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: 7,
        to: 7,
      })
    })

    it('should handle isBetween interval', () => {
      const result = parseFromToValue('isBetween,3,8', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: 3,
        to: 8,
      })
    })

    it('should handle isLessThan interval', () => {
      const result = parseFromToValue('isLessThan,,15', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: null,
        to: 15,
      })
    })

    it('should handle isGreaterThan interval', () => {
      const result = parseFromToValue('isGreaterThan,20,', { from: 'from', to: 'to' })

      expect(result).toEqual({
        from: 20,
        to: null,
      })
    })
  })

  describe('formatFiltersForQuery', () => {
    it('should format filters without prefix and keyMap', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('country', 'US')
      searchParams.set('currency', 'USD')
      searchParams.set('customerType', 'company')
      searchParams.set('invalidFilter', 'shouldBeIgnored')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [
          AvailableFiltersEnum.country,
          AvailableFiltersEnum.currency,
          AvailableFiltersEnum.customerType,
        ],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        country: 'US',
        currency: 'USD',
        customerType: 'company',
      })
      expect(result).not.toHaveProperty('invalidFilter')
    })

    it('should format filters with prefix', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('rs_country', 'FR')
      searchParams.set('rs_currency', 'EUR')
      searchParams.set('rs_timeGranularity', 'month')
      searchParams.set('other_filter', 'shouldBeIgnored')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [
          AvailableFiltersEnum.country,
          AvailableFiltersEnum.currency,
          AvailableFiltersEnum.timeGranularity,
        ],
        filtersNamePrefix: 'rs',
      })

      expect(result).toEqual({
        country: 'FR',
        currency: 'EUR',
        timeGranularity: 'month',
      })
      expect(result).not.toHaveProperty('other_filter')
    })

    it('should format filters with keyMap', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('country', 'US')
      searchParams.set('currency', 'USD')

      const keyMap = {
        [AvailableFiltersEnum.country]: 'customerCountry',
        [AvailableFiltersEnum.currency]: 'customerCurrency',
      }

      const result = formatFiltersForQuery({
        searchParams,
        keyMap,
        availableFilters: [AvailableFiltersEnum.country, AvailableFiltersEnum.currency],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        customerCountry: 'US',
        customerCurrency: 'USD',
      })
    })

    it('should apply filter value transformations', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('paymentStatus', 'failed,pending')
      searchParams.set('paymentOverdue', 'true')
      searchParams.set('amount', 'isBetween,10,100')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [
          AvailableFiltersEnum.paymentStatus,
          AvailableFiltersEnum.paymentOverdue,
          AvailableFiltersEnum.amount,
        ],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        paymentStatus: ['failed', 'pending'],
        paymentOverdue: true,
        amountFrom: 10,
        amountTo: 100,
      })
    })

    it('should handle date filters that return objects', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('date', '2023-01-01,2023-01-31')
      searchParams.set('issuingDate', '2023-02-01,2023-02-28')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.date, AvailableFiltersEnum.issuingDate],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        fromDate: '2023-01-01',
        toDate: '2023-01-31',
        issuingDateFrom: '2023-02-01',
        issuingDateTo: '2023-02-28',
      })
    })

    it('should handle customerExternalId with separator', () => {
      const searchParams = new URLSearchParams()

      searchParams.set(
        'customerExternalId',
        `customer123${filterDataInlineSeparator}Customer Display Name`,
      )

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.customerExternalId],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        customerExternalId: 'customer123',
      })
    })

    it('should handle boolean filters correctly', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('paymentOverdue', 'true')
      searchParams.set('paymentDisputeLost', 'false')
      searchParams.set('selfBilled', 'true')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [
          AvailableFiltersEnum.paymentOverdue,
          AvailableFiltersEnum.paymentDisputeLost,
          AvailableFiltersEnum.selfBilled,
        ],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        paymentOverdue: true,
        paymentDisputeLost: false,
        selfBilled: true,
      })
    })

    it('should handle array filters correctly', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('invoiceType', 'subscription,one_off')
      searchParams.set('status', 'finalized,draft')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.invoiceType, AvailableFiltersEnum.status],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        invoiceType: ['subscription', 'one_off'],
        status: ['finalized', 'draft'],
      })
    })

    it('should handle filters with no transformation function', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('planCode', 'premium')
      searchParams.set('invoiceNumber', 'INV-001')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.planCode, AvailableFiltersEnum.invoiceNumber],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        planCode: 'premium',
        invoiceNumber: 'INV-001',
      })
    })

    it('should return empty object when no valid filters are provided', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('invalidFilter', 'value')
      searchParams.set('anotherInvalid', 'anotherValue')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.country, AvailableFiltersEnum.currency],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({})
    })

    it('should handle mixed valid and invalid filters', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('country', 'US')
      searchParams.set('invalidFilter', 'shouldBeIgnored')
      searchParams.set('currency', 'USD')
      searchParams.set('anotherInvalid', 'alsoIgnored')

      const result = formatFiltersForQuery({
        searchParams,
        availableFilters: [AvailableFiltersEnum.country, AvailableFiltersEnum.currency],
        filtersNamePrefix: '',
      })

      expect(result).toEqual({
        country: 'US',
        currency: 'USD',
      })
      expect(result).not.toHaveProperty('invalidFilter')
      expect(result).not.toHaveProperty('anotherInvalid')
    })

    it('should handle filters with prefix and keyMap together', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('rs_country', 'FR')
      searchParams.set('rs_currency', 'EUR')

      const keyMap = {
        [AvailableFiltersEnum.country]: 'customerCountry',
        [AvailableFiltersEnum.currency]: 'customerCurrency',
      }

      const result = formatFiltersForQuery({
        searchParams,
        keyMap,
        availableFilters: [AvailableFiltersEnum.country, AvailableFiltersEnum.currency],
        filtersNamePrefix: 'rs',
      })

      expect(result).toEqual({
        customerCountry: 'FR',
        customerCurrency: 'EUR',
      })
    })
  })

  describe('defineDefaultToDateValue', () => {
    const filtersNamePrefix = 'test'
    const loggedDateKey = keyWithPrefix(AvailableFiltersEnum.loggedDate, filtersNamePrefix)

    const currentTimeString = '2023-06-15T10:30:00.000Z'
    const mockCurrentTime = DateTime.fromISO(currentTimeString).setZone('utc') as DateTime<true>
    const fromDate = mockCurrentTime.minus({ days: 1 }).toISO()

    let mockNow: jest.SpyInstance

    beforeEach(() => {
      // Mock DateTime.now() to return a consistent date for testing
      mockNow = jest.spyOn(DateTime, 'now').mockImplementation(() => mockCurrentTime)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should set default loggedDate when no existing value is present', () => {
      const searchParams = new URLSearchParams()

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      expect(result.get(loggedDateKey)).toBe(`,${currentTimeString}`)
    })

    it('should set default loggedDate with empty prefix when no existing value is present', () => {
      const searchParams = new URLSearchParams()

      const result = defineDefaultToDateValue(searchParams, '')

      expect(result.get(keyWithPrefix(AvailableFiltersEnum.loggedDate, ''))).toBe(
        `,${currentTimeString}`,
      )
    })

    it('should preserve existing searchParams when setting default loggedDate', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('existingParam', 'existingValue')

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      expect(result.get('existingParam')).toBe('existingValue')
      expect(result.get(loggedDateKey)).toBe(`,${currentTimeString}`)
    })

    it('should use current time as toDate when existing toDate is in the future', () => {
      const searchParams = new URLSearchParams()
      const futureDate = mockCurrentTime.plus({ days: 1 }).toISO()

      searchParams.set(loggedDateKey, `${fromDate},${futureDate}`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      expect(result.get(loggedDateKey)).toBe(`${fromDate},${currentTimeString}`)
    })

    it('should preserve existing toDate when it is in the past', () => {
      const searchParams = new URLSearchParams()
      const pastDate = mockCurrentTime.minus({ days: 1 }).toISO()

      searchParams.set(loggedDateKey, `${fromDate},${pastDate}`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      // Should use the end of day for the past date
      const expectedEndOfDay = DateTime.fromISO(pastDate).endOf('day').toISO()

      expect(result.get(loggedDateKey)).toBe(`${fromDate},${expectedEndOfDay}`)
    })

    it('should use current time when existing toDate end of day is greater than now', () => {
      const searchParams = new URLSearchParams()
      const currentDate = mockCurrentTime.minus({ hours: 2 }).toISO()

      searchParams.set(loggedDateKey, `${fromDate},${currentDate}`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      // Should use current time because end of day for currentDate would be greater than now
      expect(result.get(loggedDateKey)).toBe(`${fromDate},${currentTimeString}`)
    })

    it('should handle existing loggedDate with only fromDate', () => {
      const searchParams = new URLSearchParams()

      searchParams.set(loggedDateKey, `${fromDate},`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      expect(result.get(loggedDateKey)).toBe(`${fromDate},${currentTimeString}`)
    })

    it('should handle existing loggedDate with only toDate', () => {
      const searchParams = new URLSearchParams()
      const pastDate = mockCurrentTime.minus({ days: 1 }).toISO()

      searchParams.set(loggedDateKey, `,${pastDate}`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      const expectedEndOfDay = DateTime.fromISO(pastDate).endOf('day').toISO()

      expect(result.get(loggedDateKey)).toBe(`,${expectedEndOfDay}`)
    })

    it('should return a new URLSearchParams instance without modifying the original', () => {
      const searchParams = new URLSearchParams()

      searchParams.set('existingParam', 'existingValue')

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      // Original should remain unchanged
      expect(searchParams.get(loggedDateKey)).toBeNull()
      expect(searchParams.get('existingParam')).toBe('existingValue')

      // Result should have the new value
      expect(result.get(loggedDateKey)).toBe(`,${currentTimeString}`)
      expect(result.get('existingParam')).toBe('existingValue')

      // Should be different instances
      expect(result).not.toBe(searchParams)
    })

    it('should handle edge case where toDate is exactly at end of current day', () => {
      // Mock current time to be at start of day
      const startOfDayTimeString = mockCurrentTime.startOf('day').toISO()

      mockNow.mockImplementation(() => DateTime.fromISO(startOfDayTimeString).setZone('utc'))

      const searchParams = new URLSearchParams()
      const endOfCurrentDay = mockCurrentTime.endOf('day').toISO()

      searchParams.set(loggedDateKey, `${fromDate},${endOfCurrentDay}`)

      const result = defineDefaultToDateValue(searchParams, filtersNamePrefix)

      // Since endOfCurrentDay.endOf('day') would be greater than current time (start of day),
      // it should use the current time instead
      expect(result.get(loggedDateKey)).toBe(`${fromDate},${startOfDayTimeString}`)
    })
  })

  describe('parseMetadataFilter', () => {
    it('should parse metadata filter correctly on a single pair', () => {
      const expected = [
        {
          key: 'metadata',
          value: 'value',
        },
      ]

      const result = parseMetadataFilter('metadata=value')

      expect(result).toEqual(expected)
    })

    it('should parse metadata filter correctly on a multi pair', () => {
      const expected = [
        {
          key: 'metadata',
          value: 'value',
        },
        {
          key: 'anotherMetadata',
          value: 'value',
        },
      ]

      const result = parseMetadataFilter('metadata=value&anotherMetadata=value')

      expect(result).toEqual(expected)
    })

    it('should parse metadata filter correctly even without value', () => {
      const expected = [
        {
          key: 'metadata',
          value: '',
        },
      ]

      const result = parseMetadataFilter('metadata')

      expect(result).toEqual(expected)
    })

    it('should parse metadata filter correctly on an empty string', () => {
      const result = parseMetadataFilter('')

      expect(result).toEqual([])
    })
  })

  describe('formatMetadataFilter', () => {
    it('should format metadata filter correctly on a single pair', () => {
      const value = [
        {
          key: 'metadata',
          value: 'value',
        },
      ]

      const expected = 'metadata=value'

      const result = formatMetadataFilter(value)

      expect(result).toEqual(expected)
    })

    it('should format metadata filter correctly on a multi pair', () => {
      const value = [
        {
          key: 'metadata',
          value: 'value',
        },
        {
          key: 'anotherMetadata',
          value: 'value',
        },
      ]

      const expected = 'metadata=value&anotherMetadata=value'

      const result = formatMetadataFilter(value)

      expect(result).toEqual(expected)
    })

    it('should format metadata filter correctly even without value', () => {
      const value = [
        {
          key: 'metadata',
          value: '',
        },
      ]

      const expected = 'metadata='

      const result = formatMetadataFilter(value)

      expect(result).toEqual(expected)
    })

    it('should format metadata filter correctly on an empty array', () => {
      const result = formatMetadataFilter([])

      expect(result).toEqual('')
    })
  })
})
