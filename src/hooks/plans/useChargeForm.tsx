import { Icon } from 'lago-design-system'

import { Typography } from '~/components/designSystem'
import { BasicComboBoxData } from '~/components/form'
import { AggregationTypeEnum, ChargeModelEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type TGetUsageChargeModelComboboxDataProps = {
  isPremium: boolean
  aggregationType: AggregationTypeEnum
}

export type TGetIsPayInAdvanceOptionDisabledForUsageChargeProps = {
  aggregationType: AggregationTypeEnum
  chargeModel: ChargeModelEnum
  isPayInAdvance: boolean
  isProrated: boolean
  isRecurring: boolean
}

export type TGetIsProRatedOptionDisabledForUsageChargeProps = {
  aggregationType: AggregationTypeEnum
  chargeModel: ChargeModelEnum
  isPayInAdvance: boolean
}

export type TGetIsAbleToSwitchToProRatedProps = {
  aggregationType: AggregationTypeEnum
  chargeModel: ChargeModelEnum
  isPayInAdvance: boolean
}

type TUseChargeFormReturn = {
  getUsageChargeModelComboboxData: (
    data: TGetUsageChargeModelComboboxDataProps,
  ) => BasicComboBoxData[]
  getIsPayInAdvanceOptionDisabled: (
    data: TGetIsPayInAdvanceOptionDisabledForUsageChargeProps,
  ) => boolean
  getIsProRatedOptionDisabled: (data: TGetIsProRatedOptionDisabledForUsageChargeProps) => boolean
}

export const useChargeForm: () => TUseChargeFormReturn = () => {
  const { translate } = useInternationalization()

  const getUsageChargeModelComboboxData = ({
    isPremium,
    aggregationType,
  }: TGetUsageChargeModelComboboxDataProps): BasicComboBoxData[] => {
    const chargeModelComboboxData: BasicComboBoxData[] = [
      {
        label: translate('text_62793bbb599f1c01522e919f'),
        value: ChargeModelEnum.Graduated,
      },
      {
        label: translate('text_6282085b4f283b0102655868'),
        value: ChargeModelEnum.Package,
      },
      {
        label: translate('text_624aa732d6af4e0103d40e6f'),
        value: ChargeModelEnum.Standard,
      },
      {
        label: translate('text_6304e74aab6dbc18d615f386'),
        value: ChargeModelEnum.Volume,
      },
    ]

    if (aggregationType !== AggregationTypeEnum.LatestAgg) {
      chargeModelComboboxData.push(
        {
          labelNode: (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Typography variant="body" color="grey700">
                  {translate('text_64de472463e2da6b31737db0')}
                </Typography>
              </div>
              {!isPremium && <Icon name="sparkles" />}
            </div>
          ),
          label: translate('text_64de472463e2da6b31737db0'),
          value: ChargeModelEnum.GraduatedPercentage,
        },
        {
          label: translate('text_62a0b7107afa2700a65ef6e2'),
          value: ChargeModelEnum.Percentage,
        },
      )
    }

    if (aggregationType === AggregationTypeEnum.CustomAgg) {
      chargeModelComboboxData.push({
        label: translate('text_663dea5702b60301d8d064fa'),
        value: ChargeModelEnum.Custom,
      })
    }

    if (aggregationType === AggregationTypeEnum.SumAgg) {
      chargeModelComboboxData.push({
        label: translate('text_1727711520232zpp50zgnam5'),
        value: ChargeModelEnum.Dynamic,
      })
    }

    return chargeModelComboboxData.sort((a, b) => {
      return a.label && b.label ? a.label.localeCompare(b.label) : a.value.localeCompare(b.value)
    })
  }

  const getIsPayInAdvanceOptionDisabledForUsageCharge = ({
    aggregationType,
    chargeModel,
    // NOTE: keeping isPayInAdvance for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isPayInAdvance,
    isProrated,
    isRecurring,
  }: TGetIsPayInAdvanceOptionDisabledForUsageChargeProps): boolean => {
    if (
      aggregationType === AggregationTypeEnum.CountAgg &&
      chargeModel === ChargeModelEnum.Volume
    ) {
      return true
    } else if (aggregationType === AggregationTypeEnum.UniqueCountAgg) {
      if (
        chargeModel === ChargeModelEnum.Volume ||
        (chargeModel === ChargeModelEnum.Graduated && isProrated)
      ) {
        return true
      }
    } else if (aggregationType === AggregationTypeEnum.LatestAgg) {
      return true
    } else if (aggregationType === AggregationTypeEnum.MaxAgg) {
      return true
    } else if (aggregationType === AggregationTypeEnum.SumAgg) {
      if (chargeModel === ChargeModelEnum.Volume) {
        return true
      } else if (chargeModel === ChargeModelEnum.Graduated && isRecurring && isProrated) {
        return true
      }
    } else if (aggregationType === AggregationTypeEnum.WeightedSumAgg) {
      return true
    } else if (aggregationType === AggregationTypeEnum.CustomAgg) {
      if (chargeModel !== ChargeModelEnum.Standard && isRecurring && isProrated) {
        return true
      }
    }

    // Enabled by default
    return false
  }

  const getIsProRatedOptionDisabledForUsageCharge = ({
    aggregationType,
    chargeModel,
    isPayInAdvance,
  }: TGetIsProRatedOptionDisabledForUsageChargeProps): boolean => {
    if (aggregationType === AggregationTypeEnum.UniqueCountAgg) {
      if (
        chargeModel === ChargeModelEnum.GraduatedPercentage ||
        chargeModel === ChargeModelEnum.Package ||
        chargeModel === ChargeModelEnum.Percentage
      ) {
        return true
      }

      if (isPayInAdvance && chargeModel === ChargeModelEnum.Graduated) {
        return true
      }
    } else if (aggregationType === AggregationTypeEnum.SumAgg) {
      if (
        chargeModel === ChargeModelEnum.GraduatedPercentage ||
        chargeModel === ChargeModelEnum.Package ||
        chargeModel === ChargeModelEnum.Percentage ||
        chargeModel === ChargeModelEnum.Dynamic
      ) {
        return true
      }

      if (isPayInAdvance && chargeModel === ChargeModelEnum.Graduated) {
        return true
      }
    } else if (aggregationType === AggregationTypeEnum.WeightedSumAgg) {
      return true
    } else if (aggregationType === AggregationTypeEnum.CustomAgg) {
      if (
        chargeModel === ChargeModelEnum.GraduatedPercentage ||
        chargeModel === ChargeModelEnum.Package ||
        chargeModel === ChargeModelEnum.Percentage ||
        chargeModel === ChargeModelEnum.Custom
      ) {
        return true
      }

      if (
        isPayInAdvance &&
        (chargeModel === ChargeModelEnum.Graduated || chargeModel === ChargeModelEnum.Volume)
      ) {
        return true
      }
    }

    // Enabled by default
    return false
  }

  return {
    getUsageChargeModelComboboxData,
    getIsPayInAdvanceOptionDisabled: getIsPayInAdvanceOptionDisabledForUsageCharge,
    getIsProRatedOptionDisabled: getIsProRatedOptionDisabledForUsageCharge,
  }
}
