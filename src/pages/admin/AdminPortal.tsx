import ClickAwayListener from '@mui/material/ClickAwayListener'
import { useEffect, useRef, useState } from 'react'
import { Location, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import {
  updateAdminAuthTokenVar,
  updateAdminEmailVar,
  updateAdminRoleVar,
} from '~/core/apolloClient/reactiveVars/adminAuthTokenVar'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'
import { NavLayout } from '~/layouts/NavLayout'
import Logo from '~/public/images/logo/lago-logo.svg'

import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_PORTAL_ORGANIZATIONS_ROUTE,
  ADMIN_PORTAL_USERS_ROUTE,
} from './routes'

const AdminPortal = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdminAuthenticated } = useIsAdminAuthenticated()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate(ADMIN_LOGIN_ROUTE, { replace: true })
    }
  }, [isAdminAuthenticated, navigate])

  useEffect(() => {
    if (!contentRef.current || state?.disableScrollTop) return
    contentRef.current?.scrollTo(0, 0)
  }, [pathname, state?.disableScrollTop])

  if (!isAdminAuthenticated) return null

  const handleLogout = () => {
    updateAdminAuthTokenVar(undefined)
    updateAdminRoleVar(undefined)
    updateAdminEmailVar(undefined)
    navigate(ADMIN_LOGIN_ROUTE, { replace: true })
  }

  return (
    <NavLayout.NavWrapper>
      <NavLayout.NavBurgerButton onClick={() => setSidebarOpen((prev) => !prev)} />

      <ClickAwayListener
        onClickAway={() => {
          if (sidebarOpen) setSidebarOpen(false)
        }}
      >
        <NavLayout.Nav isOpen={sidebarOpen}>
          <NavLayout.NavStickyElementContainer>
            <div className="flex w-full items-center gap-2">
              <Logo height={24} />
              <Typography variant="captionHl" color="grey600">
                ADMIN
              </Typography>
            </div>
          </NavLayout.NavStickyElementContainer>

          <NavLayout.NavSectionGroup>
            <NavLayout.NavSection>
              <VerticalMenu
                name="admin-nav"
                onClick={() => setSidebarOpen(false)}
                tabs={[
                  {
                    title: 'Organizations',
                    icon: 'company',
                    link: ADMIN_PORTAL_ORGANIZATIONS_ROUTE,
                    match: [ADMIN_PORTAL_ORGANIZATIONS_ROUTE],
                  },
                  {
                    title: 'Users',
                    icon: 'user-multiple',
                    link: ADMIN_PORTAL_USERS_ROUTE,
                    match: [ADMIN_PORTAL_USERS_ROUTE],
                  },
                ]}
              />
            </NavLayout.NavSection>
          </NavLayout.NavSectionGroup>

          <NavLayout.NavSection className="sticky bottom-0 bg-white p-4 animate-shadow-top">
            <Button
              variant="quaternary"
              startIcon="logout"
              size="small"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </NavLayout.NavSection>
        </NavLayout.Nav>
      </ClickAwayListener>

      <NavLayout.ContentWrapper ref={contentRef}>
        <Outlet />
      </NavLayout.ContentWrapper>
    </NavLayout.NavWrapper>
  )
}

export default AdminPortal
