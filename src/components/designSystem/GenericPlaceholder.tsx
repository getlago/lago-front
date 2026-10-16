import { ReactNode } from 'react'

import { Button, ButtonVariant } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

// Test ID constants
export const GENERIC_PLACEHOLDER_TEST_ID = 'empty-state'
export const GENERIC_PLACEHOLDER_TITLE_TEST_ID = 'generic-placeholder-title'
export const GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID = 'generic-placeholder-subtitle'
export const GENERIC_PLACEHOLDER_IMAGE_TEST_ID = 'generic-placeholder-image'
export const GENERIC_PLACEHOLDER_BUTTON_TEST_ID = 'generic-placeholder-button'
export const GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID = 'generic-placeholder-secondary-button'

type GenericPlaceholderButtonAction = (() => Promise<void>) | (() => void)

type GenericPlaceholderButtonsProps =
  | {
      buttonTitle?: string
      buttonAction?: GenericPlaceholderButtonAction
      secondaryButtonTitle?: never
      secondaryButtonAction?: never
    }
  | {
      buttonTitle: string
      buttonAction: GenericPlaceholderButtonAction
      secondaryButtonTitle: string
      secondaryButtonAction: GenericPlaceholderButtonAction
    }

type GenericPlaceholderBaseProps = {
  className?: string
  title?: string
  subtitle: string | ReactNode
  image: ReactNode
  buttonVariant?: ButtonVariant
  noMargins?: boolean
}

export type GenericPlaceholderProps = GenericPlaceholderBaseProps & GenericPlaceholderButtonsProps

// `Omit<GenericPlaceholderProps, 'image'>` would flatten the buttons union and no longer spread back.
export type GenericPlaceholderContentProps = Omit<GenericPlaceholderBaseProps, 'image'> &
  GenericPlaceholderButtonsProps

export const GenericPlaceholder = ({
  className,
  title,
  subtitle,
  image,
  buttonTitle,
  noMargins = false,
  buttonVariant,
  buttonAction,
  secondaryButtonTitle,
  secondaryButtonAction,
  ...props
}: GenericPlaceholderProps) => {
  const hasButton = !!buttonTitle && !!buttonAction

  const renderButtons = (): ReactNode => {
    if (!hasButton) return null

    const primaryButton = (
      <Button
        variant={buttonVariant}
        onClick={buttonAction}
        data-test={GENERIC_PLACEHOLDER_BUTTON_TEST_ID}
      >
        {buttonTitle}
      </Button>
    )

    if (!secondaryButtonTitle || !secondaryButtonAction) return primaryButton

    return (
      <div className="flex flex-wrap gap-3">
        {primaryButton}
        <Button
          variant="quaternary"
          onClick={secondaryButtonAction}
          data-test={GENERIC_PLACEHOLDER_SECONDARY_BUTTON_TEST_ID}
        >
          {secondaryButtonTitle}
        </Button>
      </div>
    )
  }

  return (
    <div
      className={tw(
        'mx-auto my-0 max-w-124 px-4 pb-4 pt-12 first:mb-3',
        {
          'm-0': noMargins,
          'p-0': noMargins,
        },
        className,
      )}
      data-test={GENERIC_PLACEHOLDER_TEST_ID}
      {...props}
    >
      <div
        className="mb-1 [&>img]:size-35 [&>svg]:size-35"
        data-test={GENERIC_PLACEHOLDER_IMAGE_TEST_ID}
      >
        {image}
      </div>

      {title && (
        <Typography
          className="mb-3"
          variant="subhead1"
          data-test={GENERIC_PLACEHOLDER_TITLE_TEST_ID}
        >
          {title}
        </Typography>
      )}
      <Typography
        className={tw({
          'mb-5': hasButton,
        })}
        html={typeof subtitle === 'string' ? subtitle : undefined}
        data-test={GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID}
      >
        {typeof subtitle === 'string' ? undefined : subtitle}
      </Typography>

      {renderButtons()}
    </div>
  )
}

GenericPlaceholder.displayName = 'GenericPlaceholder'
