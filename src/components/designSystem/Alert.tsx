import { cva } from 'class-variance-authority'
import { ReactNode } from 'react'

import { Icon, IconColor, IconName } from '~/components/designSystem/Icon'
import { tw } from '~/styles/utils'

import { Button, ButtonProps as TButtonProps } from './Button'
import { Typography } from './Typography'

type AlertType = 'info' | 'success' | 'danger' | 'warning'

type AlertButtonProps = Partial<Omit<Omit<TButtonProps, 'variant' | 'icon'>, 'size'>> & {
  label: string
  'data-test'?: string
}

type AlertProps = {
  children: ReactNode
  ButtonProps?: AlertButtonProps
  className?: string
  fullWidth?: boolean
} & (
  | { type: AlertType; tone?: 'light' }
  // Dark tone: a nested Typography needs color="inherit" to stay white,
  // otherwise it falls back to textPrimary (dark text on purple-800).
  | { type: 'info'; tone: 'dark' }
)

const getIcon = (type: AlertType): { name: IconName; color: IconColor } => {
  switch (type) {
    case 'success':
      return { name: 'validate-unfilled', color: 'success' }
    case 'warning':
      return { name: 'warning-unfilled', color: 'warning' }
    case 'danger':
      return { name: 'error-unfilled', color: 'error' }
    default:
      return { name: 'info-circle', color: 'info' }
  }
}

const alertStyles = cva('rounded-xl px-4', {
  variants: {
    backgroundColor: {
      info: 'bg-purple-100',
      success: 'bg-green-100',
      danger: 'bg-red-100',
      warning: 'bg-yellow-100',
      infoDark: 'bg-purple-800',
    },
    isFullWidth: {
      true: 'w-full rounded-none',
    },
  },
})

export const Alert = ({
  ButtonProps: { label, ...ButtonProps } = {} as AlertButtonProps,
  children,
  className,
  fullWidth,
  tone = 'light',
  type,
  ...props
}: AlertProps) => {
  const iconConfig = getIcon(type)
  const isDark = tone === 'dark'

  return (
    <div
      className={tw(
        alertStyles({ backgroundColor: isDark ? 'infoDark' : type, isFullWidth: fullWidth }),
        className,
      )}
      data-test={`alert-type-${type}`}
      {...props}
    >
      <div
        className={tw('flex flex-row items-center justify-between gap-4 py-4', {
          'flex-wrap': fullWidth,
        })}
      >
        <div
          className={tw('flex flex-row items-center gap-4', {
            'min-w-0 flex-[1_1_16rem]': fullWidth,
          })}
        >
          <Icon name={iconConfig.name} color={isDark ? 'light' : iconConfig.color} />
          <Typography className="word-break-word" color={isDark ? 'white' : 'textSecondary'}>
            {children}
          </Typography>
        </div>
        {!!ButtonProps.onClick && !!label && (
          <Button
            variant={isDark ? 'quaternary-light' : 'quaternary-dark'}
            size="medium"
            {...ButtonProps}
          >
            {label}
          </Button>
        )}
      </div>
    </div>
  )
}
