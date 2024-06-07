// This file contains styled components for the main objects form
// Ultimately, only general rules such as responsive or block size should be kept here
// Parts about spacing between elements should be moved to the components themselves
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'

import { NAV_HEIGHT, theme } from './muiTheme'

const MAIN_PADDING = theme.spacing(12)

export const Main = styled.div`
  width: 60%;
  box-sizing: border-box;
  padding: ${MAIN_PADDING} ${MAIN_PADDING} 0 ${MAIN_PADDING};

  > div {
    max-width: 720px;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(8)};
    }
  }

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: ${MAIN_PADDING} ${theme.spacing(4)} 0;
  }
`

export const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT}px);
`

export const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

export const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
`

export const Side = styled.div`
  width: 40%;
  position: relative;
  background-color: ${theme.palette.grey[100]};

  > div {
    position: sticky;
    top: ${NAV_HEIGHT}px;
    height: calc(100vh - ${NAV_HEIGHT}px);
  }

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

export const Line = styled.div`
  display: flex;
  margin: -${theme.spacing(3)} -${theme.spacing(3)} ${theme.spacing(3)} -${theme.spacing(3)};
  flex-wrap: wrap;

  > * {
    flex: 1;
    margin: ${theme.spacing(3)};
    min-width: 110px;
  }
`

export const LineSplit = styled.div`
  display: flex;
  column-gap: ${theme.spacing(6)};

  > * {
    flex: 1;
  }
`

export const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
`

export const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`

export const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)} ${theme.spacing(20)} ${theme.spacing(6)};
`

// ------------------------------------------------------------

const FOOTER_HEIGHT = 80
const FOOTER_MARGIN = 80

export const MainMinimumContent = styled.div`
  min-height: calc(
    100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px - ${FOOTER_MARGIN}px - ${MAIN_PADDING}
  );
`

export const SectionFooter = styled.div`
  height: ${FOOTER_HEIGHT}px;
  position: sticky;
  bottom: 0;
  background-color: ${theme.palette.background.paper};
  margin-top: ${FOOTER_MARGIN}px;
  border-top: 1px solid ${theme.palette.grey[200]};
  max-width: initial !important;
  // Negative margin to compensate for the padding of the parent
  margin-left: -${MAIN_PADDING};
  margin-right: -${MAIN_PADDING};
  padding: 0 ${MAIN_PADDING};

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: 0 ${theme.spacing(4)};
    margin-left: -${theme.spacing(4)};
    margin-right: -${theme.spacing(4)};
  }
`

export const SectionFooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  max-width: 720px;
`

// ------------------------------------------------------------

export const SectionTitle = styled(Typography)`
  > div:first-child {
    margin-bottom: ${theme.spacing(3)};
  }
`
