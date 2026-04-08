import { gql, useQuery } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { StatusType } from '~/components/designSystem/Status'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { AUTHENTICATION_ROUTE } from '~/core/router'
import { AuthenticationMethodsEnum, LagoApiError } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useAddEntraIdDialog } from './dialogs/AddEntraIdDialog'
import { useDeleteEntraIdIntegrationDialog } from './dialogs/DeleteEntraIdIntegrationDialog'

gql`
  query GetEntraIdIntegration($id: ID) {
    integration(id: $id) {
      ... on EntraIdIntegration {
        id
        clientId
        clientSecret
        code
        tenantId
        domain
        name
        host
      }
    }
  }
`

type EntraIdIntegration = {
  id: string
  clientId?: string | null
  clientSecret?: string | null
  code: string
  tenantId?: string | null
  domain: string
  name: string
  host?: string | null
}

const ENTRA_ID_METHOD = 'entra_id' as AuthenticationMethodsEnum

const EntraIdAuthenticationDetails = () => {
  const { translate } = useInternationalization()
  const { integrationId } = useParams()
  const { organization } = useOrganizationInfos()
  const navigate = useNavigate()

  const { openAddEntraIdDialog } = useAddEntraIdDialog()
  const { openDeleteEntraIdIntegrationDialog } = useDeleteEntraIdIntegrationDialog()

  const { data, loading, refetch } = useQuery<{ integration?: EntraIdIntegration | null }>(gql`
    query GetEntraIdIntegration($id: ID) {
      integration(id: $id) {
        ... on EntraIdIntegration {
          id
          clientId
          clientSecret
          code
          tenantId
          domain
          name
          host
        }
      }
    }
  `, {
    variables: { id: integrationId },
    skip: !integrationId,
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const integration = data?.integration || null

  const hasOtherAuthenticationMethodsThanEntraId = organization?.authenticationMethods.some(
    (method) => method !== ENTRA_ID_METHOD,
  )

  const onDeleteCallback = () => {
    navigate(AUTHENTICATION_ROUTE)
  }

  const onEditCallback = () => {
    refetch()
  }

  if (!integration) {
    navigate(AUTHENTICATION_ROUTE)
    return null
  }

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_664c732c264d7eed1c74fd96'),
            path: AUTHENTICATION_ROUTE,
          },
        ]}
        entity={{
          viewName: 'Entra ID',
          viewNameLoading: loading,
          metadata: 'Microsoft Entra ID',
          metadataLoading: loading,
          icon: <Icon name="key" size="medium" />,
          badges: [
            {
              label: translate('text_62b1edddbf5f461ab971270d'),
              type: StatusType.default,
            },
          ],
        }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              items: [
                {
                  label: translate('text_664c732c264d7eed1c74fdaa'),
                  onClick: (closePopper) => {
                    closePopper()
                    openAddEntraIdDialog({
                      integration,
                      callback: onEditCallback,
                      deleteCallback: onDeleteCallback,
                    })
                  },
                },
                {
                  label: translate('text_664c732c264d7eed1c74fdb0'),
                  onClick: (closePopper) => {
                    closePopper()
                    openDeleteEntraIdIntegrationDialog({
                      integration,
                      callback: onDeleteCallback,
                    })
                  },
                  disabled: !hasOtherAuthenticationMethodsThanEntraId,
                },
              ],
            },
          ],
          loading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_664c732c264d7eed1c74fdc5')}>
            <Button
              variant="inline"
              disabled={loading}
              onClick={() =>
                openAddEntraIdDialog({
                  integration,
                  callback: onEditCallback,
                  deleteCallback: onDeleteCallback,
                })
              }
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </IntegrationsPage.Headline>

          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
            ))
          ) : (
            <>
              <IntegrationsPage.DetailsItem icon="globe" label="Email domain" value={integration.domain} />
              <IntegrationsPage.DetailsItem icon="globe" label="Host" value={integration.host || 'N/A'} />
              <IntegrationsPage.DetailsItem icon="text" label="Tenant ID" value={integration.tenantId || 'N/A'} />
              <IntegrationsPage.DetailsItem icon="key" label="Client ID" value={integration.clientId || 'N/A'} />
              <IntegrationsPage.DetailsItem icon="key" label="Client secret" value={integration.clientSecret || 'N/A'} />
            </>
          )}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}

export default EntraIdAuthenticationDetails
