import { cva } from 'class-variance-authority'
import { Avatar, Icon, IconName } from 'lago-design-system'
import { ReactElement, useState } from 'react'

import { tw } from '~/styles/utils'

import { Typography } from './Typography'

interface SelectorProps {
  title: string
  subtitle?: string
  icon: ReactElement | IconName
  endIcon?: IconName | ReactElement
  titleFirst?: boolean
  selected?: boolean
  className?: string
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => Promise<void> | unknown
}

const selectorVariants = cva('flex h-18 items-center rounded-xl border p-4', {
  variants: {
    selected: {
      true: 'border-blue-600 bg-blue-100',
      false: 'border-grey-400 bg-white',
    },
    disabled: {
      true: 'cursor-not-allowed bg-grey-100',
      false: 'cursor-default',
    },
    clickable: {
      true: 'cursor-pointer focus-not-active:ring',
    },
    fullWidth: {
      true: 'w-full',
      false: 'min-w-full max-w-full md:min-w-[calc(50%-32px)] md:max-w-[calc(50%-32px)]',
    },
  },
  compoundVariants: [
    {
      selected: false,
      clickable: true,
      disabled: false,
      class: 'active:bg-grey-200 hover-not-active:bg-grey-100',
    },
    {
      selected: true,
      clickable: true,
      disabled: false,
      class: 'hover-not-active:bg-blue-200',
    },
  ],
  defaultVariants: {
    fullWidth: true,
    selected: false,
  },
})

export const Selector = ({
  title,
  subtitle,
  icon,
  endIcon,
  titleFirst = true,
  className,
  selected = false,
  fullWidth = true,
  disabled = false,
  onClick,
}: SelectorProps) => {
  const [loading, setLoading] = useState(false)
  const clickable = !!onClick && !loading && !disabled

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      role="button"
      tabIndex={clickable ? 0 : -1}
      className={tw(
        selectorVariants({
          selected,
          disabled,
          clickable,
          fullWidth,
        }),
        className,
      )}
      onClick={async () => {
        if (loading || disabled) return
        const result = !!onClick && onClick()

        if (result instanceof Promise) {
          setLoading(true)
          await result
          setLoading(false)
        }
      }}
    >
      <div className="mr-3">
        {typeof icon === 'string' ? (
          <Avatar size="big" variant="connector">
            <Icon color="dark" name={icon as IconName} />
          </Avatar>
        ) : (
          icon
        )}
      </div>
      <div
        className={tw('mr-4 flex flex-1 overflow-hidden text-left', {
          'flex-col': titleFirst,
          'flex-col-reverse': !titleFirst,
        })}
      >
        <Typography
          variant={!!subtitle ? 'bodyHl' : 'body'}
          color={disabled ? 'disabled' : 'textSecondary'}
          noWrap
        >
          {title}
        </Typography>
        <Typography variant="caption" color={disabled ? 'disabled' : undefined} noWrap>
          {subtitle}
        </Typography>
      </div>
      {loading ? (
        <Icon animation="spin" color="primary" name="processing" />
      ) : typeof endIcon === 'string' ? (
        <Icon name={endIcon as IconName} color="dark" />
      ) : (
        endIcon
      )}
    </div>
  )
}

export const SELECTOR_HEIGHT = 72
