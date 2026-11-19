import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddAgentStorefrontDialog } from '~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog'
import { useDeleteAgentStorefrontIntegrationDialog } from '~/components/settings/integrations/agentStorefront/DeleteAgentStorefrontIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  EditAgentStorefrontIntegrationFragmentDoc,
  GetAgentStorefrontIntegrationsListQuery,
  IntegrationTypeEnum,
  useGetAgentStorefrontIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import AgentStorefront from '~/public/images/agentic-storefront.svg'
import { MenuPopper, PopperOpener } from '~/styles'

gql`
  query getAgentStorefrontIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on AgentStorefrontIntegration {
          id
          name
          code
          ...EditAgentStorefrontIntegration
        }
      }
    }
  }

  ${EditAgentStorefrontIntegrationFragmentDoc}
`

export const AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID = 'agent-storefront-add-connection'
export const AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID = 'agent-storefront-connection-options'
export const AGENT_STOREFRONT_CONNECTION_EDIT_TEST_ID = 'agent-storefront-connection-edit'
export const AGENT_STOREFRONT_CONNECTION_DELETE_TEST_ID = 'agent-storefront-connection-delete'

type IntegrationItem = NonNullable<
  GetAgentStorefrontIntegrationsListQuery['integrations']
>['collection'][number]

type AgentStorefrontConnection = Extract<
  IntegrationItem,
  { __typename?: 'AgentStorefrontIntegration' }
>

const isAgentStorefrontConnection = (item: IntegrationItem): item is AgentStorefrontConnection =>
  item?.__typename === 'AgentStorefrontIntegration'

const AgentStorefrontIntegrations = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { openAddAgentStorefrontDialog, openEditAgentStorefrontDialog } =
    useAddAgentStorefrontDialog()
  const { openDeleteAgentStorefrontIntegrationDialog } = useDeleteAgentStorefrontIntegrationDialog()
  const { hasPermissions } = usePermissions()
  const { data, loading } = useGetAgentStorefrontIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.AgentStorefront] },
  })

  const isFirstLoad = loading && !data
  const connections = (data?.integrations?.collection ?? []).filter(isAgentStorefrontConnection)
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

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
          viewName: translate('text_1795083825203aqsrrdi5tii'),
          viewNameLoading: isFirstLoad,
          metadata: translate('text_1795083825204u0cvlpt2mav'),
          metadataLoading: isFirstLoad,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <AgentStorefront />,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_65846763e6140b469140e235'),
              variant: 'primary',
              dataTest: AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID,
              onClick: () => openAddAgentStorefrontDialog(),
            },
          ],
          loading: isFirstLoad,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {isFirstLoad &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!isFirstLoad &&
            connections.map((connection) => (
              <IntegrationsPage.ListItem
                key={`agent-storefront-connection-${connection.id}`}
                to={generatePath(AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, {
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
                          <Button
                            icon="dots-horizontal"
                            variant="quaternary"
                            data-test={`${AGENT_STOREFRONT_CONNECTION_OPTIONS_TEST_ID}-${connection.id}`}
                          />
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
                            data-test={AGENT_STOREFRONT_CONNECTION_EDIT_TEST_ID}
                            onClick={() => {
                              openEditAgentStorefrontDialog({ integration: connection })
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
                            data-test={AGENT_STOREFRONT_CONNECTION_DELETE_TEST_ID}
                            onClick={() => {
                              openDeleteAgentStorefrontIntegrationDialog({
                                integration: connection,
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

export default AgentStorefrontIntegrations
