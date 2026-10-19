import { Chip } from '~/components/designSystem/Chip'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID = 'rate-phase-overridden-rate-chip'
export const RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID = 'rate-phase-active-rate-chip'

const CHIP_BY_STATE = {
  overridden: {
    className: 'border border-purple-200 bg-purple-100',
    color: 'infoMain',
    labelKey: 'text_65281f686a80b400c8e2f6dd',
    dataTest: RATE_PHASE_OVERRIDDEN_RATE_CHIP_TEST_ID,
  },
  active: {
    className: 'border border-green-200 bg-green-100',
    color: 'success600',
    labelKey: 'text_1784926682600lyzk75bbx48',
    dataTest: RATE_PHASE_ACTIVE_RATE_CHIP_TEST_ID,
  },
} as const

type RatePhaseRateChipProps = {
  isOverridden: boolean
}

export const RatePhaseRateChip = ({ isOverridden }: RatePhaseRateChipProps): JSX.Element => {
  const { translate } = useInternationalization()
  const chip = CHIP_BY_STATE[isOverridden ? 'overridden' : 'active']

  return (
    <Chip
      className={chip.className}
      color={chip.color}
      label={translate(chip.labelKey)}
      data-test={chip.dataTest}
    />
  )
}
