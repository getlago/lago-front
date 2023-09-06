import { ChargeModelEnum } from '~/generated/graphql'

import { chargeSchema } from '../chargeSchema'

describe('chargeSchema Volume', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has undefined volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: undefined,
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has empty volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [],
            },
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has wrong perUnitAmount', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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

      it.only('has fromValue bigger than toValue with two range', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
      it('has valid volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            properties: {
              volumeRange: [
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
      it('has undefined volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  volumeRange: undefined,
                },
              },
            ],
          },
        ]
        const result = chargeSchema.isValidSync(values)

        expect(result).toBeFalsy()
      })
      it('has empty volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            groupProperties: [
              {
                values: {
                  volumeRange: [],
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
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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

      it('has fromValue bigger than toValue with one range', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
      it('has valid volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              flatGroups: [{}],
            },
            values: {
              groupProperties: [
                {
                  values: {
                    volumeRange: [
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
