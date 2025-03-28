import { AvailableFiltersEnum, filterDataInlineSeparator } from '../types'
import {
  formatActiveFilterValueDisplay,
  formatFiltersForInvoiceQuery,
  formatFiltersForMrrQuery,
  formatFiltersForRevenueStreamsQuery,
  getFilterValue,
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
      searchParams.set('accountType', 'company')
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
      searchParams.set('accountType', 'individual')
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
})
