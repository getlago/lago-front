import { ChargeModelEnum } from '~/generated/graphql'

import { chargeSchema } from '../chargeSchema'

describe('chargeSchema Package', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has empty string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: '',
              packageSize: '1',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: 'a',
              packageSize: '1',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has empty string packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: '1',
              packageSize: '',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: '1',
              packageSize: 'a',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has too small  packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: '1',
              packageSize: '0.99',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: '1',
              packageSize: '1',
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has number value', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            properties: {
              amount: 1,
              packageSize: 1,
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
      it('has empty string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: '',
                  packageSize: '1',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: 'a',
                  packageSize: '1',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has empty string packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: '1',
                  packageSize: '',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has invalid string packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: '1',
                  packageSize: 'a',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has too small  packageSize', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: '1',
                  packageSize: '0.99',
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
      it('has string amount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: '1',
                  packageSize: '1',
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeTruthy()
      })
      it('has string value', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Package,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  amount: 1,
                  packageSize: 1,
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
