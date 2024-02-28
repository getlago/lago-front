import { Stack } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { Button, NavigationTab, Typography } from '~/components/designSystem'
import {
  EMAILS_SETTINGS_ROUTE,
  HOME_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  MEMBERS_ROUTE,
  ORGANIZATION_INFORMATIONS_ROUTE,
  SETTINGS_ROUTE,
  TAXES_SETTINGS_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { theme } from '~/styles'

const NAV_WIDTH = 240

const Settings = () => {
  const [open, setOpen] = useState(false)
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()

  const tabsOptions = [
    {
      title: translate('text_62ab2d0396dd6b0361614d1c'),
      link: ORGANIZATION_INFORMATIONS_ROUTE,
      match: [ORGANIZATION_INFORMATIONS_ROUTE, SETTINGS_ROUTE],
    },
    {
      title: translate('text_62bb10ad2a10bd182d00202d'),
      link: INVOICE_SETTINGS_ROUTE,
      match: [INVOICE_SETTINGS_ROUTE],
    },
    {
      title: translate('text_645bb193927b375079d28a8f'),
      link: TAXES_SETTINGS_ROUTE,
      match: [TAXES_SETTINGS_ROUTE],
    },
    {
      title: translate('text_6407684eaf41130074c4b2a1'),
      link: EMAILS_SETTINGS_ROUTE,
    },
    {
      title: translate('text_62b1edddbf5f461ab9712733'),
      link: INTEGRATIONS_ROUTE,
    },
    {
      title: translate('text_63208b630aaf8df6bbfb2655'),
      link: MEMBERS_ROUTE,
    },
  ]

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
      <NavWrapper $open={open}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Button
            variant="quaternary"
            startIcon="arrow-left"
            onClick={() =>
              goBack(HOME_ROUTE, {
                exclude: [SETTINGS_ROUTE, ...tabsOptions.map((tab) => tab.link)],
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
          tabs={tabsOptions}
          orientation="vertical"
        />
      </NavWrapper>
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
