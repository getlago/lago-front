import { ClickAwayListener } from '@mui/material'
import { ButtonLink, Icon, Skeleton } from 'lago-design-system'
import { useEffect, useRef, useState } from 'react'
import { generatePath, Location, Outlet, useLocation, useParams } from 'react-router-dom'

import { Button, Typography, VerticalMenu } from '~/components/designSystem'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  AUTHENTICATION_ROUTE,
  BILLING_ENTITY_CREATE_ROUTE,
  BILLING_ENTITY_ROUTE,
  BILLING_ENTITY_UPDATE_ROUTE,
  CREATE_DUNNING_ROUTE,
  CREATE_INVOICE_CUSTOM_SECTION,
  CREATE_PRICING_UNIT,
  CREATE_TAX_ROUTE,
  DUNNINGS_SETTINGS_ROUTE,
  EDIT_INVOICE_CUSTOM_SECTION,
  EDIT_PRICING_UNIT,
  FULL_INTEGRATIONS_ROUTE,
  FULL_INTEGRATIONS_ROUTE_ID,
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
import { tw } from '~/styles/utils'

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
    match: [FULL_INTEGRATIONS_ROUTE, FULL_INTEGRATIONS_ROUTE_ID],
    hidden: !hasPermissions(['organizationIntegrationsView']),
  },
  {
    title: translate('text_63208b630aaf8df6bbfb2655'),
    link: MEMBERS_ROUTE,
    hidden: !hasPermissions(['organizationMembersView']),
  },
  {
    title: translate('text_63ac86d797f728a87b2f9f85'),
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
  const location = useLocation()
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const { billingEntityCode } = useParams()

  const { organization: { canCreateBillingEntity } = {} } = useOrganizationInfos()
  const contentRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  const { data: billingEntities, loading: billingEntitiesLoading } = useGetBillingEntitiesQuery({})

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const TABS_ORGANIZATION = generateTabs({
    translate,
    hasPermissions,
  })

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
      BILLING_ENTITY_CREATE_ROUTE,
      BILLING_ENTITY_UPDATE_ROUTE,
      CREATE_PRICING_UNIT,
      EDIT_PRICING_UNIT,
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
                <Typography className="text-nowrap text-grey-600">
                  {translate('text_65df4fc6314ffd006ce0a537')}
                </Typography>
              </Button>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 px-3 py-1">
                <Icon name="company" size="small" />

                <Typography className="text-sm font-medium text-grey-600">
                  {translate('text_1742230191028y9ffl7i1dhe')}
                </Typography>
              </div>

              <div className="flex flex-col gap-1">
                {billingEntitiesLoading && <Skeleton className="w-full px-3" variant="text" />}

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

            <div>
              <div className="mb-1 mt-4 flex items-center gap-2 px-3 py-1">
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
          </div>
        </nav>
      </ClickAwayListener>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />

      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <Outlet />
      </div>
    </div>
  )
}

export default Settings
