import styled from 'styled-components'

import { theme, NAV_HEIGHT } from '~/styles'

export const PageHeader = styled.div<{ $withSide?: boolean }>`
  align-items: center;
  background-color: ${theme.palette.background.default};
  box-shadow: ${theme.shadows[7]};
  display: flex;
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  justify-content: space-between;
  padding: 0 ${theme.spacing(12)};
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.navBar};

  ${theme.breakpoints.down('md')} {
    padding: ${({ $withSide }) =>
      $withSide ? `0 ${theme.spacing(4)} 0 ${theme.spacing(17)}` : `0 ${theme.spacing(4)}`};
  }
`
