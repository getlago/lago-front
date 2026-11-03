import { Chip } from '~/components/designSystem/Chip'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID = 'rate-phase-overridden-rate-chip'
export const RATE_PHASE_DEFAULT_RATE_CHIP_TEST_ID = 'rate-phase-default-rate-chip'
export const RATE_PHASE_NO_RATE_CHIP_TEST_ID = 'rate-phase-no-rate-chip'

export type RatePhaseRateChipStatus = 'active' | 'overridden' | 'none'

type RatePhaseRateChipProps = {
  status: RatePhaseRateChipStatus
  labelLength?: 'short' | 'long'
}

export const RatePhaseRateChip = ({
  status,
  labelLength = 'short',
}: RatePhaseRateChipProps): JSX.Element => {
  const { translate } = useInternationalization()

  if (status === 'overridden') {
    return (
      <Chip
        className="border border-purple-200 bg-purple-100"
        color="infoMain"
        label={translate(
          labelLength === 'long'
            ? 'text_1792806558676tta49m00yij'
            : 'text_65281f686a80b400c8e2f6dd',
        )}
        data-test={RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID}
      />
    )
  }

  if (status === 'none') {
    return (
      <Chip
        className="border border-grey-300 bg-grey-100"
        color="disabled"
        label={translate('text_1793644325523i8agdlzgjil')}
        data-test={RATE_PHASE_NO_RATE_CHIP_TEST_ID}
      />
    )
  }

  return (
    <Chip
      className="border border-green-200 bg-green-100"
      color="success600"
      label={translate('text_1793722839481qfcw8vdwga2')}
      data-test={RATE_PHASE_DEFAULT_RATE_CHIP_TEST_ID}
    />
  )
}
