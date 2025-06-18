import { Icon } from 'lago-design-system'
import { FC, useRef } from 'react'

import { Button, Typography } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const FreemiumAlert: FC = () => {
  const { translate } = useInternationalization()
  const premiumDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <div className="flex items-center gap-4 bg-yellow-100 p-12 shadow-b">
        <div className="flex-1">
          <div className="flex flex-row items-center gap-2">
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_66b25adfd834ed0104345eb7')}
            </Typography>
            <Icon name="sparkles" />
          </div>
          <Typography variant="caption">{translate('text_66b25adfd834ed0104345eb8')}</Typography>
        </div>
        <Button
          variant="tertiary"
          size="large"
          endIcon="sparkles"
          onClick={() => premiumDialogRef.current?.openDialog()}
        >
          {translate('text_65ae73ebe3a66bec2b91d72d')}
        </Button>
      </div>

      <PremiumWarningDialog ref={premiumDialogRef} />
    </>
  )
}
