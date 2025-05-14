import { useRef } from 'react'

import UsageBreakdownSection from '~/components/analytics/usage/UsageBreakdownSection'
import UsageOverviewSection from '~/components/analytics/usage/UsageOverviewSection'
import { Typography } from '~/components/designSystem'
import { Icon, Tooltip } from '~/components/designSystem'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const Usage = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <FullscreenPage.Wrapper>
      <Typography className="flex items-center gap-2" variant="headline" color="grey700">
        {translate('text_17465414264635ktqocy7leo')}

        <Tooltip
          placement="top-start"
          title={translate('text_17465414264635ktqocy7leo')}
          className="flex"
        >
          <Icon name="info-circle" className="text-grey-600" />
        </Tooltip>
      </Typography>

      <UsageOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <UsageBreakdownSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default Usage
