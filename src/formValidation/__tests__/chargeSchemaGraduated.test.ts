import { ChargeModelEnum } from '~/generated/graphql'

import { chargeSchema } from '../chargeSchema'

describe('chargeSchema Graduated', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has undefined graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: undefined,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has empty graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has wrong perUnitAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '0',
                  toValue: '100',
                  perUnitAmount: 'a',
                  flatAmount: '1',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has wrong flatAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '0',
                  toValue: '100',
                  perUnitAmount: '1',
                  flatAmount: 'a',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has wrong perUnitAmount and flatAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '0',
                  toValue: '100',
                  perUnitAmount: 'a',
                  flatAmount: 'a',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has fromValue bigger than toValue with one range', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '100',
                  toValue: '10',
                  perUnitAmount: '1',
                  flatAmount: '1',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has fromValue bigger than toValue with two range', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '1',
                  toValue: '10',
                  perUnitAmount: '1',
                  flatAmount: '1',
                },
                {
                  fromValue: '100',
                  toValue: '10',
                  perUnitAmount: '1',
                  flatAmount: '1',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has fromValue equal than toValue', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '100',
                  toValue: '100',
                  perUnitAmount: '1',
                  flatAmount: 'a',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has valid graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            properties: {
              graduatedRange: [
                {
                  fromValue: '1',
                  toValue: '100',
                  perUnitAmount: '1',
                  flatAmount: '1',
                },
                {
                  fromValue: '101',
                  toValue: '1000',
                  perUnitAmount: '1',
                  flatAmount: '1',
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
  })

  describe('groupProperties', () => {
    describe('invalid', () => {
      it('has undefined graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  graduatedRange: undefined,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has empty graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  graduatedRange: [],
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has wrong perUnitAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '0',
                        toValue: '100',
                        perUnitAmount: 'a',
                        flatAmount: '1',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has wrong flatAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '0',
                        toValue: '100',
                        perUnitAmount: '1',
                        flatAmount: 'a',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has wrong perUnitAmount and flatAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '0',
                        toValue: '100',
                        perUnitAmount: 'a',
                        flatAmount: 'a',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has fromValue bigger than toValue', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '100',
                        toValue: '10',
                        perUnitAmount: '1',
                        flatAmount: '1',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has fromValue bigger than toValue with two range', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '1',
                        toValue: '10',
                        perUnitAmount: '1',
                        flatAmount: '1',
                      },
                      {
                        fromValue: '100',
                        toValue: '10',
                        perUnitAmount: '1',
                        flatAmount: '1',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })

      it('has fromValue equal than toValue', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '100',
                        toValue: '100',
                        perUnitAmount: '1',
                        flatAmount: 'a',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
    describe('valid', () => {
      it('has valid graduatedRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Graduated,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    graduatedRange: [
                      {
                        fromValue: '1',
                        toValue: '100',
                        perUnitAmount: '1',
                        flatAmount: '1',
                      },
                      {
                        fromValue: '101',
                        toValue: '1000',
                        perUnitAmount: '1',
                        flatAmount: '1',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
    })
  })
})
