import { addOnFeeMock, feesMock, feesMockAmountCents } from './fixtures'

import {
  creditNoteFormCalculationCalculation,
  CreditNoteFormCalculationCalculationProps,
  mergeTaxMaps,
  updateOrCreateTaxMap,
} from '../utils'

const prepare = ({
  hasFeeError = false,
  isLegacyInvoice = false,
  addOnFee = undefined,
  couponsAmountCents = '0',
  fees = undefined,
  feesAmountCents = '0',
}: Partial<CreditNoteFormCalculationCalculationProps> = {}) => {
  const { totalExcludedTax, taxes, proRatedCouponAmount } = creditNoteFormCalculationCalculation({
    hasFeeError,
    isLegacyInvoice,
    addOnFee,
    couponsAmountCents,
    fees,
    feesAmountCents,
  })

  return { totalExcludedTax, taxes, proRatedCouponAmount }
}

describe('CreditNote utils', () => {
  describe('creditNoteFormCalculationCalculation()', () => {
    it('should return object when error', () => {
      const { totalExcludedTax, taxes, proRatedCouponAmount } = prepare({
        hasFeeError: true,
      })

      expect(totalExcludedTax).toBeUndefined()
      expect(taxes).toEqual(new Map())
      expect(proRatedCouponAmount).toBeUndefined()
    })

    describe('without coupon', () => {
      it('should return object correctly formated', () => {
        const { totalExcludedTax, taxes, proRatedCouponAmount } = prepare({
          feesAmountCents: feesMockAmountCents,
          fees: feesMock,
          addOnFee: addOnFeeMock,
        })

        expect(totalExcludedTax).toBe(30500)
        expect(proRatedCouponAmount).toBe(0)
        expect(taxes).toEqual(
          new Map([
            ['tax1tax1', { amount: 1100, label: 'Tax 1 (10%)', taxRate: 10 }],
            ['tax2tax2', { amount: 4000, label: 'Tax 2 (20%)', taxRate: 20 }],
          ])
        )
      })
    })

    describe('with coupon', () => {
      it('should return object correctly formated', () => {
        const { totalExcludedTax, taxes, proRatedCouponAmount } = prepare({
          couponsAmountCents: '5000',
          feesAmountCents: feesMockAmountCents,
          fees: feesMock,
          addOnFee: addOnFeeMock,
        })

        expect(totalExcludedTax).toBe(26553.670086819257)
        expect(proRatedCouponAmount).toBe(3946.329913180742)
        expect(taxes).toEqual(
          new Map([
            ['tax1tax1', { amount: 911.8784530386741, label: 'Tax 1 (10%)', taxRate: 10 }],
            ['tax2tax2', { amount: 3386.9771112865037, label: 'Tax 2 (20%)', taxRate: 20 }],
          ])
        )
      })
    })
  })

  describe('mergeTaxMaps()', () => {
    it('return map 2 if map 1 is empty', () => {
      const map1 = new Map()
      const map2 = new Map([['tax1', { amount: 100, label: 'Tax 1', taxRate: 10 }]])

      const mergedMap = mergeTaxMaps(map1, map2)

      expect(mergedMap).toEqual(map2)
    })

    it('return map 1 if map 2 is empty', () => {
      const map1 = new Map([['tax1', { amount: 100, label: 'Tax 1', taxRate: 10 }]])
      const map2 = new Map()

      const mergedMap = mergeTaxMaps(map1, map2)

      expect(mergedMap).toEqual(map1)
    })

    it('properly merge two tax map', () => {
      const map1 = new Map([['tax1', { amount: 100, label: 'Tax 1', taxRate: 10 }]])
      const map2 = new Map([['tax1', { amount: 200, label: 'Tax 1', taxRate: 10 }]])

      const mergedMap = mergeTaxMaps(map1, map2)

      expect(mergedMap).toEqual(new Map([['tax1', { amount: 300, label: 'Tax 1', taxRate: 10 }]]))
    })
  })

  describe('updateOrCreateTaxMap()', () => {
    it('returns the currentTaxMap if no feeAppliedTaxes', () => {
      const currentTaxMap = new Map([['tax1', { amount: 100, label: 'Tax 1', taxRate: 10 }]])

      const updatedTaxMap = updateOrCreateTaxMap(currentTaxMap, undefined)

      expect(updatedTaxMap).toEqual(currentTaxMap)
    })

    it('returns the currentTaxMap if none given', () => {
      const feeAppliedTaxes = [
        { id: 'tax1', tax: { id: 'tax1', name: 'Tax 1', rate: 10 } },
        { id: 'tax2', tax: { id: 'tax2', name: 'Tax 2', rate: 20 } },
      ]

      const updatedTaxMap = updateOrCreateTaxMap(new Map(), 100, feeAppliedTaxes)

      expect(updatedTaxMap).toEqual(
        new Map([
          ['tax1', { amount: 10, label: 'Tax 1 (10%)', taxRate: 10 }],
          ['tax2', { amount: 20, label: 'Tax 2 (20%)', taxRate: 20 }],
        ])
      )
    })

    it('returns the currentTaxMap if one given', () => {
      const currentTaxMap = new Map([['tax1', { amount: 100, label: 'Tax 1 (10%)', taxRate: 10 }]])
      const feeAppliedTaxes = [
        { id: 'tax1', tax: { id: 'tax1', name: 'Tax 1', rate: 10 } },
        { id: 'tax2', tax: { id: 'tax2', name: 'Tax 2', rate: 20 } },
      ]

      const updatedTaxMap = updateOrCreateTaxMap(currentTaxMap, 100, feeAppliedTaxes)

      expect(updatedTaxMap).toEqual(
        new Map([
          ['tax1', { amount: 110, label: 'Tax 1 (10%)', taxRate: 10 }],
          ['tax2', { amount: 20, label: 'Tax 2 (20%)', taxRate: 20 }],
        ])
      )
    })
  })
})
