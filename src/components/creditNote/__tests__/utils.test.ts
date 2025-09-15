import {
  addOnFeeMock,
  addonMockFormatedForEstimate,
  feeMockFormatedForEstimate,
  feesMock,
} from '~/components/creditNote/__tests__/fixtures'
import { CreditNoteForm } from '~/components/creditNote/types'
import {
  creditNoteFormCalculationCalculation,
  CreditNoteFormCalculationCalculationProps,
  creditNoteFormHasAtLeastOneFeeChecked,
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

describe('creditNoteFormHasAtLeastOneFeeChecked', () => {
  describe('when addOnFee is present', () => {
    it('returns true when at least one addon fee is checked', () => {
      const formValues = {
        addOnFee: [
          {
            id: '1',
            checked: true,
            maxAmount: 100,
            name: 'Test Addon 1',
            value: 50,
          },
          {
            id: '2',
            checked: false,
            maxAmount: 200,
            name: 'Test Addon 2',
            value: 75,
          },
        ],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })

    it('returns false when no addon fees are checked', () => {
      const formValues = {
        addOnFee: [
          {
            id: '1',
            checked: false,
            maxAmount: 100,
            name: 'Test Addon 1',
            value: 50,
          },
          {
            id: '2',
            checked: false,
            maxAmount: 200,
            name: 'Test Addon 2',
            value: 75,
          },
        ],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('returns false when addOnFee array is empty', () => {
      const formValues = {
        addOnFee: [],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })
  })

  describe('when creditFee is present (and no addOnFee)', () => {
    it('returns true when at least one credit fee is checked', () => {
      const formValues = {
        creditFee: [
          {
            id: '1',
            checked: true,
            maxAmount: 100,
            name: 'Test Credit 1',
            value: 50,
          },
          {
            id: '2',
            checked: false,
            maxAmount: 200,
            name: 'Test Credit 2',
            value: 75,
          },
        ],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })

    it('returns false when no credit fees are checked', () => {
      const formValues = {
        creditFee: [
          {
            id: '1',
            checked: false,
            maxAmount: 100,
            name: 'Test Credit 1',
            value: 50,
          },
          {
            id: '2',
            checked: false,
            maxAmount: 200,
            name: 'Test Credit 2',
            value: 75,
          },
        ],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('returns false when creditFee array is empty', () => {
      const formValues = {
        creditFee: [],
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })
  })

  describe('when regular fees are present (and no addOnFee or creditFee)', () => {
    it('returns true when at least one regular fee is checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              fee1: {
                id: '1',
                checked: true,
                maxAmount: 100,
                name: 'Test Fee 1',
                value: 50,
              },
              fee2: {
                id: '2',
                checked: false,
                maxAmount: 200,
                name: 'Test Fee 2',
                value: 75,
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })

    it('returns false when no regular fees are checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              fee1: {
                id: '1',
                checked: false,
                maxAmount: 100,
                name: 'Test Fee 1',
                value: 50,
              },
              fee2: {
                id: '2',
                checked: false,
                maxAmount: 200,
                name: 'Test Fee 2',
                value: 75,
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('returns true when at least one grouped fee is checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              groupedFee1: {
                name: 'Grouped Fee',
                grouped: {
                  subFee1: {
                    id: '1',
                    checked: true,
                    maxAmount: 100,
                    name: 'Sub Fee 1',
                    value: 50,
                  },
                  subFee2: {
                    id: '2',
                    checked: false,
                    maxAmount: 200,
                    name: 'Sub Fee 2',
                    value: 75,
                  },
                },
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })

    it('returns false when no grouped fees are checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              groupedFee1: {
                name: 'Grouped Fee',
                grouped: {
                  subFee1: {
                    id: '1',
                    checked: false,
                    maxAmount: 100,
                    name: 'Sub Fee 1',
                    value: 50,
                  },
                  subFee2: {
                    id: '2',
                    checked: false,
                    maxAmount: 200,
                    name: 'Sub Fee 2',
                    value: 75,
                  },
                },
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('returns true when fees contain both regular and grouped fees with at least one checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              regularFee: {
                id: '1',
                checked: false,
                maxAmount: 100,
                name: 'Regular Fee',
                value: 50,
              },
              groupedFee1: {
                name: 'Grouped Fee',
                grouped: {
                  subFee1: {
                    id: '2',
                    checked: true,
                    maxAmount: 200,
                    name: 'Sub Fee 1',
                    value: 75,
                  },
                },
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })

    it('returns false when fees object is empty', () => {
      const formValues = {
        fees: {},
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('handles multiple subscriptions and returns true if any fee is checked', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription 1',
            fees: {
              fee1: {
                id: '1',
                checked: false,
                maxAmount: 100,
                name: 'Test Fee 1',
                value: 50,
              },
            },
          },
          subscription2: {
            subscriptionName: 'Test Subscription 2',
            fees: {
              fee2: {
                id: '2',
                checked: true,
                maxAmount: 200,
                name: 'Test Fee 2',
                value: 75,
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('returns false when grouped property is not present', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              groupedFee1: {
                name: 'Grouped Fee',
                grouped: {
                  subFee1: {
                    id: '1',
                    maxAmount: 100,
                    name: 'Sub Fee 1',
                    value: 50,
                  },
                  subFee2: {
                    id: '2',
                    maxAmount: 200,
                    name: 'Sub Fee 2',
                    value: 75,
                  },
                },
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(
        formValues as unknown as Partial<CreditNoteForm>,
      )

      expect(result).toBe(false)
    })

    it('returns false when all fee types are undefined', () => {
      const formValues = {}

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('returns false when all fee types are null/empty', () => {
      const formValues = {
        addOnFee: undefined,
        creditFee: undefined,
        fees: undefined,
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('handles grouped fee with empty grouped object', () => {
      const formValues = {
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              groupedFee1: {
                name: 'Grouped Fee',
                grouped: {},
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      expect(result).toBe(false)
    })

    it('prioritizes addOnFee over other fee types', () => {
      const formValues = {
        addOnFee: [
          {
            id: '1',
            checked: false,
            maxAmount: 100,
            name: 'Test Addon',
            value: 50,
          },
        ],
        creditFee: [
          {
            id: '2',
            checked: true,
            maxAmount: 200,
            name: 'Test Credit',
            value: 75,
          },
        ],
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              fee1: {
                id: '3',
                checked: true,
                maxAmount: 300,
                name: 'Test Fee',
                value: 100,
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      // Should return false because addOnFee takes precedence and none are checked
      expect(result).toBe(false)
    })

    it('prioritizes creditFee over regular fees when addOnFee is not present', () => {
      const formValues = {
        creditFee: [
          {
            id: '2',
            checked: false,
            maxAmount: 200,
            name: 'Test Credit',
            value: 75,
          },
        ],
        fees: {
          subscription1: {
            subscriptionName: 'Test Subscription',
            fees: {
              fee1: {
                id: '3',
                checked: true,
                maxAmount: 300,
                name: 'Test Fee',
                value: 100,
              },
            },
          },
        },
      }

      const result = creditNoteFormHasAtLeastOneFeeChecked(formValues)

      // Should return false because creditFee takes precedence and none are checked
      expect(result).toBe(false)
    })
  })
})
