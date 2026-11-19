import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddAgentStorefrontDialog } from '~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  GetAgentStorefrontIntegrationsListQuery,
  IntegrationTypeEnum,
  useGetAgentStorefrontIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import AgentStorefront from '~/public/images/agentic-storefront.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'

gql`
  query getAgentStorefrontIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on AgentStorefrontIntegration {
          id
          name
          code
        }
      }
    }
  }
`

export const AGENT_STOREFRONT_ADD_CONNECTION_TEST_ID = 'agent-storefront-add-connection'

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
  const { openAddAgentStorefrontDialog } = useAddAgentStorefrontDialog()
  const { data, loading } = useGetAgentStorefrontIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.AgentStorefront] },
  })

  const isFirstLoad = loading && !data
  const connections = (data?.integrations?.collection ?? []).filter(isAgentStorefrontConnection)
  const hasConnections = connections.length > 0

  const renderConnections = (): JSX.Element => {
    if (isFirstLoad) {
      return (
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />
          {[1, 2].map((i) => (
            <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
          ))}
        </section>
      )
    }

    if (!hasConnections) {
      return (
        <GenericPlaceholder
          title={translate('text_1785248821375zwy6pnlk3q7')}
          subtitle={translate('text_1795083825204o2xktr1k5bf')}
          image={<EmptyImage width="136" height="104" />}
          buttonTitle={translate('text_65846763e6140b469140e235')}
          buttonAction={openAddAgentStorefrontDialog}
        />
      )
    }

    return (
      <section>
        <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />
        {connections.map((connection) => (
          <IntegrationsPage.ListItem
            key={`agent-storefront-connection-${connection.id}`}
            to={generatePath(AGENT_STOREFRONT_INTEGRATION_DETAILS_ROUTE, {
              integrationId: connection.id,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            label={connection.name}
            subLabel={connection.code}
          />
        ))}
      </section>
    )
  }

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
          badges: hasConnections
            ? [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }]
            : [],
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

      <IntegrationsPage.Container>{renderConnections()}</IntegrationsPage.Container>
    </>
  )
}

export default AgentStorefrontIntegrations
