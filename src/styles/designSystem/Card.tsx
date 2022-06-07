import styled, { css } from 'styled-components'

import { theme } from '~/styles'

export const Card = styled.div<{ $disableChildSpacing?: boolean }>`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;

  ${({ $disableChildSpacing }) =>
    !$disableChildSpacing &&
    css`
      > *:not(:last-child) {
        margin-bottom: ${theme.spacing(6)};
      }
    `}
`
