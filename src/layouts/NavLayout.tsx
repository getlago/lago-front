import { tw } from 'lago-design-system'
import { forwardRef, PropsWithChildren } from 'react'

const NavWrapper = ({ children }: PropsWithChildren) => {
  return <div className="flex h-screen w-screen">{children}</div>
}

// Need to accept ref cause it's used within a ClickAwayListener
const Nav = forwardRef<HTMLElement, PropsWithChildren<{ className?: string }>>(
  ({ children, className }, ref) => {
    return (
      <nav
        ref={ref}
        className={tw(
          'absolute z-sideNav box-content flex h-full w-60 flex-col overflow-auto border-r border-grey-300 bg-white transition-[left] duration-250 md:static md:left-auto md:z-auto',
          className,
        )}
      >
        {children}
      </nav>
    )
  },
)

Nav.displayName = 'Nav'

const NavSectionGroup = ({ children }: PropsWithChildren) => {
  return <div className="flex flex-1 flex-col gap-4 px-4">{children}</div>
}

const NavSection = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={tw('flex w-full flex-col gap-1', className)}>{children}</div>
}

const ContentWrapper = forwardRef<HTMLDivElement, PropsWithChildren>(({ children }, ref) => {
  return (
    <div className="flex-1 overflow-y-auto" ref={ref}>
      {children}
    </div>
  )
})

ContentWrapper.displayName = 'ContentWrapper'

export const NavLayout = {
  ContentWrapper,
  Nav,
  NavSection,
  NavSectionGroup,
  NavWrapper,
}
