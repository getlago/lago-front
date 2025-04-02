import { ClickAwayListener, Stack } from '@mui/material'
import { useRef, useState } from 'react'
import { generatePath, Outlet, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, ButtonLink, Icon, Typography, VerticalMenu } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  AUTHENTICATION_ROUTE,
  BILLING_ENTITY_CREATE_ROUTE,
  BILLING_ENTITY_ROUTE,
  CREATE_DUNNING_ROUTE,
  CREATE_INVOICE_CUSTOM_SECTION,
  CREATE_TAX_ROUTE,
  DUNNINGS_SETTINGS_ROUTE,
  EDIT_INVOICE_CUSTOM_SECTION,
  HOME_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  MEMBERS_ROUTE,
  settingRoutes,
  TAXES_SETTINGS_ROUTE,
  UPDATE_DUNNING_ROUTE,
  UPDATE_TAX_ROUTE,
} from '~/core/router'
import { useGetBillingEntitiesQuery } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { TMembershipPermissions, usePermissions } from '~/hooks/usePermissions'
import { theme } from '~/styles'

const NAV_WIDTH = 240

const generateTabs = ({
  translate,
  hasPermissions,
}: {
  translate: TranslateFunc
  hasPermissions: (permissionsToCheck: Array<keyof TMembershipPermissions>) => boolean
}) => [
  {
    title: translate('text_664c732c264d7eed1c74fd96'),
    link: AUTHENTICATION_ROUTE,
    hidden: !hasPermissions(['organizationIntegrationsView']),
  },
  {
    title: translate('text_62b1edddbf5f461ab9712733'),
    link: generatePath(INTEGRATIONS_ROUTE, {
      integrationGroup: IntegrationsTabsOptionsEnum.Lago,
    }),
    hidden: !hasPermissions(['organizationIntegrationsView']),
  },
  {
    title: translate('text_63208b630aaf8df6bbfb2655'),
    link: MEMBERS_ROUTE,
    hidden: !hasPermissions(['organizationMembersView']),
  },
  {
    title: translate('text_1742230191028qkwly181six'),
    link: INVOICE_SETTINGS_ROUTE,
    hidden: !hasPermissions(['organizationInvoicesView']),
  },
  {
    title: translate('text_17285747264958mqbtws3em8'),
    link: DUNNINGS_SETTINGS_ROUTE,
    match: [DUNNINGS_SETTINGS_ROUTE],
    hidden: !hasPermissions(['dunningCampaignsView']),
  },
  {
    title: translate('text_645bb193927b375079d28a8f'),
    link: TAXES_SETTINGS_ROUTE,
    match: [TAXES_SETTINGS_ROUTE],
    hidden: !hasPermissions(['organizationTaxesView']),
  },
]

const isEntityActive = (code: string, current: string) => code === current

const Settings = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const { billingEntityCode } = useParams()

  const { organization: { canCreateBillingEntity } = {} } = useOrganizationInfos()

  const [open, setOpen] = useState(false)

  const { data: billingEntities, loading: billingEntitiesLoading } = useGetBillingEntitiesQuery({})

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const TABS_ORGANIZATION = generateTabs({
    translate,
    hasPermissions,
  })

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
    <SettingsLayoutWrapper>
      <Button
        className="absolute left-4 top-4 z-drawer md:hidden"
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
              <Typography className="text-nowrap text-grey-600">
                {translate('text_65df4fc6314ffd006ce0a537')}
              </Typography>
            </Button>
          </Stack>

          <div>
            <div className="mb-1 flex items-center gap-2 px-3 py-1">
              <Icon name="globe" size="small" />

              <Typography className="text-sm font-medium text-grey-600">
                {translate('text_1742230191028ts64cxrgwdj')}
              </Typography>
            </div>

            <VerticalMenu
              onClick={() => {
                setOpen(false)
              }}
              tabs={TABS_ORGANIZATION}
            />
          </div>

          <div>
            <div className="mb-1 mt-4 flex items-center gap-2 px-3 py-1">
              <Icon name="company" size="small" />

              <Typography className="text-sm font-medium text-grey-600">
                {translate('text_1742230191028y9ffl7i1dhe')}
              </Typography>
            </div>

            <div className="flex flex-col gap-1">
              {billingEntitiesLoading && <div>Loading TODO</div>}

              {!billingEntitiesLoading &&
                billingEntities?.billingEntities?.collection?.map((entity, index) => (
                  <ButtonLink
                    key={`${index}-${entity.code}`}
                    title={entity.name}
                    to={generatePath(BILLING_ENTITY_ROUTE, {
                      billingEntityCode: entity.code,
                    })}
                    type="tab"
                    active={isEntityActive(entity.code, billingEntityCode || '')}
                    canBeClickedOnActive={true}
                  >
                    <div className="flex w-full flex-row items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <Typography variant="body" color="inherit" noWrap>
                          {entity.name}
                        </Typography>
                      </div>
                    </div>
                  </ButtonLink>
                ))}

              <ButtonLink
                title={translate('text_1742367266660p3a701mnvli')}
                to={canCreateBillingEntity ? generatePath(BILLING_ENTITY_CREATE_ROUTE) : '#'}
                type="tab"
                onClick={() =>
                  !canCreateBillingEntity && premiumWarningDialogRef.current?.openDialog()
                }
              >
                <div className="flex w-full flex-row items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <Icon name="plus" size="small" />

                    <Typography variant="body" color="inherit" noWrap>
                      {translate('text_1742367266660p3a701mnvli')}
                    </Typography>
                  </div>

                  {!canCreateBillingEntity && <Icon name="sparkles" />}
                </div>
              </ButtonLink>
            </div>
          </div>
        </NavWrapper>
      </ClickAwayListener>

      <SettingsPageWrapper>
        <Outlet />
      </SettingsPageWrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </SettingsLayoutWrapper>
  )
}

export default Settings

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
