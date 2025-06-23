import { Icon } from 'lago-design-system'
import { useRef } from 'react'

import { PrepaidCreditsOverviewSection } from '~/components/analytics/prepaidCredits/PrepaidCreditsOverviewSection'
import { Tooltip, Typography } from '~/components/designSystem'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const PrepaidCredits = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <FullscreenPage.Wrapper>
      <Typography className="flex items-center gap-2" variant="headline" color="grey700">
        {translate('text_1744192691931osnm4ckcvzj')}

        <Tooltip
          placement="top-start"
          title={translate('text_1744192691931iot1dgemqwk')}
          className="flex"
        >
          <Icon name="info-circle" className="text-grey-600" />
        </Tooltip>
      </Typography>

      <PrepaidCreditsOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default PrepaidCredits
