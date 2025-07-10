import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, ButtonLink, Popper, Skeleton, Typography } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddHubspotDialog,
  AddHubspotDialogRef,
} from '~/components/settings/integrations/AddHubspotDialog'
import {
  DeleteHubspotIntegrationDialog,
  DeleteHubspotIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteHubspotIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { HUBSPOT_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  DeleteHubspotIntegrationDialogFragmentDoc,
  HubspotForCreateDialogFragmentDoc,
  HubspotIntegrationDetailsFragment,
  IntegrationTypeEnum,
  useGetHubspotIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Hubspot from '~/public/images/hubspot.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment HubspotIntegrationDetails on HubspotIntegration {
    id
    name
    code
    defaultTargetedObject
    syncInvoices
    syncSubscriptions
    ...HubspotForCreateDialog
    ...DeleteHubspotIntegrationDialog
  }

  query getHubspotIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on HubspotIntegration {
        id
        ...HubspotIntegrationDetails
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on HubspotIntegration {
          id
        }
      }
    }
  }

  ${HubspotForCreateDialogFragmentDoc}
  ${DeleteHubspotIntegrationDialogFragmentDoc}
`

const HubspotIntegrationDetails = () => {
  const { integrationId } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const addHubspotDialogRef = useRef<AddHubspotDialogRef>(null)
  const deleteHubspotDialogRef = useRef<DeleteHubspotIntegrationDialogRef>(null)

  const { data, loading } = useGetHubspotIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Hubspot],
    },
    skip: !integrationId,
  })

  const hubspotIntegration = data?.integration as HubspotIntegrationDetailsFragment | undefined

  const deleteDialogCallback = () => {
    const integrations = data?.integrations?.collection || []

    if (integrations.length >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(HUBSPOT_INTEGRATION_ROUTE, {
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
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(HUBSPOT_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {hubspotIntegration?.name}
            </Typography>
          )}
        </PageHeader.Group>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                fullWidth
                align="left"
                onClick={() => {
                  addHubspotDialogRef.current?.openDialog({
                    provider: hubspotIntegration,
                    deleteModalRef: deleteHubspotDialogRef,
                    deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dac')}
              </Button>
              {hubspotIntegration && (
                <Button
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={() => {
                    deleteHubspotDialogRef.current?.openDialog({
                      provider: hubspotIntegration,
                      callback: deleteDialogCallback,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_65845f35d7d69c3ab4793dad')}
                </Button>
              )}
            </MenuPopper>
          )}
        </Popper>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Hubspot />}
        integrationName={hubspotIntegration?.name || ''}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_1727281892403opxm269y6mv')}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_664c732c264d7eed1c74fdc5')}>
            <Button
              variant="inline"
              disabled={loading}
              onClick={() => {
                addHubspotDialogRef.current?.openDialog({
                  provider: hubspotIntegration,
                  deleteModalRef: deleteHubspotDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </IntegrationsPage.Headline>

          {loading &&
            [0, 1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_6419c64eace749372fc72b0f')}
                value={hubspotIntegration?.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={hubspotIntegration?.code}
              />
              <IntegrationsPage.DetailsItem
                icon="schema"
                label={translate('text_661ff6e56ef7e1b7c542b2b4')}
                value={[
                  translate('text_1727281892403pmg1yza7x1e'),
                  translate('text_1727281892403m7aoqothh7r'),
                  hubspotIntegration?.syncInvoices && translate('text_1727281892403ljelfgyyupg'),
                  hubspotIntegration?.syncSubscriptions &&
                    translate('text_1727281892403w0qjgmdf8n4'),
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
              <IntegrationsPage.DetailsItem
                icon="user-add"
                label={translate('text_1727281892403pbay53j8is3')}
                value={hubspotIntegration?.defaultTargetedObject}
              />
            </>
          )}
        </section>
      </IntegrationsPage.Container>

      <AddHubspotDialog ref={addHubspotDialogRef} />
      <DeleteHubspotIntegrationDialog ref={deleteHubspotDialogRef} />
    </>
  )
}

export default HubspotIntegrationDetails
