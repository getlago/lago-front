import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, QUICKBOOKS_INTEGRATION_ROUTE, useNavigate } from '~/core/router'
import {
  DeleteQuickbooksIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  QuickbooksForCreateDialogFragmentDoc,
  QuickbooksIntegrationSettingsFragment,
  useGetQuickbooksIntegrationsSettingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useAddQuickbooksDialog } from './AddQuickbooksDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment QuickbooksIntegrationSettings on QuickbooksIntegration {
    id
    code
    connectionId
    name
    realmId
    sandbox
    syncCreditNotes
    syncInvoices
    syncPayments
  }

  query getQuickbooksIntegrationsSettings(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on QuickbooksIntegration {
        id
        ...QuickbooksIntegrationSettings
        ...DeleteQuickbooksIntegrationDialog
        ...QuickbooksForCreateDialog
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

const buildEnabledSynchronizedLabelKeys = (integration?: QuickbooksIntegrationSettingsFragment) => {
  const labels = [
    'text_661ff6e56ef7e1b7c542b2a6',
    'text_661ff6e56ef7e1b7c542b2c2',
    'text_661ff6e56ef7e1b7c542b2d7',
  ]

  if (integration?.syncInvoices) {
    labels.push('text_661ff6e56ef7e1b7c542b2ff')
  }

  if (integration?.syncCreditNotes) {
    labels.push('text_661ff6e56ef7e1b7c542b2e9')
  }

  if (integration?.syncPayments) {
    labels.push('text_661ff6e56ef7e1b7c542b311')
  }

  return labels
}

const QuickbooksIntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const { openAddQuickbooksDialog } = useAddQuickbooksDialog()
  const { translate } = useInternationalization()
  const { data, loading } = useGetQuickbooksIntegrationsSettingsQuery({
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
  const { hasPermissions } = usePermissions()
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
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

  return (
    <IntegrationsPage.Container className="my-4 md:my-8">
      <section>
        <IntegrationsPage.Headline label={translate('text_661ff6e56ef7e1b7c542b232')}>
          {canEditIntegration && (
            <Button
              variant="inline"
              disabled={isFirstLoad}
              onClick={() => {
                openAddQuickbooksDialog({
                  provider: quickbooksIntegration,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          )}
        </IntegrationsPage.Headline>

        <>
          {isFirstLoad &&
            [0, 1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}
          {!isFirstLoad && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={quickbooksIntegration?.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={quickbooksIntegration?.code}
              />
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1795434241689u9e37d7nlyt')}
                value={translate(
                  quickbooksIntegration?.sandbox
                    ? 'text_1794221187063c6xcfwvtt6l'
                    : 'text_17954342416893m90kxj9h0j',
                )}
              />
              <IntegrationsPage.DetailsItem
                icon="company"
                label={translate('text_1795434241690xc2o8p8hgf7')}
                value={quickbooksIntegration?.realmId ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="schema"
                label={translate('text_661ff6e56ef7e1b7c542b2b4')}
                value={buildEnabledSynchronizedLabelKeys(quickbooksIntegration)
                  .map((t) => translate(t))
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              />
            </>
          )}
        </>
      </section>
    </IntegrationsPage.Container>
  )
}

export default QuickbooksIntegrationSettings
