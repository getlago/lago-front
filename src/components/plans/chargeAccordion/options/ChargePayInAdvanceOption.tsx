import { FC, useMemo } from 'react'

import { Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { AggregationTypeEnum, ChargeModelEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface ChargePayInAdvanceOptionProps {
  billableMetricAggregationType: AggregationTypeEnum
  chargeModel: ChargeModelEnum
  disabled?: boolean
  isPayInAdvanceOptionDisabled: boolean
  payInAdvance: boolean
  handleUpdate: ({
    invoiceable,
    payInAdvance,
    regroupPaidFees,
  }: {
    payInAdvance: boolean
    invoiceable?: boolean
    regroupPaidFees?: null
  }) => void
}

export const ChargePayInAdvanceOption: FC<ChargePayInAdvanceOptionProps> = ({
  billableMetricAggregationType,
  chargeModel,
  disabled,
  isPayInAdvanceOptionDisabled,
  payInAdvance,
  handleUpdate,
}) => {
  const { translate } = useInternationalization()

  const chargePayInAdvanceDescription = useMemo(() => {
    if (chargeModel === ChargeModelEnum.Volume) {
      return translate('text_6669b493fae79a0095e639bc')
    } else if (billableMetricAggregationType === AggregationTypeEnum.MaxAgg) {
      return translate('text_6669b493fae79a0095e63986')
    } else if (billableMetricAggregationType === AggregationTypeEnum.LatestAgg) {
      return translate('text_6669b493fae79a0095e639a1')
    }

    return translate('text_6661fc17337de3591e29e435')
  }, [chargeModel, billableMetricAggregationType, translate])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <Typography variant="captionHl" color="textSecondary" component="legend">
          {translate('text_6682c52081acea90520743a8')}
        </Typography>
        <Typography variant="caption">{chargePayInAdvanceDescription}</Typography>
      </div>

      <div className="flex flex-col gap-2">
        <Radio
          checked={!payInAdvance}
          disabled={disabled}
          label={translate('text_6682c52081acea90520743ac')}
          labelVariant="body"
          onChange={() => {
            handleUpdate({ invoiceable: true, payInAdvance: false, regroupPaidFees: null })
          }}
          value={!payInAdvance}
        />
        <Radio
          checked={payInAdvance}
          disabled={isPayInAdvanceOptionDisabled || disabled}
          label={translate('text_6682c52081acea90520744c8')}
          labelVariant="body"
          onChange={() => {
            handleUpdate({ payInAdvance: true })
          }}
          value={payInAdvance}
        />
      </div>
    </div>
  )
}
