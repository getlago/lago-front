import { ClickAwayListener, Stack } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { Button, NavigationTab, Typography } from '~/components/designSystem'
import {
  AUTHENTICATION_ROUTE,
  CREATE_TAX_ROUTE,
  EMAILS_SETTINGS_ROUTE,
  HOME_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  MEMBERS_ROUTE,
  ORGANIZATION_INFORMATIONS_ROUTE,
  settingRoutes,
  SETTINGS_ROUTE,
  TAXES_SETTINGS_ROUTE,
  UPDATE_TAX_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { usePermissions } from '~/hooks/usePermissions'
import { theme } from '~/styles'

const NAV_WIDTH = 240

const Settings = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()

  const [open, setOpen] = useState(false)

  const routesToExcludeFromBackRedirection = settingRoutes[0].children?.reduce<string[]>(
    (acc, cur) => {
      if (!cur.path) return acc

      if (Array.isArray(cur.path)) {
        acc.push(...cur.path)
      } else {
        acc.push(cur.path)
      }
      return acc
    },
    [CREATE_TAX_ROUTE, UPDATE_TAX_ROUTE],
  )

  return (
    <SettingsLayoutWrapper>
      <BurgerButton
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        icon="burger"
        variant="quaternary"
      />
      <ClickAwayListener
        onClickAway={() => {
          if (open) setOpen(false)
        }}
      >
        <NavWrapper $open={open}>
          <Stack spacing={2} direction="row" alignItems="center">
            <Button
              variant="quaternary"
              startIcon="arrow-left"
              onClick={() =>
                goBack(HOME_ROUTE, {
                  exclude: routesToExcludeFromBackRedirection,
                })
              }
            >
              <Typography variant="body" color="textSecondary" noWrap>
                {translate('text_65df4fc6314ffd006ce0a537')}
              </Typography>
            </Button>
          </Stack>

          <NavigationTab
            onClick={() => {
              setOpen(false)
            }}
            tabs={[
              {
                title: translate('text_62ab2d0396dd6b0361614d1c'),
                link: ORGANIZATION_INFORMATIONS_ROUTE,
                match: [ORGANIZATION_INFORMATIONS_ROUTE, SETTINGS_ROUTE],
                hidden: !hasPermissions(['organizationView']),
              },
              {
                title: translate('text_62bb10ad2a10bd182d00202d'),
                link: INVOICE_SETTINGS_ROUTE,
                match: [INVOICE_SETTINGS_ROUTE],
                hidden: !hasPermissions(['organizationInvoicesView']),
              },
              {
                title: translate('text_645bb193927b375079d28a8f'),
                link: TAXES_SETTINGS_ROUTE,
                match: [TAXES_SETTINGS_ROUTE],
                hidden: !hasPermissions(['organizationTaxesView']),
              },
              {
                title: translate('text_6407684eaf41130074c4b2a1'),
                link: EMAILS_SETTINGS_ROUTE,
                hidden: !hasPermissions(['organizationEmailsView']),
              },
              {
                title: translate('text_62b1edddbf5f461ab9712733'),
                link: INTEGRATIONS_ROUTE,
                hidden: !hasPermissions(['organizationIntegrationsView']),
              },
              {
                title: translate('text_664c732c264d7eed1c74fd96'),
                link: AUTHENTICATION_ROUTE,
                hidden: !hasPermissions(['organizationIntegrationsView']),
              },
              {
                title: translate('text_63208b630aaf8df6bbfb2655'),
                link: MEMBERS_ROUTE,
                hidden: !hasPermissions(['organizationMembersView']),
              },
            ]}
            orientation="vertical"
          />
        </NavWrapper>
      </ClickAwayListener>
      <SettingsPageWrapper>
        <Outlet />
      </SettingsPageWrapper>
    </SettingsLayoutWrapper>
  )
}

export default Settings

const BurgerButton = styled(Button)`
  && {
    position: absolute;
    z-index: ${theme.zIndex.drawer};
    left: ${theme.spacing(4)};
    top: ${theme.spacing(4)};

    ${theme.breakpoints.up('md')} {
      display: none;
    }
  }
`

const SettingsLayoutWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
`

const NavWrapper = styled.nav<{ $open: boolean }>`
  width: ${NAV_WIDTH}px;
  height: 100vh;
  padding: ${theme.spacing(4)};
  box-shadow: ${theme.shadows[6]};
  overflow: hidden;
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${theme.spacing(4)};
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};

  ${theme.breakpoints.down('md')} {
    padding-top: ${theme.spacing(17)};
    position: absolute;
    z-index: ${theme.zIndex.drawer - 1};
    left: ${({ $open }) => ($open ? 0 : -NAV_WIDTH)}px;
  }
`

const SettingsPageWrapper = styled.div`
  overflow: hidden auto;
  width: 100%;
`
