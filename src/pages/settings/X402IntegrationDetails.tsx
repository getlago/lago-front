import { gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath, useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddX402Dialog } from '~/components/settings/integrations/AddX402Dialog'
import { useDeleteX402IntegrationDialog } from '~/components/settings/integrations/DeleteX402IntegrationDialog'
import {
  getX402Environment,
  getX402Network,
  X402_ENVIRONMENT_TRANSLATIONS,
} from '~/components/settings/integrations/x402Connection'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, useNavigate, X402_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddX402ConnectionDialogFragmentDoc,
  DeleteX402IntegrationDialogFragmentDoc,
  useGetX402IntegrationDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import Coinbase from '~/public/images/coinbase.svg'

const CONNECTION_LIMIT = 2

gql`
  fragment X402IntegrationDetails on X402ConnectionObject {
    id
    name
    code
    asset
    cdpApiKeyId
    cdpApiKeySecret
    networks
    allowedOrigins
    autoCreateCustomers
    payoutAddresses {
      evm
      svm
    }
  }

  query getX402IntegrationDetails($id: ID!, $limit: Int) {
    x402Connection(id: $id) {
      id
      ...X402IntegrationDetails
      ...AddX402ConnectionDialog
      ...DeleteX402IntegrationDialog
    }

    x402Connections(limit: $limit) {
      collection {
        id
      }
    }
  }

  ${AddX402ConnectionDialogFragmentDoc}
  ${DeleteX402IntegrationDialogFragmentDoc}
`

const X402IntegrationDetails = (): JSX.Element | null => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { hasPermissions } = usePermissions()
  const { openAddX402Dialog } = useAddX402Dialog()
  const { openDeleteX402IntegrationDialog } = useDeleteX402IntegrationDialog()
  const { translate } = useInternationalization()
  const { isPremium, loading: currentUserLoading } = useCurrentUser()
  const isUnavailable = !currentUserLoading && !isPremium
  const { data, loading } = useGetX402IntegrationDetailsQuery({
    variables: { id: integrationId as string, limit: CONNECTION_LIMIT },
    skip: !integrationId || !isPremium,
  })
  const connection = data?.x402Connection
  const environment = getX402Environment(connection?.networks || [])

  const deleteDialogCallback = (): void => {
    const hasOtherConnections = (data?.x402Connections?.collection.length || 0) >= CONNECTION_LIMIT

    navigate(
      generatePath(hasOtherConnections ? X402_INTEGRATION_ROUTE : INTEGRATIONS_ROUTE, {
        integrationGroup: IntegrationsTabsOptionsEnum.Lago,
      }),
    )
  }

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
          {
            label: translate('text_1793132394868yvgcalp0ap7'),
            path: generatePath(X402_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
        ]}
        entity={{
          viewName: connection?.name || '',
          viewNameLoading: loading,
          metadata: `${translate('text_1793132394868yvgcalp0ap7')} • ${translate('text_1793132394868vegc4k6d1yb')}`,
          metadataLoading: loading,
          icon: <Coinbase />,
        }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              items: [
                {
                  label: translate('text_65845f35d7d69c3ab4793dac'),
                  hidden: !canEditIntegration,
                  onClick: (closePopper) => {
                    if (connection) openAddX402Dialog({ connection })
                    closePopper()
                  },
                },
                {
                  label: translate('text_65845f35d7d69c3ab4793dad'),
                  hidden: !canDeleteIntegration,
                  onClick: (closePopper) => {
                    openDeleteX402IntegrationDialog({
                      connection: connection || null,
                      callback: deleteDialogCallback,
                    })
                    closePopper()
                  },
                },
              ],
            },
          ],
          loading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_657078c28394d6b1ae1b9725')}>
            {canEditIntegration && (
              <Button
                variant="inline"
                disabled={loading || !connection}
                onClick={() => {
                  if (connection) openAddX402Dialog({ connection })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </IntegrationsPage.Headline>

          {loading &&
            [0, 1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}
          {!loading && !!connection && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={connection.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={connection.code}
              />
              <IntegrationsPage.DetailsItem
                icon="link"
                label={translate('text_1793132394868pwqbx90cf8b')}
                value={connection.cdpApiKeyId ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1793132394868dszn9rlgiw7')}
                value={connection.cdpApiKeySecret ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="coin-dollar"
                label={translate('text_17931323948681cl90eupqde')}
                value={connection.asset.toUpperCase()}
              />
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1793132394869v0rsl99wkms')}
                value={environment ? translate(X402_ENVIRONMENT_TRANSLATIONS[environment]) : '-'}
              />
              <IntegrationsPage.DetailsItem
                icon="plug"
                label={translate('text_1793132394870ds0ogcm4ono')}
                value={connection.networks
                  .map((network) => getX402Network(network)?.name || network)
                  .join(', ')}
              />
              <IntegrationsPage.DetailsItem
                icon="wallet"
                label={translate('text_1793132394869qbewz38n7li')}
                value={connection.payoutAddresses.evm || '-'}
              />
              <IntegrationsPage.DetailsItem
                icon="wallet"
                label={translate('text_1793132394869960hjrg0yla')}
                value={connection.payoutAddresses.svm || '-'}
              />
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1793132394869zlqs0k1l2fm')}
                value={connection.allowedOrigins.join(', ')}
              />
              <IntegrationsPage.DetailsItem
                icon="eye"
                label={translate('text_1793132394869o3w8kfqblhy')}
                value={translate(
                  connection.autoCreateCustomers
                    ? 'text_1764160009979jzn4xunn1z8'
                    : 'text_176416000997957yqelmt2m2',
                )}
              />
            </>
          )}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}

export default X402IntegrationDetails
