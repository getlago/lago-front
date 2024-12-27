import { FC, PropsWithChildren } from 'react'
import styled from 'styled-components'

import { Typography, TypographyProps } from '~/components/designSystem'
import { theme } from '~/styles'

import { tw } from './utils'

export const SideSection = styled.div<{ $empty?: boolean }>`
  > *:first-child {
    margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(6) : 0)};
  }
`

export const SectionHeader: FC<
  PropsWithChildren<{ hideBottomShadow?: boolean } & TypographyProps>
> = ({ children, hideBottomShadow, ...props }) => (
  <Typography
    className={tw('flex h-18 items-center justify-between', {
      'shadow-b': !hideBottomShadow,
    })}
    {...props}
  >
    {children}
  </Typography>
)
