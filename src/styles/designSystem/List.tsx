import styled from 'styled-components'

import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'

export const BaseListItem = styled.div`
  width: 100%;
  box-sizing: border-box;
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
  }
`

export const ListItem = styled(BaseListItem)`
  cursor: pointer;

  &:hover:not(:active),
  &:focus:not(:active) {
    background-color: ${theme.palette.grey[100]};
    outline: none;
  }

  &:active {
    background-color: ${theme.palette.grey[200]};
    outline: none;
  }
`

export const ListHeader = styled.div<{ $withActions?: boolean }>`
  position: sticky;
  background-color: ${theme.palette.grey[100]};
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  z-index: ${theme.zIndex.sectionHead};
  top: ${NAV_HEIGHT}px;

  padding: ${({ $withActions }) =>
    $withActions ? `0 ${theme.spacing(28)} 0 ${theme.spacing(12)} ` : `0 ${theme.spacing(12)}`};

  ${theme.breakpoints.down('md')} {
    padding: ${({ $withActions }) =>
      $withActions ? `0 ${theme.spacing(20)} 0 ${theme.spacing(4)} ` : `0 ${theme.spacing(4)}`};
  }
`
