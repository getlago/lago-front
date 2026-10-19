import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

export const RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID = 'rate-phase-details-overridden'
export const RATE_PHASE_DETAIL_ITEM_TEST_ID = 'rate-phase-detail-item'

const OVERRIDDEN_VALUE_CLASSNAME = 'w-fit bg-purple-100'

type RatePhaseDetailItemProps = {
  label: string
  value: ReactNode
  isOverridden?: boolean
}

export const RatePhaseDetailItem = ({
  label,
  value,
  isOverridden = false,
}: RatePhaseDetailItemProps): JSX.Element => (
  <div className="flex min-w-0 flex-col" data-test={RATE_PHASE_DETAIL_ITEM_TEST_ID}>
    <Typography variant="captionHl" color="grey600">
      {label}
    </Typography>
    <Typography
      variant="body"
      color="grey700"
      className={tw(isOverridden && OVERRIDDEN_VALUE_CLASSNAME)}
      data-test={isOverridden ? RATE_PHASE_DETAILS_OVERRIDDEN_TEST_ID : undefined}
    >
      {value}
    </Typography>
  </div>
)
