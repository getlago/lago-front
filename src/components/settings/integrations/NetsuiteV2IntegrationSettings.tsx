import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Alert, Button } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  INTEGRATIONS_ROUTE,
  NETSUITE_V2_INTEGRATION_DETAILS_ROUTE,
  NETSUITE_V2_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteNetsuiteV2IntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  NetsuiteV2ForCreateDialogDialogFragmentDoc,
  NetsuiteV2IntegrationSettingsFragment,
  useGetNetsuiteV2IntegrationsSettingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NetsuiteV2IntegrationDetailsTabs } from '~/pages/settings/NetsuiteV2IntegrationDetails'

import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from './AddEditDeleteSuccessRedirectUrlDialog'
import { AddNetsuiteV2Dialog, AddNetsuiteV2DialogRef } from './AddNetsuiteV2Dialog'
import {
  DeleteNetsuiteV2IntegrationDialog,
  DeleteNetsuiteV2IntegrationDialogRef,
} from './DeleteNetsuiteV2IntegrationDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment NetsuiteV2IntegrationSettings on NetsuiteV2Integration {
    id
    accountId
    clientId
    clientSecret
    code
    name
    scriptEndpointUrl
    syncCreditNotes
    syncInvoices
    syncPayments
  }

  query getNetsuiteV2IntegrationsSettings(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on NetsuiteV2Integration {
        id
        ...NetsuiteV2IntegrationSettings
        ...DeleteNetsuiteV2IntegrationDialog
        ...NetsuiteV2ForCreateDialogDialog
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on NetsuiteV2Integration {
          id
        }
      }
    }
  }

  ${DeleteNetsuiteV2IntegrationDialogFragmentDoc}
  ${NetsuiteV2ForCreateDialogDialogFragmentDoc}
`

const buildEnabledSynchronizedLabelKeys = (integration?: NetsuiteV2IntegrationSettingsFragment) => {
  const labels = ['text_661ff6e56ef7e1b7c542b2c2']

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

const NetsuiteV2IntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addNetsuiteV2DialogRef = useRef<AddNetsuiteV2DialogRef>(null)
  const deleteDialogRef = useRef<DeleteNetsuiteV2IntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNetsuiteV2IntegrationsSettingsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Netsuite],
    },
    skip: !integrationId,
  })
  const netsuiteV2Integration = data?.integration as NetsuiteV2IntegrationSettingsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(NETSUITE_V2_INTEGRATION_ROUTE, {
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
    <>
      <IntegrationsPage.Container className="my-4 md:my-8">
        <section>
          <IntegrationsPage.Headline label={translate('text_661ff6e56ef7e1b7c542b232')}>
            <Button
              variant="inline"
              disabled={loading}
              onClick={() => {
                addNetsuiteV2DialogRef.current?.openDialog({
                  provider: netsuiteV2Integration,
                  deleteModalRef: deleteDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </IntegrationsPage.Headline>

          <>
            {loading &&
              [0, 1, 2].map((i) => (
                <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
              ))}
            {!loading && (
              <>
                <IntegrationsPage.DetailsItem
                  icon="text"
                  label={translate('text_626162c62f790600f850b76a')}
                  value={netsuiteV2Integration?.name}
                />
                <IntegrationsPage.DetailsItem
                  icon="id"
                  label={translate('text_62876e85e32e0300e1803127')}
                  value={netsuiteV2Integration?.code}
                />
                <IntegrationsPage.DetailsItem
                  icon="info-circle"
                  label={translate('text_661ff6e56ef7e1b7c542b216')}
                  value={netsuiteV2Integration?.accountId ?? undefined}
                />
                <IntegrationsPage.DetailsItem
                  icon="info-circle"
                  label={translate('text_661ff6e56ef7e1b7c542b230')}
                  value={netsuiteV2Integration?.clientId ?? undefined}
                />
                <IntegrationsPage.DetailsItem
                  icon="key"
                  label={translate('text_661ff6e56ef7e1b7c542b247')}
                  value={netsuiteV2Integration?.clientSecret ?? undefined}
                />
                {!!netsuiteV2Integration?.scriptEndpointUrl && (
                  <IntegrationsPage.DetailsItem
                    icon="link"
                    label={translate('text_661ff6e56ef7e1b7c542b2a0')}
                    value={netsuiteV2Integration?.scriptEndpointUrl}
                  />
                )}
                <IntegrationsPage.DetailsItem
                  icon="schema"
                  label={translate('text_661ff6e56ef7e1b7c542b2b4')}
                  value={buildEnabledSynchronizedLabelKeys(netsuiteV2Integration)
                    .map((t) => translate(t))
                    .sort((a, b) => a.localeCompare(b))
                    .join(', ')}
                />
              </>
            )}
          </>
        </section>
      </IntegrationsPage.Container>

      <AddNetsuiteV2Dialog ref={addNetsuiteV2DialogRef} />
      <DeleteNetsuiteV2IntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default NetsuiteV2IntegrationSettings
