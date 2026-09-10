import {
  AggregationTypeEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
} from '~/generated/graphql'

import {
  getAvailableRateModels,
  isRateCardProrationSupported,
  RateModelConfiguration,
} from '../rateModelAvailability'

const matrixRows = [
  {
    row: 3,
    aggregationType: AggregationTypeEnum.CountAgg,
    recurring: false,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard'],
  },
  {
    row: 4,
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    recurring: false,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard'],
  },
  {
    row: 5,
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    recurring: true,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard'],
  },
  {
    row: 6,
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    recurring: true,
    proration: true,
    arrears: ['graduated', 'standard', 'volume'],
    advance: ['standard'],
  },
  {
    row: 7,
    aggregationType: AggregationTypeEnum.LatestAgg,
    recurring: false,
    proration: false,
    arrears: ['graduated', 'package', 'standard', 'volume'],
    advance: [],
  },
  {
    row: 8,
    aggregationType: AggregationTypeEnum.MaxAgg,
    recurring: false,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: [],
  },
  {
    row: 9,
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
    proration: false,
    arrears: [
      'dynamic',
      'graduated',
      'graduated_percentage',
      'package',
      'percentage',
      'standard',
      'volume',
    ],
    advance: ['dynamic', 'graduated', 'graduated_percentage', 'package', 'percentage', 'standard'],
  },
  {
    row: 10,
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: true,
    proration: false,
    arrears: [
      'dynamic',
      'graduated',
      'graduated_percentage',
      'package',
      'percentage',
      'standard',
      'volume',
    ],
    advance: ['dynamic', 'graduated', 'graduated_percentage', 'package', 'percentage', 'standard'],
  },
  {
    row: 11,
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: true,
    proration: true,
    arrears: ['graduated', 'standard', 'volume'],
    advance: ['standard'],
  },
  {
    row: 12,
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    recurring: false,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: [],
  },
  {
    row: 13,
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    recurring: true,
    proration: false,
    arrears: ['graduated', 'graduated_percentage', 'package', 'percentage', 'standard', 'volume'],
    advance: [],
  },
  {
    row: 14,
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    recurring: true,
    proration: true,
    arrears: [],
    advance: [],
  },
  {
    row: 25,
    productType: ProductTypeEnum.Fixed,
    proration: false,
    arrears: ['graduated', 'standard', 'volume'],
    advance: ['graduated', 'standard'],
  },
  {
    row: 26,
    productType: ProductTypeEnum.Fixed,
    proration: true,
    arrears: ['graduated', 'standard', 'volume'],
    advance: ['standard'],
  },
]

describe('getAvailableRateModels', () => {
  describe.each(matrixRows)('workbook row $row', (row) => {
    it.each([RateCardBillingTimingEnum.Arrears, RateCardBillingTimingEnum.Advance])(
      'returns the approved %s models',
      (billingTiming) => {
        expect(
          getAvailableRateModels({ productType: ProductTypeEnum.Usage, ...row, billingTiming }),
        ).toEqual(row[billingTiming])
      },
    )
  })

  it.each([
    {
      recurring: false,
      proration: false,
      billingTiming: RateCardBillingTimingEnum.Arrears,
      expected: [
        'custom',
        'graduated',
        'graduated_percentage',
        'package',
        'percentage',
        'standard',
        'volume',
      ],
    },
    {
      recurring: true,
      proration: false,
      billingTiming: RateCardBillingTimingEnum.Advance,
      expected: [
        'custom',
        'graduated',
        'graduated_percentage',
        'package',
        'percentage',
        'standard',
      ],
    },
    {
      recurring: true,
      proration: true,
      billingTiming: RateCardBillingTimingEnum.Arrears,
      expected: ['graduated', 'standard', 'volume'],
    },
    {
      recurring: true,
      proration: true,
      billingTiming: RateCardBillingTimingEnum.Advance,
      expected: ['standard'],
    },
    {
      recurring: false,
      proration: true,
      billingTiming: RateCardBillingTimingEnum.Arrears,
      expected: [],
    },
    {
      recurring: false,
      proration: true,
      billingTiming: RateCardBillingTimingEnum.Advance,
      expected: [],
    },
  ])(
    'keeps Custom backend parity for $billingTiming, recurring=$recurring, proration=$proration',
    ({ expected, ...configuration }) => {
      expect(
        getAvailableRateModels({
          productType: ProductTypeEnum.Usage,
          aggregationType: AggregationTypeEnum.CustomAgg,
          ...configuration,
        }),
      ).toEqual(expected)
    },
  )

  const completeUsage: RateModelConfiguration = {
    productType: ProductTypeEnum.Usage,
    aggregationType: AggregationTypeEnum.SumAgg,
    recurring: false,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    proration: false,
  }

  it.each([undefined, null])(
    'does not treat unresolved recurrence %s as non-recurring',
    (recurring) => {
      expect(getAvailableRateModels({ ...completeUsage, recurring })).toBeUndefined()
    },
  )

  it('distinguishes missing product metadata from no compatible models', () => {
    expect(getAvailableRateModels()).toBeUndefined()
    expect(getAvailableRateModels({ ...completeUsage, aggregationType: undefined })).toBeUndefined()
    expect(getAvailableRateModels({ ...completeUsage, proration: true })).toEqual([])
  })
})

describe('isRateCardProrationSupported', () => {
  it.each([
    { productType: ProductTypeEnum.Fixed, expected: true },
    {
      productType: ProductTypeEnum.Usage,
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: true,
      expected: true,
    },
    {
      productType: ProductTypeEnum.Usage,
      aggregationType: AggregationTypeEnum.SumAgg,
      recurring: false,
      expected: false,
    },
    {
      productType: ProductTypeEnum.Usage,
      aggregationType: AggregationTypeEnum.WeightedSumAgg,
      recurring: true,
      expected: false,
    },
    {
      productType: ProductTypeEnum.Usage,
      aggregationType: AggregationTypeEnum.SumAgg,
      expected: undefined,
    },
  ])(
    'resolves proration support for $productType/$aggregationType/$recurring',
    ({ expected, ...product }) => {
      expect(isRateCardProrationSupported(product)).toBe(expected)
    },
  )
})
