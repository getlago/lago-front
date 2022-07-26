import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'

import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'

const ListItemCss = css`
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

const ListClickableItemCss = css`
  cursor: pointer;

  &:hover:not(:active),
  &:focus:not(:active) {
    background-color: ${theme.palette.grey[100]};
  }

  &:active {
    background-color: ${theme.palette.grey[200]};
  }

  &:hover,
  &:focus,
  &:active {
    outline: none;
    text-decoration: none;
    box-shadow: ${theme.shadows[7]};
    border-radius: 0;
  }

  &:visited {
    color: inherit;
  }
`

export const BaseListItem = styled.div`
  ${ListItemCss}
`

export const ListItemLink = styled(Link)`
  ${ListItemCss}
  ${ListClickableItemCss}
`

export const ListItem = styled.div`
  ${ListItemCss}
  ${ListClickableItemCss}
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

export const ListContainer = styled.div`
  margin-bottom: ${theme.spacing(20)};
`

export const ItemContainer = styled.div`
  position: relative;
`

export const PopperOpener = styled.div`
  position: absolute;
  right: ${theme.spacing(12)};
  top: ${NAV_HEIGHT / 2 - 20}px;
  z-index: 1;

  ${theme.breakpoints.down('md')} {
    right: ${theme.spacing(4)};
  }
`
