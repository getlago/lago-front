import { AggregationTypeEnum } from '~/generated/graphql'
import { getAggregationTypeOptions } from '~/pages/createBillableMetric/aggregationTypeOptions'

const translate = (key: string): string => key

const valuesOf = (overrides: Partial<Parameters<typeof getAggregationTypeOptions>[0]> = {}) =>
  getAggregationTypeOptions({
    recurring: false,
    isEdition: false,
    aggregationType: undefined,
    translate,
    ...overrides,
  }).map(({ value }) => value)

describe('getAggregationTypeOptions', () => {
  describe('GIVEN a non-recurring metric', () => {
    describe('WHEN building the options', () => {
      it('THEN should offer every aggregation, in the displayed order', () => {
        expect(valuesOf()).toEqual([
          AggregationTypeEnum.CountAgg,
          AggregationTypeEnum.UniqueCountAgg,
          AggregationTypeEnum.LatestAgg,
          AggregationTypeEnum.MaxAgg,
          AggregationTypeEnum.SumAgg,
          AggregationTypeEnum.WeightedSumAgg,
        ])
      })
    })
  })

  describe('GIVEN a recurring metric', () => {
    describe('WHEN building the options', () => {
      it('THEN should drop the aggregations that cannot carry over a period', () => {
        expect(valuesOf({ recurring: true })).toEqual([
          AggregationTypeEnum.UniqueCountAgg,
          AggregationTypeEnum.SumAgg,
          AggregationTypeEnum.WeightedSumAgg,
        ])
      })
    })
  })

  describe('GIVEN the custom aggregation', () => {
    describe('WHEN editing a metric that already uses it', () => {
      it('THEN should append it so the field can render its own value', () => {
        expect(
          valuesOf({ isEdition: true, aggregationType: AggregationTypeEnum.CustomAgg }),
        ).toContain(AggregationTypeEnum.CustomAgg)
      })
    })

    describe('WHEN creating a metric, or editing one that does not use it', () => {
      it.each([
        ['creating', { isEdition: false, aggregationType: AggregationTypeEnum.CustomAgg }],
        [
          'editing another aggregation',
          { isEdition: true, aggregationType: AggregationTypeEnum.SumAgg },
        ],
      ])('THEN should not offer it when %s', (_label, overrides) => {
        expect(valuesOf(overrides)).not.toContain(AggregationTypeEnum.CustomAgg)
      })
    })
  })

  describe('GIVEN the weighted sum aggregation', () => {
    describe('WHEN building the options', () => {
      it('THEN should be the only one carrying a custom label node', () => {
        const withLabelNode = getAggregationTypeOptions({
          recurring: false,
          isEdition: false,
          aggregationType: undefined,
          translate,
        }).filter((option) => !!option.labelNode)

        expect(withLabelNode.map(({ value }) => value)).toEqual([
          AggregationTypeEnum.WeightedSumAgg,
        ])
      })
    })
  })
})
