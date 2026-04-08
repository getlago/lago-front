import { gql, useQuery } from '@apollo/client'
import { ConditionalWrapper, Icon } from 'lago-design-system'
import { generatePath, useNavigate } from 'react-router-dom'

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
import { ENTRA_ID_AUTHENTICATION_ROUTE, OKTA_AUTHENTICATION_ROUTE } from '~/core/router'
import {
  AuthenticationMethodsEnum,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Okta from '~/public/images/okta.svg'
import { MenuPopper } from '~/styles'

import { useAddOktaDialog } from './dialogs/AddOktaDialog'
import { useAddEntraIdDialog } from './dialogs/AddEntraIdDialog'
import { useDeleteEntraIdIntegrationDialog } from './dialogs/DeleteEntraIdIntegrationDialog'
import { useDeleteOktaIntegrationDialog } from './dialogs/DeleteOktaIntegrationDialog'
import { useUpdateLoginMethodDialog } from './dialogs/UpdateLoginMethodDialog'

const GET_AUTH_INTEGRATIONS = gql`
  query GetAuthIntegrations($limit: Int!) {
    integrations(limit: $limit) {
      collection {
        ... on OktaIntegration {
          id
          name
          domain
          host
          clientId
          clientSecret
          organizationName
        }
        ... on EntraIdIntegration {
          id
          domain
          host
          clientId
          clientSecret
          tenantId
        }
      }
    }
  }
`

type OktaIntegration = {
  __typename: 'OktaIntegration'
  id: string
  name: string
  domain: string
  host?: string | null
  clientId?: string | null
  clientSecret?: string | null
  organizationName: string
}

type EntraIdIntegration = {
  __typename: 'EntraIdIntegration'
  id: string
  domain?: string | null
  host?: string | null
  clientId?: string | null
  clientSecret?: string | null
  tenantId?: string | null
}

type GetAuthIntegrationsResult = {
  integrations?: {
    collection: Array<OktaIntegration | EntraIdIntegration>
  } | null
}

const ENTRA_ID_METHOD = 'entra_id' as const
type OrganizationAuthenticationMethod = AuthenticationMethodsEnum | typeof ENTRA_ID_METHOD
const ENTRA_ID_PREMIUM_INTEGRATION = 'entra_id' as unknown as PremiumIntegrationTypeEnum

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
  const { openAddEntraIdDialog } = useAddEntraIdDialog()
  const { openDeleteOktaIntegrationDialog } = useDeleteOktaIntegrationDialog()
  const { openDeleteEntraIdIntegrationDialog } = useDeleteEntraIdIntegrationDialog()
  const { openUpdateLoginMethodDialog } = useUpdateLoginMethodDialog()

  const { data: authIntegrationsData, loading: authIntegrationsLoading } =
    useQuery<GetAuthIntegrationsResult>(GET_AUTH_INTEGRATIONS, { variables: { limit: 10 } })

  const hasAccessToOktaPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.Okta,
  )
  const hasAccessToEntraIdPremiumIntegration = !!premiumIntegrations?.includes(
    ENTRA_ID_PREMIUM_INTEGRATION,
  )

  const oktaIntegration = authIntegrationsData?.integrations?.collection.find(
    (integration) => integration.__typename === 'OktaIntegration',
  ) as OktaIntegration | undefined
  const entraIdIntegration = authIntegrationsData?.integrations?.collection.find(
    (integration) => integration.__typename === 'EntraIdIntegration',
  ) as EntraIdIntegration | undefined

  const shouldSeeOktaIntegration = hasAccessToOktaPremiumIntegration && isPremium
  const shouldSeeEntraIdIntegration = hasAccessToEntraIdPremiumIntegration && isPremium

  const getEndContent = ({
    type,
    method,
  }: {
    type: 'enabled' | 'disabled'
    method: OrganizationAuthenticationMethod
  }) => {
    let isPopperVisible = true
    let icon = undefined
    const organizationAuthenticationMethods = (authenticationMethods || []) as string[]
    const isUniqueAuthenticationMethodEnabled =
      organizationAuthenticationMethods.length === 1 &&
      organizationAuthenticationMethods.includes(method)

    if (method === AuthenticationMethodsEnum.Okta && !shouldSeeOktaIntegration) {
      isPopperVisible = false
      icon = <Icon name="sparkles" size="medium" />
    } else if (method === AuthenticationMethodsEnum.Okta && !oktaIntegration?.id) {
      isPopperVisible = false
      icon = undefined
    } else if (method === ENTRA_ID_METHOD && !shouldSeeEntraIdIntegration) {
      isPopperVisible = false
      icon = <Icon name="sparkles" size="medium" />
    } else if (method === ENTRA_ID_METHOD && !entraIdIntegration?.id) {
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
        condition={
          isUniqueAuthenticationMethodEnabled &&
          method !== AuthenticationMethodsEnum.Okta &&
          method !== ENTRA_ID_METHOD
        }
        validWrapper={(children) => (
          <Tooltip title={translate('text_1752158016615ah5wceoz1ed')} placement="top">
            {children}
          </Tooltip>
        )}
        invalidWrapper={(children) => <>{children}</>}
      >
        <div className="flex items-center gap-2">
          {icon}

          {method === AuthenticationMethodsEnum.Okta &&
            shouldSeeOktaIntegration &&
            !oktaIntegration?.id && (
              <Button
                size="small"
                startIcon="link"
                variant="primary"
                loading={authIntegrationsLoading}
                onClick={() => {
                  if (!shouldSeeOktaIntegration) {
                    return premiumWarningDialog.open()
                  }

                  return openAddOktaDialog({
                    integration: oktaIntegration,
                    callback: (id) =>
                      navigate(generatePath(OKTA_AUTHENTICATION_ROUTE, { integrationId: id })),
                  })
                }}
              >
                {translate('text_657078c28394d6b1ae1b9789')}
              </Button>
            )}
          {method === ENTRA_ID_METHOD &&
            shouldSeeEntraIdIntegration &&
            !entraIdIntegration?.id && (
              <Button
                size="small"
                startIcon="link"
                variant="primary"
                loading={authIntegrationsLoading}
                onClick={() => {
                  if (!shouldSeeEntraIdIntegration) {
                    return premiumWarningDialog.open()
                  }

                  return openAddEntraIdDialog({
                    integration: entraIdIntegration,
                    callback: (id) =>
                      navigate(generatePath(ENTRA_ID_AUTHENTICATION_ROUTE, { integrationId: id })),
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
                  {method === AuthenticationMethodsEnum.Okta && oktaIntegration?.id && (
                    <>
                      <Button
                        startIcon="pen"
                        variant="quaternary"
                        align="left"
                        loading={authIntegrationsLoading}
                        onClick={(e) => {
                          e.stopPropagation()

                          openAddOktaDialog({
                            integration: oktaIntegration,
                            callback: () => {
                              refetchOrganizationInfos()
                            },
                          })
                        }}
                      >
                        {translate('text_664c8fa719b5e7ad81c86018')}
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

                            openDeleteOktaIntegrationDialog({
                              integration: oktaIntegration,
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
                  {method === ENTRA_ID_METHOD && entraIdIntegration?.id && (
                    <>
                      <Button
                        startIcon="pen"
                        variant="quaternary"
                        align="left"
                        loading={authIntegrationsLoading}
                        onClick={(e) => {
                          e.stopPropagation()

                          openAddEntraIdDialog({
                            integration: entraIdIntegration,
                            callback: () => {
                              refetchOrganizationInfos()
                            },
                          })
                        }}
                      >
                        {translate('text_664c8fa719b5e7ad81c86018')}
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

                            openDeleteEntraIdIntegrationDialog({
                              integration: entraIdIntegration,
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
            <Selector
              title="Microsoft Entra ID"
              subtitle="Enterprise SSO via Microsoft identity platform."
              icon={
                <Avatar size="big" variant="connector">
                  <Icon name="key" color="black" />
                </Avatar>
              }
              onClick={() => {
                if (!shouldSeeEntraIdIntegration) {
                  return premiumWarningDialog.open()
                }

                if (entraIdIntegration?.id) {
                  return navigate(
                    generatePath(ENTRA_ID_AUTHENTICATION_ROUTE, {
                      integrationId: entraIdIntegration.id,
                    }),
                  )
                }

                return openAddEntraIdDialog({
                  integration: entraIdIntegration,
                  callback: (id) =>
                    navigate(generatePath(ENTRA_ID_AUTHENTICATION_ROUTE, { integrationId: id })),
                })
              }}
              endContent={getEndContent({
                method: ENTRA_ID_METHOD,
                type: (authenticationMethods as string[] | undefined)?.includes(ENTRA_ID_METHOD)
                  ? 'enabled'
                  : 'disabled',
              })}
            />

            <Selector
              title={translate('text_664c732c264d7eed1c74fda2')}
              subtitle={translate('text_664c732c264d7eed1c74fda8')}
              icon={
                <Avatar size="big" variant="connector-full">
                  <Okta />
                </Avatar>
              }
              onClick={() => {
                if (!shouldSeeOktaIntegration) {
                  return premiumWarningDialog.open()
                }

                if (oktaIntegration?.id) {
                  return navigate(
                    generatePath(OKTA_AUTHENTICATION_ROUTE, {
                      integrationId: oktaIntegration.id,
                    }),
                  )
                }

                return openAddOktaDialog({
                  integration: oktaIntegration,
                  callback: (id) =>
                    navigate(generatePath(OKTA_AUTHENTICATION_ROUTE, { integrationId: id })),
                })
              }}
              endContent={getEndContent({
                method: AuthenticationMethodsEnum.Okta,
                type: authenticationMethods?.includes(AuthenticationMethodsEnum.Okta)
                  ? 'enabled'
                  : 'disabled',
              })}
            />
          </SettingsListItem>
        )}
      </SettingsListWrapper>
    </SettingsWithTabsPaddedContainer>
  )
}

export default Authentication
