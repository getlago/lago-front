import { useRef } from 'react'

import UsageBreakdownSection from '~/components/analytics/usage/UsageBreakdownSection'
import UsageOverviewSection from '~/components/analytics/usage/UsageOverviewSection'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'

const Usage = () => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <FullscreenPage.Wrapper>
      <UsageOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <UsageBreakdownSection premiumWarningDialogRef={premiumWarningDialogRef} />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default Usage
