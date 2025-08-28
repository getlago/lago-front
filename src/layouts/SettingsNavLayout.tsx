import { ClickAwayListener } from '@mui/material'
import { ButtonLink, Skeleton } from 'lago-design-system'
import { useEffect, useRef, useState } from 'react'
import {
  generatePath,
  Location,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  Button,
  Typography,
  VerticalMenu,
  VerticalMenuSectionTitle,
} from '~/components/designSystem'
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
  OKTA_AUTHENTICATION_ROUTE,
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

import { NavLayout } from './NavLayout'

const generateTabs = ({
  translate,
  hasPermissions,
}: {
  translate: TranslateFunc
  hasPermissions: (permissionsToCheck: Array<keyof TMembershipPermissions>) => boolean
}) => [
  {
    title: translate('text_62b1edddbf5f461ab9712733'),
    link: generatePath(INTEGRATIONS_ROUTE, {
      integrationGroup: IntegrationsTabsOptionsEnum.Lago,
    }),
    match: [FULL_INTEGRATIONS_ROUTE, FULL_INTEGRATIONS_ROUTE_ID],
    hidden: !hasPermissions(['organizationIntegrationsView']),
  },
  {
    title: translate('text_664c732c264d7eed1c74fd96'),
    link: AUTHENTICATION_ROUTE,
    match: [AUTHENTICATION_ROUTE, OKTA_AUTHENTICATION_ROUTE],
    hidden: !hasPermissions(['organizationIntegrationsView', 'authenticationMethodsView']),
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

const SettingsNavLayout = () => {
  const location = useLocation()
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { hasPermissions } = usePermissions()
  const { billingEntityCode } = useParams()
  const navigate = useNavigate()
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
    <NavLayout.NavWrapper>
      <NavLayout.NavBurgerButton onClick={() => setOpen((prev) => !prev)} />
      <ClickAwayListener
        onClickAway={() => {
          if (open) setOpen(false)
        }}
      >
        <NavLayout.Nav isOpen={open}>
          <NavLayout.NavStickyElementContainer>
            <Button
              variant="quaternary"
              startIcon="arrow-left"
              size="small"
              onClick={() => {
                goBack(HOME_ROUTE, {
                  exclude: routesToExcludeFromBackRedirection,
                })
              }}
            >
              <Typography variant="caption" color="grey600" noWrap>
                {translate('text_65df4fc6314ffd006ce0a537')}
              </Typography>
            </Button>
          </NavLayout.NavStickyElementContainer>

          <NavLayout.NavSectionGroup>
            <NavLayout.NavSection>
              <VerticalMenuSectionTitle
                title={translate('text_1742230191028y9ffl7i1dhe')}
                icon="company"
              />

              <div className="flex flex-col gap-1">
                {billingEntitiesLoading && <Skeleton className="w-full px-3" variant="text" />}

                {!billingEntitiesLoading &&
                  billingEntities?.billingEntities?.collection?.map((entity, index) => (
                    <ButtonLink
                      className="[&_button]:rounded-lg"
                      key={`${index}-${entity.code}`}
                      title={entity.name}
                      to={generatePath(BILLING_ENTITY_ROUTE, {
                        billingEntityCode: entity.code,
                      })}
                      type="tab"
                      active={isEntityActive(entity.code, billingEntityCode || '')}
                      canBeClickedOnActive={true}
                      buttonProps={{
                        size: 'small',
                      }}
                    >
                      <Typography variant="caption" color="inherit" noWrap>
                        {entity.name}
                      </Typography>
                    </ButtonLink>
                  ))}

                <div className="px-3 py-1">
                  <Button
                    variant="inline"
                    align="left"
                    size="small"
                    startIcon="plus"
                    endIcon={!canCreateBillingEntity ? 'sparkles' : undefined}
                    onClick={() => {
                      if (canCreateBillingEntity) {
                        navigate(generatePath(BILLING_ENTITY_CREATE_ROUTE))
                      } else {
                        premiumWarningDialogRef.current?.openDialog()
                      }
                    }}
                  >
                    {translate('text_1742367266660p3a701mnvli')}
                  </Button>
                </div>
              </div>
            </NavLayout.NavSection>

            <NavLayout.NavSection>
              <VerticalMenuSectionTitle
                title={translate('text_1742230191028ts64cxrgwdj')}
                icon="globe"
              />

              <VerticalMenu
                onClick={() => {
                  setOpen(false)
                }}
                tabs={TABS_ORGANIZATION}
              />
            </NavLayout.NavSection>
          </NavLayout.NavSectionGroup>
        </NavLayout.Nav>
      </ClickAwayListener>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />

      <NavLayout.ContentWrapper ref={contentRef}>
        <Outlet />
      </NavLayout.ContentWrapper>
    </NavLayout.NavWrapper>
  )
}

export default SettingsNavLayout
