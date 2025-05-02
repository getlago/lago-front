import { ClickAwayListener } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { generatePath, Location, Outlet, useLocation } from 'react-router-dom'

import { Button, Typography, VerticalMenu } from '~/components/designSystem'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  AUTHENTICATION_ROUTE,
  CREATE_DUNNING_ROUTE,
  CREATE_INVOICE_CUSTOM_SECTION,
  CREATE_TAX_ROUTE,
  DUNNINGS_SETTINGS_ROUTE,
  EDIT_INVOICE_CUSTOM_SECTION,
  EMAILS_SETTINGS_ROUTE,
  HOME_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  MEMBERS_ROUTE,
  ORGANIZATION_INFORMATIONS_ROUTE,
  settingRoutes,
  SETTINGS_ROUTE,
  TAXES_SETTINGS_ROUTE,
  UPDATE_DUNNING_ROUTE,
  UPDATE_TAX_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { usePermissions } from '~/hooks/usePermissions'
import { tw } from '~/styles/utils'

const Settings = () => {
  const location = useLocation()
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const contentRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }

  useEffect(() => {
    // Avoid weird scroll behavior on navigation
    if (!contentRef.current || state?.disableScrollTop) return
    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef, state?.disableScrollTop])

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
    [
      CREATE_TAX_ROUTE,
      UPDATE_TAX_ROUTE,
      CREATE_DUNNING_ROUTE,
      UPDATE_DUNNING_ROUTE,
      CREATE_INVOICE_CUSTOM_SECTION,
      EDIT_INVOICE_CUSTOM_SECTION,
    ],
  )

  return (
    <div className="flex h-screen w-screen">
      <Button
        className="absolute left-4 top-4 z-drawer md:hidden"
        icon="burger"
        variant="quaternary"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
      />
      <ClickAwayListener
        onClickAway={() => {
          if (open) setOpen(false)
        }}
      >
        <nav
          className={tw(
            'absolute z-sideNav flex h-full w-60 shrink-0 flex-col overflow-hidden bg-white transition-[left] duration-250 shadow-r md:static md:left-auto md:z-auto',
            open ? 'left-0' : '-left-60',
          )}
        >
          <div className="mt-14 px-4 pb-2 pt-4 md:mt-0">
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant="quaternary"
                startIcon="arrow-left"
                onClick={() => {
                  goBack(HOME_ROUTE, {
                    exclude: routesToExcludeFromBackRedirection,
                  })
                }}
              >
                <Typography variant="body" color="textSecondary" noWrap>
                  {translate('text_65df4fc6314ffd006ce0a537')}
                </Typography>
              </Button>
            </div>

            <VerticalMenu
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
                  title: translate('text_17285747264958mqbtws3em8'),
                  link: DUNNINGS_SETTINGS_ROUTE,
                  match: [DUNNINGS_SETTINGS_ROUTE],
                  hidden: !hasPermissions(['dunningCampaignsView']),
                },
                {
                  title: translate('text_6407684eaf41130074c4b2a1'),
                  link: EMAILS_SETTINGS_ROUTE,
                  hidden: !hasPermissions(['organizationEmailsView']),
                },
                {
                  title: translate('text_62b1edddbf5f461ab9712733'),
                  link: generatePath(INTEGRATIONS_ROUTE, {
                    integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                  }),
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
            />
          </div>
        </nav>
      </ClickAwayListener>
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <Outlet />
      </div>
    </div>
  )
}

export default Settings
