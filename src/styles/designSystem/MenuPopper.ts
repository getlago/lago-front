import styled from 'styled-components'

import { theme } from '~/styles'

export const MenuPopper = styled.div`
  padding: ${theme.spacing(2)};
  display: flex;
  flex-direction: column;

  > :not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
