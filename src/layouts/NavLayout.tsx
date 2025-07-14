import { Button, tw } from 'lago-design-system'
import { forwardRef, PropsWithChildren } from 'react'

const NavWrapper = ({ children }: PropsWithChildren) => {
  return <div className="flex h-screen w-screen">{children}</div>
}

// Need to accept ref cause it's used within a ClickAwayListener
const Nav = forwardRef<HTMLElement, PropsWithChildren<{ isOpen: boolean; className?: string }>>(
  ({ children, className, isOpen }, ref) => {
    return (
      <nav
        ref={ref}
        className={tw(
          'absolute z-sideNav box-content flex h-full w-60 flex-col overflow-auto border-r border-grey-300 bg-white transition-[left] duration-250 md:static md:left-auto md:z-auto',
          isOpen ? 'left-0' : '-left-60',
          className,
        )}
      >
        {children}
      </nav>
    )
  },
)

Nav.displayName = 'Nav'

const NavBurgerButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      className="absolute left-4 top-3 z-drawer md:hidden"
      icon="burger"
      variant="quaternary"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    />
  )
}

const NavStickyElementContainer = ({ children }: PropsWithChildren) => {
  return (
    <div className="sticky left-0 top-0 z-sideNav flex h-29 w-60 items-end bg-white p-4 animate-shadow-bottom md:h-nav">
      {children}
    </div>
  )
}

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
  NavBurgerButton,
  NavSection,
  NavSectionGroup,
  NavStickyElementContainer,
  NavWrapper,
}
