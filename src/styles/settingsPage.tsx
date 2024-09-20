import styled from 'styled-components'

import { NAV_HEIGHT, theme } from '~/styles'

export const SettingsHeaderNameWrapper = styled.div`
  display: flex;
  align-items: center;
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  padding: 0 ${theme.spacing(12)};
  position: sticky;
  top: 0;
  background-color: ${theme.palette.common.white};
  z-index: ${theme.zIndex.navBar};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(17)};
  }
`

export const SettingsPageContentWrapper = styled.div`
  max-width: ${theme.spacing(192)};
  padding: ${theme.spacing(8)} ${theme.spacing(12)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)};
  }
`
