import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { IntegrationsPage } from '~/components/layouts/Integrations'
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
import { ALWAYS_SYNCED_OBJECT_KEYS, OPTIONAL_SYNCED_OBJECTS } from './quickbooksIntegrationForm'
import {
  QUICKBOOKS_CONNECTION_COUNT_LIMIT,
  useQuickbooksAfterDeleteRedirect,
} from './useQuickbooksAfterDeleteRedirect'

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

const buildEnabledSynchronizedLabelKeys = (integration?: QuickbooksIntegrationSettingsFragment) => [
  ...ALWAYS_SYNCED_OBJECT_KEYS,
  ...OPTIONAL_SYNCED_OBJECTS.filter(({ name }) => integration?.[name]).map(
    ({ objectKey }) => objectKey,
  ),
]

const QuickbooksIntegrationSettings = () => {
  const { integrationId = '' } = useParams()
  const { openAddQuickbooksDialog } = useAddQuickbooksDialog()
  const { translate } = useInternationalization()
  const { data, loading } = useGetQuickbooksIntegrationsSettingsQuery({
    variables: {
      id: integrationId,
      limit: QUICKBOOKS_CONNECTION_COUNT_LIMIT,
      integrationsType: [IntegrationTypeEnum.Quickbooks],
    },
    skip: !integrationId,
  })
  const quickbooksIntegration =
    data?.integration?.__typename === 'QuickbooksIntegration' ? data.integration : undefined
  const isFirstLoad = loading && !data
  const { hasPermissions } = usePermissions()
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const deleteDialogCallback = useQuickbooksAfterDeleteRedirect(
    data?.integrations?.collection.length ?? 0,
  )

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
