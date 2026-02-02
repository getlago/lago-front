import { tw } from 'lago-design-system'
import { useRef } from 'react'

import { PremiumBanner } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'

type PremiumFeatureProps = {
  title: string
  description: string
  feature: string
  className?: string
  buttonClassName?: string
}

const PremiumFeature = ({
  title,
  description,
  feature,
  className,
  buttonClassName,
}: PremiumFeatureProps) => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <PremiumBanner
        variant="grey"
        title={title}
        description={description}
        feature={feature}
        dialogTitle={title}
        dialogDescription={description}
        premiumWarningDialogRef={premiumWarningDialogRef}
        className={tw('w-full rounded-xl px-6 py-4', className)}
      />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default PremiumFeature
