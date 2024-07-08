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

export const PayinAdvanceOptionDisabledTestMatrice = [
  // ************************
  // ****** COUNT_AGG *******
  // ************************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  // Package
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // ************************
  // *** UNIQUE_COUNT_AGG ***
  // ************************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.UniqueCountAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // ************************
  // ****** LATEST_AGG ******
  // ************************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Package
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.LatestAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // ************************
  // ****** MAX_AGG ******
  // ************************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Package
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Package,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.MaxAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  // ***********************
  // ******* SUM_AGG *******
  // ***********************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false, // Value should be true but it's hanled by parent disabled method
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.SumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // **********************
  // ** WEIGHTED_SUM_AGG **
  // **********************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true, // Value should be true but it's hanled by parent disabled method
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true, // Value should be true but it's hanled by parent disabled method
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true, // Value should be true but it's hanled by parent disabled method
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.WeightedSumAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // **********************
  // ***** CUSTOM_AGG *****
  // **********************
  // GraduatedPercentage
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.GraduatedPercentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Graduated
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Graduated,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Percentage
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Percentage,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Standard
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Standard,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: false,
  },
  // Volume
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Volume,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  // Custom
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: false,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: true,
    isRecurring: false,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: false,
    expectedDisabledValue: false,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: false,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
  {
    aggregationType: AggregationTypeEnum.CustomAgg,
    chargeModel: ChargeModelEnum.Custom,
    isPayInAdvance: true,
    isRecurring: true,
    isProrated: true,
    expectedDisabledValue: true,
  },
]
