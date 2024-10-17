import { gql } from '@apollo/client'
import { FC, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Icon,
  IconName,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import {
  AddHubspotDialog,
  AddHubspotDialogRef,
} from '~/components/settings/integrations/AddHubspotDialog'
import {
  DeleteHubspotIntegrationDialog,
  DeleteHubspotIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteHubspotIntegrationDialog'
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
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on HubspotIntegration {
        id
        ...HubspotIntegrationDetails
      }
    }

    integrations(limit: $limit, type: $integrationsType) {
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
      integrationsType: IntegrationTypeEnum.Hubspot,
    },
    skip: !integrationId,
  })

  const hubspotIntegration = data?.integration as HubspotIntegrationDetailsFragment | undefined

  const deleteDialogCallback = () => {
    const integrations = data?.integrations?.collection || []

    if (integrations.length >= PROVIDER_CONNECTION_LIMIT) {
      navigate(HUBSPOT_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <div className="flex items-center gap-3">
          <ButtonLink
            to={HUBSPOT_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {hubspotIntegration?.name}
            </Typography>
          )}
        </div>
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
      </PageHeader>

      <div className="container">
        <section className="flex items-center py-8">
          {loading ? (
            <>
              <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
              <div className="flex-1">
                <Skeleton variant="text" width={200} height={12} marginBottom="22px" />
                <Skeleton variant="text" width={128} height={12} />
              </div>
            </>
          ) : (
            <>
              <Avatar className="mr-4" variant="connector" size="large">
                <Hubspot />
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Typography variant="headline">{hubspotIntegration?.name}</Typography>
                  <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
                </div>

                <Typography>{translate('text_1727281892403opxm269y6mv')}</Typography>
              </div>
            </>
          )}
        </section>

        <div className="flex flex-col gap-8">
          <section>
            <div className="flex h-18 w-full items-center justify-between">
              <Typography variant="subhead">
                {translate('text_664c732c264d7eed1c74fdc5')}
              </Typography>
              <Button
                variant="quaternary"
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
            </div>
          </section>
        </div>

        <>
          {loading ? (
            <>
              {[1, 2].map((i) => (
                <div className="flex h-18 items-center shadow-b" key={`item-skeleton-item-${i}`}>
                  <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                  <Skeleton variant="text" width={240} height={12} />
                </div>
              ))}
            </>
          ) : (
            <>
              <IntegrationDetailsItem
                icon="text"
                label={translate('text_6419c64eace749372fc72b0f')}
                value={hubspotIntegration?.name}
              />
              <IntegrationDetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={hubspotIntegration?.code}
              />
              <IntegrationDetailsItem
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
              <IntegrationDetailsItem
                icon="user-add"
                label={translate('text_1727281892403pbay53j8is3')}
                value={hubspotIntegration?.defaultTargetedObject}
              />
            </>
          )}
        </>
      </div>

      <AddHubspotDialog ref={addHubspotDialogRef} />
      <DeleteHubspotIntegrationDialog ref={deleteHubspotDialogRef} />
    </>
  )
}

const IntegrationDetailsItem: FC<{ icon: IconName; label: string; value?: string }> = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="flex h-18 items-center gap-3 shadow-b">
      <Avatar variant="connector" size="big">
        <Icon name={icon} color="dark" />
      </Avatar>
      <div>
        <Typography variant="caption" color="grey600">
          {label}
        </Typography>
        <Typography variant="body" color="grey700">
          {value}
        </Typography>
      </div>
    </div>
  )
}

export default HubspotIntegrationDetails
