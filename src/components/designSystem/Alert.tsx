import { Stack } from '@mui/material'
import { cx } from 'class-variance-authority'
import { ReactNode } from 'react'
import styled, { css } from 'styled-components'

import { ResponsiveStyleValue, setResponsiveProperty } from '~/core/utils/responsiveProps'
import { theme } from '~/styles'

import { Button, ButtonProps as TButtonProps } from './Button'
import { Icon, IconColor, IconName } from './Icon'
import { Typography } from './Typography'

type ContainerSize = 0 | 4 | 16 | 48

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
  children: ReactNode
  type: keyof typeof AlertType
  ButtonProps?: AlertButtonProps
  className?: string
  containerSize?: ResponsiveStyleValue<ContainerSize>
  fullWidth?: boolean
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
  ButtonProps: { label, ...ButtonProps } = {} as AlertButtonProps,
  children,
  className,
  containerSize = 16,
  fullWidth,
  type,
  ...props
}: AlertProps) => {
  const iconConfig = getIcon(type)

  return (
    <Container
      $isFullWidth={fullWidth}
      $containerSize={containerSize}
      className={cx(className, [`alert-type--${type}`])}
      data-test={`alert-type-${type}`}
      {...props}
    >
      <Stack
        direction="row"
        gap={4}
        alignItems="center"
        justifyContent="space-between"
        py={theme.spacing(4)}
      >
        <Stack direction="row" gap={4} alignItems="center">
          <Icon name={iconConfig.name} color={iconConfig.color} />
          <Content color="textSecondary">{children}</Content>
        </Stack>
        {!!ButtonProps.onClick && !!label && (
          <Button variant="quaternary-dark" size="medium" {...ButtonProps}>
            {label}
          </Button>
        )}
      </Stack>
    </Container>
  )
}

const Container = styled.div<{
  $isFullWidth?: boolean
  $containerSize: ResponsiveStyleValue<ContainerSize>
}>`
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

  ${({ $isFullWidth }) =>
    $isFullWidth &&
    css`
      border-radius: 0;
      width: 100%;
    `}

  > div {
    ${({ $containerSize }) => {
      return css`
        ${setResponsiveProperty('paddingLeft', $containerSize)}
        ${setResponsiveProperty('paddingRight', $containerSize)}
      `
    }}
  }
`

const Content = styled(Typography)`
  && {
    word-break: break-word;
  }
`
