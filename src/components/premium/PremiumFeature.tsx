import { Button, Icon, tw, Typography } from 'lago-design-system'
import { useRef } from 'react'

import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type PremiumFeatureProps = {
  title: string
  description: string
  feature: string
  className?: string
}

const PremiumFeature = ({ title, description, feature, className }: PremiumFeatureProps) => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <div
        className={tw(
          'flex w-full flex-row items-center justify-between gap-2 rounded-xl bg-grey-100 px-6 py-4',
          className,
        )}
      >
        <div className="flex flex-col">
          <div className="flex flex-row items-center gap-2">
            <Typography variant="bodyHl" color="grey700">
              {title}
            </Typography>

            <Icon name="sparkles" />
          </div>

          <Typography variant="caption" color="grey600">
            {description}
          </Typography>
        </div>

        <Button
          endIcon="sparkles"
          variant="tertiary"
          onClick={() =>
            premiumWarningDialogRef.current?.openDialog({
              title,
              description,
              mailtoSubject: translate('text_1759493418045b173t4qhktb', {
                feature,
              }),
              mailtoBody: translate('text_1759493745332hiuejhksn15', {
                feature,
              }),
            })
          }
        >
          {translate('text_65ae73ebe3a66bec2b91d72d')}
        </Button>
      </div>
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default PremiumFeature
