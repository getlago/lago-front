// This file contains styled components for the main objects form
// Ultimately, only general rules such as responsive or block size should be kept here
// Parts about spacing between elements should be moved to the components themselves
import { FC, PropsWithChildren } from 'react'
import styled from 'styled-components'

import { Skeleton, Typography, TypographyProps } from '~/components/designSystem'

import { NAV_HEIGHT, theme } from './muiTheme'
import { tw } from './utils'

export const MAIN_PADDING = theme.spacing(12)

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
export const Title: FC<PropsWithChildren<TypographyProps>> = ({
  children,
  className,
  ...props
}) => (
  <Typography className={tw('mb-1 px-8', className)} {...props}>
    {children}
  </Typography>
)

export const Subtitle: FC<PropsWithChildren<TypographyProps>> = ({
  children,
  className,
  ...props
}) => (
  <Typography className={tw('mb-8 px-8', className)} {...props}>
    {children}
  </Typography>
)

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
    margin-top: 28px;
  }
`

export const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)} ${theme.spacing(20)} ${theme.spacing(6)};
`

export const StickySubmitBar = styled.div`
  position: sticky;
  bottom: 0;
  background-color: ${theme.palette.background.paper};
  z-index: ${theme.zIndex.navBar};
  border-top: 1px solid ${theme.palette.grey[200]};
`

// ------------------------------------------------------------

export const FormLoadingSkeleton = ({ id, length = 2 }: { id: string; length?: number }) => {
  const array = Array.from({ length }, (_, index) => index)

  return (
    <>
      <div className="flex flex-col gap-1">
        <Skeleton className="w-40" variant="text" textVariant="headline" />
        <Skeleton className="w-100" variant="text" />
      </div>
      {array.map((_, index) => (
        <div key={`${id}-${index}`}>
          <div className="flex flex-col gap-1 pb-12 shadow-b">
            <Skeleton variant="text" className="w-40" />
            <Skeleton variant="text" className="w-100" />
            <Skeleton variant="text" className="w-74" />
          </div>
        </div>
      ))}
    </>
  )
}
