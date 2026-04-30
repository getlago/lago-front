import { gql, useApolloClient } from '@apollo/client'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { useEffect, useRef, useState } from 'react'
import { Location, Outlet, useLocation } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderProvider } from '~/components/MainHeader/MainHeaderContext'
import { useSideNavInfosQuery } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { NavLayout } from '~/layouts/NavLayout'

import { BottomNavSection } from './BottomNavSection'
import { MainNavMenuSections } from './MainNavMenuSections'
import { OrganizationSwitcher } from './OrganizationSwitcher'

export const MAIN_NAV_LAYOUT_WRAPPER_TEST_ID = 'main-nav-layout-wrapper'
export const MAIN_NAV_LAYOUT_SPINNER_TEST_ID = 'main-nav-layout-spinner'
export const MAIN_NAV_LAYOUT_CONTENT_TEST_ID = 'main-nav-layout-content-wrapper'

gql`
  query SideNavInfos {
    currentVersion {
      githubUrl
      number
    }
  }
`

const MainNavLayout = () => {
  const location = useLocation()
  const client = useApolloClient()
  const [open, setOpen] = useState(false)

  const { currentUser, loading: currentUserLoading, refetchCurrentUserInfos } = useCurrentUser()
  const {
    organization,
    loading: currentOrganizationLoading,
    refetchOrganizationInfos,
  } = useOrganizationInfos()
  const { data, loading: versionLoading } = useSideNavInfosQuery({
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })

  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }
  const contentRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const isLoading = currentOrganizationLoading || currentUserLoading || versionLoading

  useEffect(() => {
    // Avoid weird scroll behavior on navigation
    if (!contentRef.current || state?.disableScrollTop) return
    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef, state?.disableScrollTop])

  const handleNavItemClick = () => setOpen(false)

  return (
    <div className="h-full" data-test={MAIN_NAV_LAYOUT_WRAPPER_TEST_ID}>
      <NavLayout.NavWrapper>
        <NavLayout.NavBurgerButton
          ref={burgerRef}
          isOpen={open}
          onClick={() => setOpen((prev) => !prev)}
        />

        <ClickAwayListener
          onClickAway={(event) => {
            // Skip click-away when the burger toggles the menu, otherwise
            // close-via-burger would race with the toggle and end up reopening.
            if (burgerRef.current?.contains(event.target as Node)) return
            if (open) setOpen(false)
          }}
        >
          <NavLayout.Nav isOpen={open}>
            <OrganizationSwitcher
              client={client}
              currentUser={currentUser}
              organization={organization}
              currentVersion={data?.currentVersion}
              isLoading={isLoading}
              isVersionLoading={versionLoading}
              refetchCurrentUserInfos={refetchCurrentUserInfos}
              refetchOrganizationInfos={refetchOrganizationInfos}
            />

            <MainNavMenuSections isLoading={isLoading} onItemClick={handleNavItemClick} />

            <BottomNavSection isLoading={isLoading} onItemClick={handleNavItemClick} />
          </NavLayout.Nav>
        </ClickAwayListener>

        <MainHeaderProvider>
          <NavLayout.ContentWrapper ref={contentRef} data-test={MAIN_NAV_LAYOUT_CONTENT_TEST_ID}>
            {isLoading && <Spinner data-test={MAIN_NAV_LAYOUT_SPINNER_TEST_ID} />}
            {!isLoading && (
              <>
                <MainHeader />
                <Outlet />
              </>
            )}
          </NavLayout.ContentWrapper>
        </MainHeaderProvider>
      </NavLayout.NavWrapper>
    </div>
  )
}

export default MainNavLayout
