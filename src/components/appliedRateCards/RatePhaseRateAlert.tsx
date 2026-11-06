import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatDateTime } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type RatePhaseRateAlertProps =
  { variant: 'none'; onOverride: () => void } | { variant: 'pending'; effectiveFrom: string }

export const RatePhaseRateAlert = (props: RatePhaseRateAlertProps): JSX.Element => {
  const { translate } = useInternationalization()

  if (props.variant === 'pending') {
    return (
      <Alert type="info">
        <div className="flex flex-col gap-1">
          <Typography variant="bodyHl" color="grey700">
            {translate('text_179364432552375olu7n6lbx')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_1793644325523elkf1drglgo', {
              effectiveDate: intlFormatDateTime(props.effectiveFrom, {
                timezone: TimezoneEnum.TzUtc,
              }).date,
            })}
          </Typography>
        </div>
      </Alert>
    )
  }

  return (
    <Alert
      type="info"
      ButtonProps={{
        label: translate('text_1793644325523lgwtnurckmk'),
        onClick: props.onOverride,
      }}
    >
      <div className="flex flex-col gap-1">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1793644325522dqe8jr97x7g')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1793644325523uoopxvqfabt')}
        </Typography>
      </div>
    </Alert>
  )
}
