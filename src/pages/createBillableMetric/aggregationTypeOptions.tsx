import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem } from '~/components/form'
import { formatAggregationType } from '~/core/formats/formatBillableMetricsItems'
import { AggregationTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

type AggregationTypeOption = {
  label: string
  value: AggregationTypeEnum
  labelNode?: JSX.Element
}

// Recurring metrics only support aggregations that carry over between periods.
const NON_RECURRING_ONLY = [
  AggregationTypeEnum.CountAgg,
  AggregationTypeEnum.LatestAgg,
  AggregationTypeEnum.MaxAgg,
]

export const isNonRecurringOnly = (aggregationType?: AggregationTypeEnum): boolean =>
  !!aggregationType && NON_RECURRING_ONLY.includes(aggregationType)

const SELECTABLE_AGGREGATION_TYPES = [
  AggregationTypeEnum.CountAgg,
  AggregationTypeEnum.UniqueCountAgg,
  AggregationTypeEnum.LatestAgg,
  AggregationTypeEnum.MaxAgg,
  AggregationTypeEnum.SumAgg,
  AggregationTypeEnum.WeightedSumAgg,
]

export const getAggregationTypeOptions = ({
  recurring,
  isEdition,
  aggregationType,
  translate,
}: {
  recurring: boolean
  isEdition: boolean
  aggregationType: AggregationTypeEnum | undefined
  translate: TranslateFunc
}): AggregationTypeOption[] => {
  const toOption = (type: AggregationTypeEnum): AggregationTypeOption => ({
    label: translate(formatAggregationType(type)?.label || ''),
    value: type,
  })

  const options = SELECTABLE_AGGREGATION_TYPES.filter(
    (type) => !recurring || !isNonRecurringOnly(type),
  ).map(toOption)

  // `CustomAgg` is never offered: it can only be created through the API, and is
  // listed solely so an existing metric using it renders its own value.
  if (isEdition && aggregationType === AggregationTypeEnum.CustomAgg) {
    options.push(toOption(AggregationTypeEnum.CustomAgg))
  }

  return options.map((option) =>
    option.value === AggregationTypeEnum.WeightedSumAgg
      ? {
          ...option,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {option.label}
              </Typography>
            </ComboboxItem>
          ),
        }
      : option,
  )
}
