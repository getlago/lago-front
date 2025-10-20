import { FC } from 'react'

import { Typography } from '~/components/designSystem'
import { Radio } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface ChargePayInAdvanceOptionProps {
  chargePayInAdvanceDescription: string | undefined
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
  chargePayInAdvanceDescription,
  disabled,
  isPayInAdvanceOptionDisabled,
  payInAdvance,
  handleUpdate,
}) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="captionHl" color="textSecondary" component="legend">
          {translate('text_6682c52081acea90520743a8')}
        </Typography>
        {!!chargePayInAdvanceDescription && (
          <Typography variant="caption">{chargePayInAdvanceDescription}</Typography>
        )}
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
