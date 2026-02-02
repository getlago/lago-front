import { Icon } from 'lago-design-system'
import { RefObject } from 'react'

import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Button } from './Button'
import { ButtonLink } from './ButtonLink'
import { Typography } from './Typography'

type PremiumBannerVariant = 'grey' | 'yellow'
type ButtonSize = 'small' | 'medium' | 'large'

interface PremiumBannerProps {
  title: string
  description: string
  feature?: string
  variant?: PremiumBannerVariant
  buttonSize?: ButtonSize
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  mailtoLink?: string
  dialogTitle?: string
  dialogDescription?: string
  mailtoSubject?: string
  mailtoBody?: string
  className?: string
}

const getBackgroundColor = (variant: PremiumBannerVariant): string => {
  switch (variant) {
    case 'yellow':
      return 'bg-yellow-100'
    case 'grey':
    default:
      return 'bg-grey-100'
  }
}

export const PremiumBanner = ({
  title,
  description,
  feature,
  variant = 'grey',
  buttonSize = 'medium',
  premiumWarningDialogRef,
  mailtoLink,
  dialogTitle,
  dialogDescription,
  mailtoSubject,
  mailtoBody,
  className = '',
}: PremiumBannerProps) => {
  const { translate } = useInternationalization()

  const handleButtonClick = () => {
    if (premiumWarningDialogRef?.current) {
      // if custom dialog params are provided, use this
      if (dialogTitle || dialogDescription || mailtoSubject || mailtoBody) {
        premiumWarningDialogRef.current.openDialog({
          title: dialogTitle,
          description: dialogDescription,
          mailtoSubject:
            mailtoSubject ||
            (feature ? translate('text_1759493418045b173t4qhktb', { feature }) : undefined),
          mailtoBody:
            mailtoBody ||
            (feature ? translate('text_1759493745332hiuejhksn15', { feature }) : undefined),
        })
      } else {
        // otherwise just open without params
        premiumWarningDialogRef.current.openDialog()
      }
    }
  }

  const buttonContent = translate('text_65ae73ebe3a66bec2b91d72d')

  return (
    <div
      className={`flex items-center justify-between gap-4 ${getBackgroundColor(variant)} ${className}`}
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

      {mailtoLink ? (
        <ButtonLink
          buttonProps={{
            variant: 'tertiary',
            size: buttonSize,
            endIcon: 'sparkles',
          }}
          type="button"
          external
          to={mailtoLink}
        >
          {buttonContent}
        </ButtonLink>
      ) : (
        <Button endIcon="sparkles" variant="tertiary" size={buttonSize} onClick={handleButtonClick}>
          {buttonContent}
        </Button>
      )}
    </div>
  )
}


