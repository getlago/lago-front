import { ChargeModelEnum } from '~/generated/graphql'

import { chargeSchema } from '../chargeSchema'

describe('chargeSchema Percentage', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has empty string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string fixedAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              fixedAmount: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string freeUnitsPerEvents', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              freeUnitsPerEvents: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string freeUnitsPerTotalAggregation', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              freeUnitsPerTotalAggregation: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string perTransactionMinAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string perTransactionMaxAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMaxAmount: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as strings', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: '10',
              perTransactionMaxAmount: '1',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as numbers', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: 10,
              perTransactionMaxAmount: 1,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as mixed', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: '10',
              perTransactionMaxAmount: 1,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has number rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: 1,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for strings', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: '1',
              perTransactionMaxAmount: '10',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for numbers', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: 1,
              perTransactionMaxAmount: 10,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for mixed', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            properties: {
              rate: '1',
              perTransactionMinAmount: 1,
              perTransactionMaxAmount: '10',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
    })
  })

  describe('groupProperties', () => {
    describe('invalid', () => {
      it('has empty string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string fixedAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  fixedAmount: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string freeUnitsPerEvents', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  freeUnitsPerEvents: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string freeUnitsPerTotalAggregation', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  freeUnitsPerTotalAggregation: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string perTransactionMinAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has invalid string perTransactionMaxAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMaxAmount: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as strings', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: '10',
                  perTransactionMaxAmount: '1',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as numbers', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: 10,
                  perTransactionMaxAmount: 1,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has perTransactionMinAmount higher than perTransactionMaxAmount as mixed', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: '10',
                  perTransactionMaxAmount: 1,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has string rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has number rate', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: 1,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for strings', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: '1',
                  perTransactionMaxAmount: '10',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for numbers', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: 1,
                  perTransactionMaxAmount: 10,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })

      it('has perTransactionMinAmount lower than perTransactionMaxAmount for mixed', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Percentage,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  rate: '1',
                  perTransactionMinAmount: 1,
                  perTransactionMaxAmount: '10',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
    })
  })
})
