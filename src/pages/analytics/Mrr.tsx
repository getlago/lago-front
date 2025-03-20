import { useRef } from 'react'

import { MrrBreakdownSection } from '~/components/analytics/mrr/MrrBreakdownSection'
import { Typography } from '~/components/designSystem'
import { Icon, Tooltip } from '~/components/designSystem'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const Mrr = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <FullscreenPage.Wrapper>
      <Typography className="flex items-center gap-2" variant="headline" color="grey700">
        {translate('text_1742467279081qp2hoida9d5')}
        <Tooltip placement="top-start" title={translate('text_1742467279081fgvkpgka073')}>
          <Icon name="info-circle" />
        </Tooltip>
      </Typography>

      <MrrBreakdownSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default Mrr
