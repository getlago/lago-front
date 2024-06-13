import styled, { css } from 'styled-components'

import { theme } from '~/styles'

export const Card = styled.div<{ $disableChildSpacing?: boolean; $childSpacing?: number }>`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};

  ${({ $disableChildSpacing, $childSpacing }) =>
    !$disableChildSpacing &&
    css`
      > *:not(:last-child) {
        margin-bottom: ${theme.spacing($childSpacing ?? 6)};
      }
    `}
`
