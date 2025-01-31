import {
  addOnFeeMock,
  addonMockFormatedForEstimate,
  feeMockFormatedForEstimate,
  feesMock,
} from '~/components/creditNote/__tests__/fixtures'
import {
  creditNoteFormCalculationCalculation,
  CreditNoteFormCalculationCalculationProps,
} from '~/components/creditNote/utils'
import { CurrencyEnum } from '~/generated/graphql'

const prepare = ({
  addonFees = undefined,
  fees = undefined,
  hasError = false,
  currency = CurrencyEnum.Eur,
}: Partial<CreditNoteFormCalculationCalculationProps> = {}) => {
  const { feeForEstimate } = creditNoteFormCalculationCalculation({
    addonFees,
    fees,
    hasError,
    currency,
  })

  return { feeForEstimate }
}

describe('CreditNote utils', () => {
  describe('creditNoteFormCalculationCalculation()', () => {
    it('should return undefined for feeForEstimate if hasError is true', () => {
      const { feeForEstimate } = prepare({ hasError: true })

      expect(feeForEstimate).toBeUndefined()
    })
    it('should return fees for estimate', () => {
      const { feeForEstimate } = prepare({ fees: feesMock })

      expect(feeForEstimate).toEqual(feeMockFormatedForEstimate)
    })
    it('should return addonFees for estimate', () => {
      const { feeForEstimate } = prepare({ addonFees: addOnFeeMock })

      expect(feeForEstimate).toEqual(addonMockFormatedForEstimate)
    })
  })
})
