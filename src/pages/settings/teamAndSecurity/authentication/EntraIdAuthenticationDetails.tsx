import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { StatusType } from '~/components/designSystem/Status'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { AUTHENTICATION_ROUTE, useNavigate } from '~/core/router'
import {
  AddEntraIdIntegrationDialogFragmentDoc,
  AuthenticationMethodsEnum,
  DeleteEntraIdIntegrationDialogFragmentDoc,
  EntraIdIntegration,
  LagoApiError,
  useGetEntraIdIntegrationQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import MicrosoftEntraId from '~/public/images/microsoft-entra-id.svg'

import { useAddEntraIdDialog } from './dialogs/AddEntraIdDialog'
import { useDeleteEntraIdIntegrationDialog } from './dialogs/DeleteEntraIdIntegrationDialog'

gql`
  fragment EntraIdIntegrationDetails on EntraIdIntegration {
    id
    clientId
    clientSecret
    code
    tenantId
    domain
    name
    host
  }

  query GetEntraIdIntegration($id: ID) {
    integration(id: $id) {
      ... on EntraIdIntegration {
        ...EntraIdIntegrationDetails
        ...AddEntraIdIntegrationDialog
        ...DeleteEntraIdIntegrationDialog
      }
    }
  }

  ${AddEntraIdIntegrationDialogFragmentDoc}
  ${DeleteEntraIdIntegrationDialogFragmentDoc}
`

const EntraIdAuthenticationDetails = () => {
  const { translate } = useInternationalization()
  const { integrationId } = useParams()
  const { organization } = useOrganizationInfos()
  const navigate = useNavigate()

  const { openAddEntraIdDialog } = useAddEntraIdDialog()
  const { openDeleteEntraIdIntegrationDialog } = useDeleteEntraIdIntegrationDialog()

  const { data, loading, refetch } = useGetEntraIdIntegrationQuery({
    variables: { id: integrationId },
    skip: !integrationId,
    context: {
      silentErrorCodes: [LagoApiError.NotFound],
    },
  })

  const integration = data?.integration as EntraIdIntegration | null

  const hasOtherAuthenticationMethodsThanEntraId = organization?.authenticationMethods.some(
    (method) => method !== AuthenticationMethodsEnum.EntraId,
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
          viewName: translate('text_17843073442548zt904xoinv'),
          viewNameLoading: loading,
          metadata: translate('text_1784307344255xnl91ujbf4g'),
          metadataLoading: loading,
          icon: <MicrosoftEntraId />,
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
                  label: translate('text_17843073442559jjt3vfrvmk'),
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
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1784307344255m1d8phj5f9r')}
                value={integration.domain}
              />
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1784307344255fan2blwpos6')}
                value={integration.host || 'N/A'}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_17843073442552x8gcpunesv')}
                value={integration.clientId || 'N/A'}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_17843073442551xjnrw1h4bc')}
                value={integration.clientSecret || 'N/A'}
              />
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_1784307344255tyzraziy4d1')}
                value={integration.tenantId}
              />
            </>
          )}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}

export default EntraIdAuthenticationDetails
