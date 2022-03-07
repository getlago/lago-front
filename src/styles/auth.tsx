import styled from 'styled-components'

import { theme } from '~/styles'
import { Typography } from '~/components/designSystem'
import Logo from '~/public/images/logo/lago-logo.svg'

export const Page = styled.div`
  box-sizing: border-box;
  background-color: ${theme.palette.grey[100]};
  min-height: 100vh;
  padding: ${theme.spacing(20)};

  ${theme.breakpoints.down('sm')} {
    padding: ${theme.spacing(20)} ${theme.spacing(4)};
  }
`

export const StyledLogo = styled(Logo)`
  margin-bottom: ${theme.spacing(12)};
`

export const Card = styled.div`
  margin: 0 auto;
  background-color: ${theme.palette.background.paper};
  border-radius: 12px;
  box-shadow: 0px 6px 8px 0px #19212e1f; // TODO
  padding: ${theme.spacing(10)};
  max-width: 576px;
  box-sizing: border-box;
`

export const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`
export const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`
