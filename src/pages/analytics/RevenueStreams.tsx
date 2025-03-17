import { useRef } from 'react'

import RevenueStreamsBreakdownSection from '~/components/analytics/RevenueStreamsBreakdownSection'
import RevenueStreamsOverviewSection from '~/components/analytics/RevenueStreamsOverviewSection'
import { Icon, Tooltip, Typography } from '~/components/designSystem'
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
        <Tooltip placement="top-start" title={translate('text_1739204265494pq9zoax7hb0')}>
          <Icon name="info-circle" />
        </Tooltip>
      </Typography>

      <RevenueStreamsOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <RevenueStreamsBreakdownSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default RevenueStreams
