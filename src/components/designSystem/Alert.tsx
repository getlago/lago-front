import { ReactNode } from 'react'
import styled from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'

import { Icon, IconName, IconColor } from './Icon'
import { Typography } from './Typography'
import { Button, ButtonProps as TButtonProps } from './Button'

enum AlertType {
  info = 'info',
  success = 'success',
  danger = 'danger',
  warning = 'warning',
}

type AlertButtonProps = Partial<Omit<Omit<TButtonProps, 'variant' | 'icon'>, 'size'>> & {
  label: string
}

interface AlertProps {
  type: keyof typeof AlertType
  ButtonProps?: AlertButtonProps
  children: ReactNode
  className?: string
}

const getIcon = (type: keyof typeof AlertType): { name: IconName; color: IconColor } => {
  switch (type) {
    case AlertType.success:
      return { name: 'validate-unfilled', color: 'success' }
    case AlertType.warning:
      return { name: 'warning-unfilled', color: 'warning' }
    case AlertType.danger:
      return { name: 'error-unfilled', color: 'error' }
    default:
      return { name: 'info-circle', color: 'info' }
  }
}

export const Alert = ({
  type,
  children,
  className,
  ButtonProps: { label, ...ButtonProps } = {} as AlertButtonProps,
}: AlertProps) => {
  const iconConfig = getIcon(type)

  return (
    <Container className={clsns(className, [`alert-type--${type}`])}>
      <Icon name={iconConfig.name} color={iconConfig.color} />
      <Content color="textSecondary">{children}</Content>
      {!!ButtonProps.onClick && !!label && (
        <Button variant="quaternary-dark" size="medium" {...ButtonProps}>
          {label}
        </Button>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(4)};
  border-radius: 12px;

  &.alert-type--${AlertType.info} {
    background-color: ${theme.palette.info[100]};
  }

  &.alert-type--${AlertType.success} {
    background-color: ${theme.palette.success[100]};
  }

  &.alert-type--${AlertType.warning} {
    background-color: ${theme.palette.warning[100]};
  }

  &.alert-type--${AlertType.danger} {
    background-color: ${theme.palette.error[100]};
  }

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const Content = styled(Typography)`
  && {
    word-break: break-word;
  }
`
