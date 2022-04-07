import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'

export const SideSection = styled.div<{ $empty?: boolean }>`
  > *:first-child {
    margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(6) : 0)};
  }
`

export const SectionHeader = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`
