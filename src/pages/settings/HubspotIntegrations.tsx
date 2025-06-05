import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
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
import { HUBSPOT_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  HubspotForCreateDialogFragmentDoc,
  HubspotIntegrationsFragment,
  IntegrationTypeEnum,
  useGetHubspotIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Hubspot from '~/public/images/hubspot.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment HubspotIntegrations on HubspotIntegration {
    id
    name
    code
    ...HubspotForCreateDialog
  }

  query getHubspotIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on HubspotIntegration {
          id
          ...HubspotIntegrations
          ...HubspotForCreateDialog
        }
      }
    }
  }

  ${HubspotForCreateDialogFragmentDoc}
`

const HubspotIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  const addHubspotDialogRef = useRef<AddHubspotDialogRef>(null)
  const deleteDialogRef = useRef<DeleteHubspotIntegrationDialogRef>(null)

  const { data, loading } = useGetHubspotIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.Hubspot] },
  })

  const connections = data?.integrations?.collection as HubspotIntegrationsFragment[] | undefined
  const deleteDialogCallback =
    connections && connections?.length === 1
      ? () =>
          navigate(
            generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          )
      : undefined

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1727189568053s79ks5q07tr')}
            </Typography>
          )}
        </PageHeader.Group>
        <Button variant="primary" onClick={() => addHubspotDialogRef.current?.openDialog()}>
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Hubspot />}
        integrationName={translate('text_1727189568053s79ks5q07tr')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_1727281892403opxm269y6mv')}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {loading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading &&
            connections?.map((connection, index) => {
              return (
                <IntegrationsPage.ListItem
                  key={`hubspot-connection-${index}`}
                  to={generatePath(HUBSPOT_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                  })}
                  label={connection.name}
                  subLabel={connection.code}
                >
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
                            data-test="plan-item-options"
                          />
                        </Tooltip>
                      </PopperOpener>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            addHubspotDialogRef.current?.openDialog({
                              provider: connection,
                              deleteModalRef: deleteDialogRef,
                              deleteDialogCallback,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65845f35d7d69c3ab4793dac')}
                        </Button>
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            deleteDialogRef.current?.openDialog({
                              provider: connection,
                              callback: deleteDialogCallback,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_645d071272418a14c1c76a81')}
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                </IntegrationsPage.ListItem>
              )
            })}
        </section>
      </IntegrationsPage.Container>
      <AddHubspotDialog ref={addHubspotDialogRef} />
      <DeleteHubspotIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default HubspotIntegrations
