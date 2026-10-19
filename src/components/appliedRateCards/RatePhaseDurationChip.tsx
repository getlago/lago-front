import { Chip } from '~/components/designSystem/Chip'
import { RateOverrideInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatPhaseDuration } from './ratePhaseDisplay'

type RatePhaseDurationChipProps = {
  cycleCount: number | null
  rate: RateOverrideInput | undefined
}

export const RatePhaseDurationChip = ({
  cycleCount,
  rate,
}: RatePhaseDurationChipProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <Chip
      className="border border-grey-300 bg-grey-100"
      color="grey700"
      label={formatPhaseDuration(cycleCount, rate, translate)}
    />
  )
}
