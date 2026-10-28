import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddX402Dialog } from '~/components/settings/integrations/AddX402Dialog'
import { useDeleteX402IntegrationDialog } from '~/components/settings/integrations/DeleteX402IntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, useNavigate, X402_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddX402ConnectionDialogFragmentDoc,
  DeleteX402IntegrationDialogFragmentDoc,
  useGetX402IntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import Coinbase from '~/public/images/coinbase.svg'
import { MenuPopper, PopperOpener } from '~/styles'

gql`
  query getX402IntegrationsList($limit: Int) {
    x402Connections(limit: $limit) {
      collection {
        id
        name
        code
        ...AddX402ConnectionDialog
        ...DeleteX402IntegrationDialog
      }
    }
  }

  ${AddX402ConnectionDialogFragmentDoc}
  ${DeleteX402IntegrationDialogFragmentDoc}
`

const X402Integrations = (): JSX.Element | null => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { openAddX402Dialog } = useAddX402Dialog()
  const { openDeleteX402IntegrationDialog } = useDeleteX402IntegrationDialog()
  const { translate } = useInternationalization()
  const { isPremium, loading: currentUserLoading } = useCurrentUser()
  const isUnavailable = !currentUserLoading && !isPremium
  const { data, loading } = useGetX402IntegrationsListQuery({
    variables: { limit: 1000 },
    skip: !isPremium,
  })
  const connections = data?.x402Connections?.collection
  const initialLoading = loading && !data
  const deleteDialogCallback =
    connections?.length === 1
      ? () =>
          navigate(
            generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          )
      : undefined

  const canCreateIntegration = hasPermissions(['organizationIntegrationsCreate'])
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  useEffect(() => {
    if (isUnavailable) {
      navigate(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
    }
  }, [isUnavailable, navigate])

  if (isUnavailable) return null

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
        ]}
        entity={{
          viewName: translate('text_1793132394868yvgcalp0ap7'),
          viewNameLoading: initialLoading,
          metadata: translate('text_62b1edddbf5f461ab971271f'),
          metadataLoading: initialLoading,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <Coinbase />,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_65846763e6140b469140e235'),
              variant: 'primary',
              hidden: !canCreateIntegration,
              onClick: () => {
                openAddX402Dialog()
              },
            },
          ],
          loading: initialLoading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {initialLoading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!initialLoading &&
            connections?.map((connection) => (
              <IntegrationsPage.ListItem
                key={`x402-connection-${connection.id}`}
                to={generatePath(X402_INTEGRATION_DETAILS_ROUTE, {
                  integrationId: connection.id,
                  integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                })}
                label={connection.name}
                subLabel={connection.code}
              >
                {(canEditIntegration || canDeleteIntegration) && (
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ isOpen }) => (
                      <PopperOpener className="right-0 md:right-0">
                        <Tooltip
                          placement="top-end"
                          disableHoverListener={isOpen}
                          title={translate('text_626162c62f790600f850b7b6')}
                        >
                          <Button icon="dots-horizontal" variant="quaternary" />
                        </Tooltip>
                      </PopperOpener>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        {canEditIntegration && (
                          <Button
                            startIcon="pen"
                            variant="quaternary"
                            align="left"
                            onClick={() => {
                              openAddX402Dialog({ connection })
                              closePopper()
                            }}
                          >
                            {translate('text_65845f35d7d69c3ab4793dac')}
                          </Button>
                        )}

                        {canDeleteIntegration && (
                          <Button
                            startIcon="trash"
                            variant="quaternary"
                            align="left"
                            onClick={() => {
                              openDeleteX402IntegrationDialog({
                                connection,
                                callback: deleteDialogCallback,
                              })
                              closePopper()
                            }}
                          >
                            {translate('text_645d071272418a14c1c76a81')}
                          </Button>
                        )}
                      </MenuPopper>
                    )}
                  </Popper>
                )}
              </IntegrationsPage.ListItem>
            ))}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}

export default X402Integrations
