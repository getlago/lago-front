import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { useAddQuickbooksDialog } from '~/components/settings/integrations/AddQuickbooksDialog'
import { useDeleteQuickbooksIntegrationDialog } from '~/components/settings/integrations/DeleteQuickbooksIntegrationDialog'
import QuickbooksIntegrationSettings from '~/components/settings/integrations/QuickbooksIntegrationSettings'
import { authorizeQuickbooksConnection } from '~/components/settings/integrations/utils'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  INTEGRATIONS_ROUTE,
  QUICKBOOKS_INTEGRATION_DETAILS_ROUTE,
  QUICKBOOKS_INTEGRATION_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  DeleteQuickbooksIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  QuickbooksForCreateDialogFragmentDoc,
  useGetQuickbooksIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Quickbooks from '~/public/images/quickbooks.svg'

const PROVIDER_CONNECTION_LIMIT = 2

export enum QuickbooksIntegrationDetailsTabs {
  Settings = 'settings',
}

gql`
  fragment QuickbooksIntegrationDetails on QuickbooksIntegration {
    id
    name
    connectionId
    sandbox
    ...DeleteQuickbooksIntegrationDialog
    ...QuickbooksForCreateDialog
  }

  query getQuickbooksIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on QuickbooksIntegration {
        id
        ...QuickbooksIntegrationDetails
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on QuickbooksIntegration {
          id
        }
      }
    }
  }

  ${DeleteQuickbooksIntegrationDialogFragmentDoc}
  ${QuickbooksForCreateDialogFragmentDoc}
`

const QuickbooksIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const { openAddQuickbooksDialog } = useAddQuickbooksDialog()
  const { openDeleteQuickbooksIntegrationDialog } = useDeleteQuickbooksIntegrationDialog()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])
  const { data, loading } = useGetQuickbooksIntegrationsDetailsQuery({
    variables: {
      id: integrationId,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Quickbooks],
    },
    skip: !integrationId,
  })
  const quickbooksIntegration =
    data?.integration?.__typename === 'QuickbooksIntegration' ? data.integration : undefined
  const isFirstLoad = loading && !data
  const activeTabContent = useMainHeaderTabContent()
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(QUICKBOOKS_INTEGRATION_ROUTE, {
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
    } else {
      navigate(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )
    }
  }
  const openDeleteDialog = () => {
    openDeleteQuickbooksIntegrationDialog({
      provider: quickbooksIntegration ?? null,
      callback: deleteDialogCallback,
    })
  }

  return (
    <>
      <MainHeader.Configure
        snapshotKey={JSON.stringify(quickbooksIntegration)}
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
          {
            label: translate('text_179543424168937zditnx1d9'),
            path: generatePath(QUICKBOOKS_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
        ]}
        entity={{
          viewName: quickbooksIntegration?.name || '',
          viewNameLoading: isFirstLoad,
          metadata: translate('text_1795434241689stydxtzzm1w'),
          metadataLoading: isFirstLoad,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <Quickbooks />,
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
                    openAddQuickbooksDialog({
                      provider: quickbooksIntegration,
                      deleteDialogCallback,
                    })
                    closePopper()
                  },
                },
                {
                  label: translate('text_62b31e1f6a5b8b1b745ece41'),
                  hidden: !canEditIntegration,
                  onClick: async (closePopper) => {
                    if (!quickbooksIntegration) return closePopper()

                    const isAuthorized = await authorizeQuickbooksConnection({
                      sandbox: quickbooksIntegration.sandbox,
                      connectionId: quickbooksIntegration.connectionId,
                    })

                    if (isAuthorized) {
                      addToast({
                        message: translate('text_174677760992972pm9p2l5on'),
                        severity: 'success',
                      })
                    }

                    closePopper()
                  },
                },
                {
                  label: translate('text_65845f35d7d69c3ab4793dad'),
                  hidden: !canDeleteIntegration,
                  onClick: (closePopper) => {
                    openDeleteDialog()
                    closePopper()
                  },
                },
              ],
            },
          ],
          loading: isFirstLoad,
        }}
        tabs={[
          {
            title: translate('text_62728ff857d47b013204c726'),
            link: generatePath(QUICKBOOKS_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: QuickbooksIntegrationDetailsTabs.Settings,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
            content: <QuickbooksIntegrationSettings />,
          },
        ]}
      />

      <>{activeTabContent}</>
    </>
  )
}

export default QuickbooksIntegrationDetails
