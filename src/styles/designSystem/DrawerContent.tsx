import styled from 'styled-components'

import { theme } from '~/styles'

export const DrawerContent = styled.div`
  > * {
    &:not(:last-child) {
      margin-bottom: ${theme.spacing(8)};
    }

    &:first-child {
      margin-bottom: ${theme.spacing(6)};
    }
  }
`

export const DrawerTitle = styled.div`
  padding: 0 ${theme.spacing(8)};
`

export const DrawerSubmitButton = styled.div`
  margin: 0 ${theme.spacing(8)} 0;
`
