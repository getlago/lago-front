import { PropsWithChildren } from 'react'

import { Typography } from '~/components/designSystem'

export const PageBannerHeaderWithBurgerMenu = ({ children }: PropsWithChildren) => {
  return (
    <header className="sticky top-0 z-navBar flex min-h-18 flex-row items-center justify-between gap-2 bg-white px-17 py-4 shadow-b md:px-12">
      {children}
    </header>
  )
}

const CenteredPageWrapper = ({ children }: PropsWithChildren) => {
  return <div className="flex min-h-full w-full flex-col bg-white">{children}</div>
}

const PageBannerHeader = ({ children }: PropsWithChildren) => {
  return (
    <header className="sticky top-0 z-navBar flex min-h-18 flex-row items-center justify-between gap-2 bg-white p-4 shadow-b md:px-12">
      {children}
    </header>
  )
}

const CenteredContainer = ({ children }: PropsWithChildren) => {
  return (
    <div className="mx-auto flex w-full max-w-170 flex-1 flex-col gap-12 px-4 pb-20 pt-12 md:px-0">
      {children}
    </div>
  )
}

const CenteredStickyFooter = ({ children }: PropsWithChildren) => {
  return (
    <footer className="sticky bottom-0 z-navBar w-full bg-white shadow-t">
      <div className="mx-auto flex min-h-20 w-full max-w-170 flex-row flex-wrap-reverse items-center justify-end gap-3 p-4 md:px-0">
        {children}
      </div>
    </footer>
  )
}

const PageTitle = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant="headline" color="textSecondary">
        {title}
      </Typography>
      <Typography variant="body">{description}</Typography>
    </div>
  )
}

export const CenteredPage = {
  Wrapper: CenteredPageWrapper,
  Header: PageBannerHeader,
  HeaderWithBurgerMenu: PageBannerHeaderWithBurgerMenu,
  Container: CenteredContainer,
  StickyFooter: CenteredStickyFooter,
  PageTitle: PageTitle,
}
