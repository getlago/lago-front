import { FC, useRef } from 'react'

import { PremiumBanner } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const FreemiumAlert: FC = () => {
  const { translate } = useInternationalization()
  const premiumDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <PremiumBanner
        variant="yellow"
        buttonSize="large"
        title={translate('text_66b25adfd834ed0104345eb7')}
        description={translate('text_66b25adfd834ed0104345eb8')}
        premiumWarningDialogRef={premiumDialogRef}
        className="p-12 shadow-b"
      />

      <PremiumWarningDialog ref={premiumDialogRef} />
    </>
  )
}
