import { transformFilterObjectToString } from '~/components/plans/utils'
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

      it('has fromValue bigger than toValue with two range', () => {
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

  describe('filters', () => {
    describe('invalid', () => {
      it('has undefined volumeRange', () => {
        const values = [
          {
            chargeModel: ChargeModelEnum.Volume,
            billableMetric: {
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            filters: [
              {
                invoiceDisplayName: undefined,
                values: [
                  transformFilterObjectToString('key'),
                  transformFilterObjectToString('key', 'value'),
                ],
                properties: {
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            filters: [
              {
                invoiceDisplayName: undefined,
                values: [
                  transformFilterObjectToString('key'),
                  transformFilterObjectToString('key', 'value'),
                ],
                properties: {
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
              filters: [{ key: 'key', values: ['value'], id: '1' }],
            },
            values: {
              filters: [
                {
                  invoiceDisplayName: undefined,
                  values: [
                    transformFilterObjectToString('key'),
                    transformFilterObjectToString('key', 'value'),
                  ],
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
