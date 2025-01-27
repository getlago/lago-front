import {
  invoiceSubAllFilterChargesSelected,
  invoiceSubThreeChargesMultipleFilters,
  invoiceSubTwoChargeOneFilter,
  invoiceSubTwoChargeOneFilterDefaultAlreadySelected,
} from './fixture'

import {
  getChargesComboboxDataFromInvoiceSubscription,
  getChargesFiltersComboboxDataFromInvoiceSubscription,
} from '../utils'

describe('Invoices >  Details > Utils', () => {
  describe('getChargesComboboxDataFromInvoiceSubscription', () => {
    it('returns an empty array of no invoiceSubscription passed', () => {
      const result = getChargesComboboxDataFromInvoiceSubscription({
        invoiceSubscription: undefined,
      })

      expect(result).toEqual([])
    })

    it('returns correct Combobox Data for two charges and one with filters', () => {
      const result = getChargesComboboxDataFromInvoiceSubscription({
        invoiceSubscription: invoiceSubTwoChargeOneFilter,
      })

      expect(result).toEqual([
        {
          description: 'count_bm',
          label: 'Count BM',
          value: 'c53a7a35-fa5e-407b-bf87-2b96dc1dead2',
        },
        {
          description: 'bm_with_filters',
          label: 'bm with filters',
          value: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
        },
      ])
    })

    it('returns correct Combobox Data for 3 charges and one with multiple filters', () => {
      const result = getChargesComboboxDataFromInvoiceSubscription({
        invoiceSubscription: invoiceSubThreeChargesMultipleFilters,
      })

      expect(result).toEqual([
        {
          description: 'count_bm',
          label: 'Count BM',
          value: 'c53a7a35-fa5e-407b-bf87-2b96dc1dead2',
        },
        {
          description: 'bm_with_filters',
          label: 'bm with filters',
          value: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
        },
        {
          description: 'sum_bm',
          label: 'Sum BM',
          value: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
        },
      ])
    })

    it('returns correct Combobox Data if all charge with filter have fees', () => {
      const result = getChargesComboboxDataFromInvoiceSubscription({
        invoiceSubscription: invoiceSubAllFilterChargesSelected,
      })

      expect(result).toEqual([
        {
          description: 'count_bm',
          label: 'Count BM',
          value: '332a641c-d82d-4c9e-bfbe-298b9fc2d1de',
        },
        {
          description: 'sum_bm',
          label: 'Sum BM',
          value: '6ca2019f-af61-45e1-a58e-b616ad5615ef',
        },
      ])
    })
  })

  describe('getChargesFiltersComboboxDataFromInvoiceSubscription', () => {
    it('returns an empty array of no invoiceSubscription passed', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: undefined,
        selectedChargeId: 'selectedChargeId',
      })

      expect(result).toEqual([])
    })

    it('returns an empty array of no selectedChargeId passed', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: invoiceSubTwoChargeOneFilter,
        selectedChargeId: undefined,
      })

      expect(result).toEqual([])
    })

    it('returns correct Combobox Data Filters for two charges and one with filters', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: invoiceSubTwoChargeOneFilter,
        selectedChargeId: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
      })

      expect(result).toEqual([
        {
          label: 'defaultFilterOptionLabel',
          value: '__ALL_FILTER_VALUES__',
        },
        {
          label: 'payment_type • asia',
          value: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
        },
      ])
    })

    it('returns correct Combobox Data Filters for two charges and one with filters while default filter already has a fee', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: invoiceSubTwoChargeOneFilterDefaultAlreadySelected,
        selectedChargeId: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
      })

      expect(result).toEqual([
        {
          label: 'payment_type • asia',
          value: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
        },
      ])
    })

    it('returns correct Combobox Data Filters for 3 charges and one with multiple filters', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: invoiceSubThreeChargesMultipleFilters,
        selectedChargeId: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
      })

      expect(result).toEqual([
        {
          label: 'defaultFilterOptionLabel',
          value: '__ALL_FILTER_VALUES__',
        },
        {
          label: 'payment_type • asia',
          value: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
        },
      ])
    })

    it('returns correct Combobox Data Filters if all charge with filter have fees', () => {
      const result = getChargesFiltersComboboxDataFromInvoiceSubscription({
        defaultFilterOptionLabel: 'defaultFilterOptionLabel',
        invoiceSubscription: invoiceSubAllFilterChargesSelected,
        selectedChargeId: '332a641c-d82d-4c9e-bfbe-298b9fc2d1de',
      })

      expect(result).toEqual([])
    })
  })
})
