import styled, { css } from 'styled-components'

import { theme } from '~/styles'

export const ButtonGroup = styled.div<{ $noWrap?: boolean }>`
  && {
    ${({ $noWrap }) =>
      $noWrap
        ? css`
            display: flex;
            align-items: center;
            flex-direction: row;

            > :not(:last-child) {
              margin-right: ${theme.spacing(3)};
            }
          `
        : css`
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            flex-direction: row;
            margin-right: -${theme.spacing(3)};
            margin-bottom: -${theme.spacing(3)};

            > * {
              margin-right: ${theme.spacing(3)};
              margin-bottom: ${theme.spacing(3)};
            }
          `}
  }
`
