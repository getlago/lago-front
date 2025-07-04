import { ReactNode } from 'react'

import { Button, ButtonVariant, Typography } from '~/components/designSystem'
import { tw } from '~/styles/utils'

export interface GenericPlaceholderProps {
  className?: string
  title?: string
  subtitle: string | ReactNode
  image: ReactNode
  buttonTitle?: string
  buttonVariant?: ButtonVariant
  buttonAction?: (() => Promise<void>) | (() => void)
  noMargins?: boolean
}

export const GenericPlaceholder = ({
  className,
  title,
  subtitle,
  image,
  buttonTitle,
  noMargins = false,
  buttonVariant,
  buttonAction,
  ...props
}: GenericPlaceholderProps) => {
  const hasButton = !!buttonTitle && !!buttonAction

  return (
    <div
      className={tw(
        'mx-auto my-0 max-w-124 px-4 pb-4 pt-12 first:mb-3 [&>img]:size-10 [&>svg]:mb-5',
        {
          'm-0': noMargins,
          'p-0': noMargins,
        },
        className,
      )}
      data-test="empty-state"
      {...props}
    >
      {image}
      {title && (
        <Typography className="mb-3" variant="subhead1">
          {title}
        </Typography>
      )}
      <Typography
        className={tw({
          'mb-5': hasButton,
        })}
      >
        {subtitle}
      </Typography>

      {hasButton && (
        <Button variant={buttonVariant} onClick={buttonAction}>
          {buttonTitle}
        </Button>
      )}
    </div>
  )
}
