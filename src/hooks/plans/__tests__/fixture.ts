import { AggregationTypeEnum, ChargeModelEnum } from '~/generated/graphql'

const allCombobxOptionsWithoutCustom = [
  ChargeModelEnum.Graduated,
  ChargeModelEnum.GraduatedPercentage,
  ChargeModelEnum.Package,
  ChargeModelEnum.Percentage,
  ChargeModelEnum.Standard,
  ChargeModelEnum.Volume,
]

export const ComboboxTestMatrice = [
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    expectedChargesModels: [ChargeModelEnum.Custom, ...allCombobxOptionsWithoutCustom],
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom.filter(
      (option) =>
        option !== ChargeModelEnum.GraduatedPercentage && option !== ChargeModelEnum.Percentage,
    ),
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    expectedChargesModels: allCombobxOptionsWithoutCustom,
  },
]
