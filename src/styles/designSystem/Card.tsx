import styled, { css } from 'styled-components'

import { theme } from '~/styles'

export const Card = styled.div<{
  $disableChildSpacing?: boolean
  $childSpacing?: number
  $padding?: number
  $flexItem?: boolean
}>`
  padding: ${({ $padding }) => theme.spacing($padding ?? 8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};

  ${({ $flexItem }) =>
    $flexItem &&
    css`
      flex: 1;
    `}

  ${({ $disableChildSpacing, $childSpacing }) =>
    !$disableChildSpacing &&
    css`
      > *:not(:last-child) {
        margin-bottom: ${theme.spacing($childSpacing ?? 6)};
      }
    `}
`
