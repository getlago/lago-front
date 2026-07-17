import { gql } from '@apollo/client'
import { ConditionalWrapper, Icon } from 'lago-design-system'
import { ReactNode } from 'react'
import { generatePath } from 'react-router-dom'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Popper } from '~/components/designSystem/Popper'
import { Selector } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsWithTabsPaddedContainer,
} from '~/components/layouts/Settings'
import {
  ENTRA_ID_AUTHENTICATION_ROUTE,
  OKTA_AUTHENTICATION_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  AddEntraIdIntegrationDialogFragmentDoc,
  AddOktaIntegrationDialogFragmentDoc,
  AuthenticationMethodsEnum,
  DeleteEntraIdIntegrationDialogFragmentDoc,
  DeleteOktaIntegrationDialogFragmentDoc,
  EntraIdIntegration,
  OktaIntegration,
  PremiumIntegrationTypeEnum,
  useGetAuthIntegrationsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import MicrosoftEntraId from '~/public/images/microsoft-entra-id.svg'
import Okta from '~/public/images/okta.svg'
import { MenuPopper } from '~/styles'

import { useAddEntraIdDialog } from './dialogs/AddEntraIdDialog'
import { useAddOktaDialog } from './dialogs/AddOktaDialog'
import { useDeleteEntraIdIntegrationDialog } from './dialogs/DeleteEntraIdIntegrationDialog'
import { useDeleteOktaIntegrationDialog } from './dialogs/DeleteOktaIntegrationDialog'
import { useUpdateLoginMethodDialog } from './dialogs/UpdateLoginMethodDialog'

gql`
  query GetAuthIntegrations($limit: Int!) {
    integrations(limit: $limit) {
      collection {
        ... on OktaIntegration {
          id
          ...AddOktaIntegrationDialog
          ...DeleteOktaIntegrationDialog
        }
        ... on EntraIdIntegration {
          id
          ...AddEntraIdIntegrationDialog
          ...DeleteEntraIdIntegrationDialog
        }
      }
    }

    ${AddOktaIntegrationDialogFragmentDoc}
    ${DeleteOktaIntegrationDialogFragmentDoc}
    ${AddEntraIdIntegrationDialogFragmentDoc}
    ${DeleteEntraIdIntegrationDialogFragmentDoc}
  }
`

/** Provider-specific configuration shared by the Okta and Entra ID SSO cards. */
type SSOProviderConfig = {
  method: AuthenticationMethodsEnum
  titleKey: string
  subtitleKey: string
  editLabelKey: string
  route: string
  icon: ReactNode
  shouldSee: boolean
  integration: OktaIntegration | EntraIdIntegration | undefined
  openAddDialog: (data: {
    integration?: OktaIntegration | EntraIdIntegration
    callback?: (id: string) => void
  }) => void
  openDeleteDialog: (data: {
    integration?: OktaIntegration | EntraIdIntegration
    callback?: () => void
  }) => void
}

const Authentication = () => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const {
    organization: { premiumIntegrations, authenticationMethods } = {},
    loading: organizationLoading,
    refetchOrganizationInfos,
  } = useOrganizationInfos()
  const navigate = useNavigate()

  const premiumWarningDialog = usePremiumWarningDialog()
  const { openAddOktaDialog } = useAddOktaDialog()
  const { openDeleteOktaIntegrationDialog } = useDeleteOktaIntegrationDialog()
  const { openAddEntraIdDialog } = useAddEntraIdDialog()
  const { openDeleteEntraIdIntegrationDialog } = useDeleteEntraIdIntegrationDialog()
  const { openUpdateLoginMethodDialog } = useUpdateLoginMethodDialog()

  const { data: authIntegrationsData, loading: authIntegrationsLoading } =
    useGetAuthIntegrationsQuery({ variables: { limit: 10 } })

  const hasAccessToOktaPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Okta,
  )

  const hasAccessToEntraIdPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.EntraId,
  )

  const oktaIntegration = authIntegrationsData?.integrations?.collection.find(
    (integration) => integration.__typename === 'OktaIntegration',
  ) as OktaIntegration | undefined

  const entraIdIntegration = authIntegrationsData?.integrations?.collection.find(
    (integration) => integration.__typename === 'EntraIdIntegration',
  ) as EntraIdIntegration | undefined

  const shouldSeeOktaIntegration = hasAccessToOktaPremiumIntegration && isPremium

  const shouldSeeEntraIdIntegration = hasAccessToEntraIdPremiumIntegration && isPremium

  const ssoProviders: SSOProviderConfig[] = [
    {
      method: AuthenticationMethodsEnum.Okta,
      titleKey: 'text_664c732c264d7eed1c74fda2',
      subtitleKey: 'text_664c732c264d7eed1c74fda8',
      editLabelKey: 'text_664c8fa719b5e7ad81c86018',
      route: OKTA_AUTHENTICATION_ROUTE,
      icon: <Okta />,
      shouldSee: shouldSeeOktaIntegration,
      integration: oktaIntegration,
      openAddDialog: openAddOktaDialog as SSOProviderConfig['openAddDialog'],
      openDeleteDialog: openDeleteOktaIntegrationDialog as SSOProviderConfig['openDeleteDialog'],
    },
    {
      method: AuthenticationMethodsEnum.EntraId,
      titleKey: 'text_17843073442548zt904xoinv',
      subtitleKey: 'text_1784307344254qdygzl3hxxa',
      editLabelKey: 'text_1784307344255fc26gfvrmb5',
      route: ENTRA_ID_AUTHENTICATION_ROUTE,
      icon: <MicrosoftEntraId />,
      shouldSee: shouldSeeEntraIdIntegration,
      integration: entraIdIntegration,
      openAddDialog: openAddEntraIdDialog as SSOProviderConfig['openAddDialog'],
      openDeleteDialog: openDeleteEntraIdIntegrationDialog as SSOProviderConfig['openDeleteDialog'],
    },
  ]

  const getSSOProviderConfig = (method: AuthenticationMethodsEnum) =>
    ssoProviders.find((provider) => provider.method === method)

  const getEndContent = ({
    type,
    method,
  }: {
    type: 'enabled' | 'disabled'
    method: AuthenticationMethodsEnum
  }) => {
    let isPopperVisible = true
    let icon = undefined
    const isUniqueAuthenticationMethodEnabled =
      authenticationMethods?.length === 1 && authenticationMethods?.includes(method)

    const providerConfig = getSSOProviderConfig(method)

    if (providerConfig && !providerConfig.shouldSee) {
      isPopperVisible = false
      icon = <Icon name="sparkles" size="medium" />
    } else if (providerConfig && !providerConfig.integration?.id) {
      isPopperVisible = false
      icon = undefined
    } else if (type === 'enabled') {
      icon = (
        <Chip
          icon="validate-filled"
          iconSize="medium"
          iconColor="success"
          label={translate('text_1752158016615j1gk6ew4q3t')}
        />
      )
    } else if (type === 'disabled') {
      icon = (
        <Chip
          icon="close-circle-filled"
          iconSize="medium"
          iconColor="disabled"
          label={translate('text_1752157864305e5ihvtb7dys')}
        />
      )
    }

    return (
      <ConditionalWrapper
        condition={isUniqueAuthenticationMethodEnabled && !providerConfig}
        validWrapper={(children) => (
          <Tooltip title={translate('text_1752158016615ah5wceoz1ed')} placement="top">
            {children}
          </Tooltip>
        )}
        invalidWrapper={(children) => <>{children}</>}
      >
        <div className="flex items-center gap-2">
          {icon}

          {providerConfig && providerConfig.shouldSee && !providerConfig.integration?.id && (
            <Button
              size="small"
              startIcon="link"
              variant="primary"
              loading={authIntegrationsLoading}
              onClick={() => {
                if (!providerConfig.shouldSee) {
                  return premiumWarningDialog.open()
                }

                return providerConfig.openAddDialog({
                  integration: providerConfig.integration,
                  callback: (id) =>
                    navigate(generatePath(providerConfig.route, { integrationId: id })),
                })
              }}
            >
              {translate('text_657078c28394d6b1ae1b9789')}
            </Button>
          )}

          {isPopperVisible && (
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={({ onClick }) => (
                <Button
                  icon="dots-horizontal"
                  variant="quaternary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                  }}
                />
              )}
            >
              {({ closePopper }) => (
                <MenuPopper>
                  {type === 'disabled' && (
                    <Button
                      disabled={isUniqueAuthenticationMethodEnabled}
                      startIcon="plus"
                      variant="quaternary"
                      align="left"
                      onClick={(e) => {
                        e.stopPropagation()

                        openUpdateLoginMethodDialog({
                          method,
                          type: 'enable',
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_17521580166155fkdg2u0m2o')}
                    </Button>
                  )}
                  {type === 'enabled' && (
                    <Button
                      disabled={isUniqueAuthenticationMethodEnabled}
                      startIcon="eye-hidden"
                      variant="quaternary"
                      align="left"
                      onClick={(e) => {
                        e.stopPropagation()

                        openUpdateLoginMethodDialog({
                          method,
                          type: 'disable',
                        })
                        closePopper()
                      }}
                    >
                      {translate('text_1752158016616mbk432yu9oz')}
                    </Button>
                  )}
                  {providerConfig?.integration?.id && (
                    <>
                      <Button
                        startIcon="pen"
                        variant="quaternary"
                        align="left"
                        loading={authIntegrationsLoading}
                        onClick={(e) => {
                          e.stopPropagation()

                          providerConfig.openAddDialog({
                            integration: providerConfig.integration,
                            callback: () => {
                              refetchOrganizationInfos()
                            },
                          })
                        }}
                      >
                        {translate(providerConfig.editLabelKey)}
                      </Button>
                      <ConditionalWrapper
                        condition={isUniqueAuthenticationMethodEnabled}
                        validWrapper={(children) => (
                          <Tooltip
                            title={translate('text_1752158016615ah5wceoz1ed')}
                            placement="bottom"
                          >
                            {children}
                          </Tooltip>
                        )}
                        invalidWrapper={(children) => <>{children}</>}
                      >
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          loading={authIntegrationsLoading}
                          disabled={isUniqueAuthenticationMethodEnabled}
                          onClick={(e) => {
                            e.stopPropagation()

                            providerConfig.openDeleteDialog({
                              integration: providerConfig.integration,
                              callback: () => {
                                refetchOrganizationInfos()
                              },
                            })
                          }}
                        >
                          {translate('text_17522481192202remk2eytrr')}
                        </Button>
                      </ConditionalWrapper>
                    </>
                  )}
                </MenuPopper>
              )}
            </Popper>
          )}
        </div>
      </ConditionalWrapper>
    )
  }

  return (
    <SettingsWithTabsPaddedContainer>
      <SettingsListWrapper>
        <SettingsListItemHeader
          label={translate('text_664c732c264d7eed1c74fd96')}
          sublabel={translate('text_664c732c264d7eed1c74fd9c')}
        />
        {organizationLoading ? (
          <SettingsListItemLoadingSkeleton count={3} />
        ) : (
          <SettingsListItem className="gap-4">
            <Selector
              title={translate('text_1752157864304mscddgsda6b')}
              subtitle={translate('text_1752157864305xgsua4ux0s7')}
              icon={
                <Avatar size="big" variant="connector">
                  <Icon name="key" color="black" />
                </Avatar>
              }
              endContent={getEndContent({
                type: authenticationMethods?.includes(AuthenticationMethodsEnum.EmailPassword)
                  ? 'enabled'
                  : 'disabled',
                method: AuthenticationMethodsEnum.EmailPassword,
              })}
            />

            <Selector
              title={translate('text_17521578643056ojd79f7ilq')}
              subtitle={translate('text_1752157864305y1yi854blva')}
              icon={
                <Avatar size="big" variant="connector">
                  <Icon name="google" size="medium" />
                </Avatar>
              }
              endContent={getEndContent({
                type: authenticationMethods?.includes(AuthenticationMethodsEnum.GoogleOauth)
                  ? 'enabled'
                  : 'disabled',
                method: AuthenticationMethodsEnum.GoogleOauth,
              })}
            />

            {ssoProviders.map((provider) => (
              <Selector
                key={provider.method}
                title={translate(provider.titleKey)}
                subtitle={translate(provider.subtitleKey)}
                icon={
                  <Avatar size="big" variant="connector-full">
                    {provider.icon}
                  </Avatar>
                }
                onClick={() => {
                  if (!provider.shouldSee) {
                    return premiumWarningDialog.open()
                  }

                  if (provider.integration?.id) {
                    return navigate(
                      generatePath(provider.route, {
                        integrationId: provider.integration.id,
                      }),
                    )
                  }

                  return provider.openAddDialog({
                    integration: provider.integration,
                    callback: (id) => navigate(generatePath(provider.route, { integrationId: id })),
                  })
                }}
                endContent={getEndContent({
                  method: provider.method,
                  type: authenticationMethods?.includes(provider.method) ? 'enabled' : 'disabled',
                })}
              />
            ))}
          </SettingsListItem>
        )}
      </SettingsListWrapper>
    </SettingsWithTabsPaddedContainer>
  )
}

export default Authentication
