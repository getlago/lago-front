import { ReactElement, useState } from 'react'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { IconName, Icon } from './Icon'
import { Typography } from './Typography'
import { Skeleton } from './Skeleton'
import { Avatar } from './Avatar'

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
  onClick: () => Promise<void> | unknown
}

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

  return (
    <Container
      className={className}
      onClick={async () => {
        if (loading || disabled) return
        let result = onClick()

        if (result instanceof Promise) {
          setLoading(true)
          await result
          setLoading(false)
        }
      }}
      $clickable={!!onClick && !loading}
      $selected={selected}
      $disabled={disabled}
      $fullWidth={fullWidth}
    >
      <MainIcon>
        {typeof icon === 'string' ? (
          <Avatar variant="connector">
            <Icon color="dark" name={icon as IconName} />
          </Avatar>
        ) : (
          icon
        )}
      </MainIcon>
      <Infos $withEndIcon={!!endIcon} $titleFirst={titleFirst}>
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
      </Infos>
      {loading ? (
        <Icon animation="spin" color="primary" name="processing" />
      ) : typeof endIcon === 'string' ? (
        <Icon name={endIcon as IconName} color="dark" />
      ) : (
        endIcon
      )}
    </Container>
  )
}

export const SelectorSkeleton = ({ fullWidth = false }: { fullWidth?: boolean } = {}) => (
  <Container $fullWidth={fullWidth}>
    <MainIcon>
      <Skeleton variant="connectorAvatar" size="medium" />
    </MainIcon>
    <Infos>
      <Skeleton variant="text" width={160} height={12} />
    </Infos>
  </Container>
)

export const SELECTOR_HEIGHT = 72

const MainIcon = styled.div`
  margin-right: ${theme.spacing(4)};
`

const ICON_CONTAINER_SIZE = 40

const Infos = styled.div<{ $titleFirst?: boolean; $withEndIcon?: boolean }>`
  display: flex;
  text-align: left;
  flex-direction: ${({ $titleFirst }) => ($titleFirst ? 'column' : 'column-reverse')};
  flex: 1;
  margin-right: ${theme.spacing(4)};
  // 100 - Container icon size - end icon size (if present) - (padding left + right)
  max-width: ${({ $withEndIcon }) =>
    $withEndIcon
      ? `calc(100% - ${ICON_CONTAINER_SIZE}px - ${theme.spacing(4)} - ${theme.spacing(4 * 2)})`
      : `calc(100% - ${ICON_CONTAINER_SIZE}px - ${theme.spacing(4 * 2)})`};
`

const Container = styled.button<{
  $selected?: boolean
  $disabled?: boolean
  $clickable?: boolean
  $fullWidth?: boolean
}>`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(4)};
  box-sizing: border-box;
  height: ${SELECTOR_HEIGHT}px;
  background-color: ${({ $selected, $disabled }) =>
    $selected
      ? theme.palette.primary[100]
      : $disabled
      ? theme.palette.grey[100]
      : theme.palette.background.default};
  border: 1px solid
    ${({ $selected }) => ($selected ? theme.palette.primary[600] : theme.palette.grey[400])};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};

  ${({ $fullWidth }) =>
    !$fullWidth
      ? css`
          min-width: calc(50% - ${theme.spacing(4 * 2)});
          max-width: calc(50% - ${theme.spacing(4 * 2)});
          ${theme.breakpoints.down('sm')} {
            min-width: initial;
            max-width: 100%;
          }
        `
      : css`
          width: 100%;
        `}

  ${({ $clickable, $selected, $disabled }) =>
    $clickable &&
    !$disabled &&
    css`
      cursor: pointer;
      :focus:not(:active) {
        box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
        border-radius: 12px;
      }

      :hover:not(:active) {
        background-color: ${$selected ? theme.palette.primary[200] : theme.palette.grey[100]};
      }
    `}

  ${({ $selected, $clickable }) =>
    !$selected &&
    $clickable &&
    css`
      :active {
        background-color: ${theme.palette.grey[200]};
      }
    `}
`
