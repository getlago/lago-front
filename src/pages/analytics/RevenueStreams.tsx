import { Icon } from 'lago-design-system'
import { useRef } from 'react'

import { RevenueStreamsBreakdownSection } from '~/components/analytics/revenueStreams/RevenueStreamsBreakdownSection'
import { RevenueStreamsOverviewSection } from '~/components/analytics/revenueStreams/RevenueStreamsOverviewSection'
import { Tooltip, Typography } from '~/components/designSystem'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const RevenueStreams = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <FullscreenPage.Wrapper>
      <Typography className="flex items-center gap-2" variant="headline" color="grey700">
        {translate('text_1739203651003n5f5qzxnhin')}
        <Tooltip
          placement="top-start"
          title={translate('text_1739204265494pq9zoax7hb0')}
          className="flex" //Note: flex is used to shrink the container so have a better tooltip placement
        >
          <Icon name="info-circle" className="text-grey-600" />
        </Tooltip>
      </Typography>

      <RevenueStreamsOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <RevenueStreamsBreakdownSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default RevenueStreams
