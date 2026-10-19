import { Chip } from '~/components/designSystem/Chip'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID = 'rate-phase-overridden-rate-chip'
export const RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID = 'rate-phase-active-rate-chip'

type RatePhaseRateChipProps = {
  isOverridden: boolean
}

export const RatePhaseRateChip = ({ isOverridden }: RatePhaseRateChipProps): JSX.Element => {
  const { translate } = useInternationalization()

  if (isOverridden) {
    return (
      <Chip
        className="border border-purple-200 bg-purple-100"
        color="infoMain"
        label={translate('text_65281f686a80b400c8e2f6dd')}
        data-test={RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID}
      />
    )
  }

  return (
    <Chip
      className="border border-green-200 bg-green-100"
      color="success600"
      label={translate('text_1784926682600lyzk75bbx48')}
      data-test={RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID}
    />
  )
}
