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
  AddSalesforceDialog,
  AddSalesforceDialogRef,
} from '~/components/settings/integrations/AddSalesforceDialog'
import {
  DeleteSalesforceIntegrationDialog,
  DeleteSalesforceIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteSalesforceIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { INTEGRATIONS_ROUTE, SALESFORCE_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  DeleteSalesforceIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  SalesforceForCreateDialogFragmentDoc,
  SalesforceIntegrationsFragment,
  useGetSalesforceIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Salesforce from '~/public/images/salesforce.svg'
import { MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment SalesforceIntegrations on SalesforceIntegration {
    id
    name
    code
    ...SalesforceForCreateDialog
    ...DeleteSalesforceIntegrationDialog
  }

  query getSalesforceIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on SalesforceIntegration {
          id
          ...SalesforceIntegrations
          ...SalesforceForCreateDialog
        }
      }
    }
  }

  ${SalesforceForCreateDialogFragmentDoc}
  ${DeleteSalesforceIntegrationDialogFragmentDoc}
`

const SalesforceIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  const addSalesforceDialogRef = useRef<AddSalesforceDialogRef>(null)
  const deleteSalesforceDialogRef = useRef<DeleteSalesforceIntegrationDialogRef>(null)

  const { data, loading } = useGetSalesforceIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.Salesforce] },
  })

  const connections = data?.integrations?.collection as SalesforceIntegrationsFragment[] | undefined
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
              {translate('text_1731507195246vu9kt6xnhv6')}
            </Typography>
          )}
        </PageHeader.Group>
        <Button variant="primary" onClick={() => addSalesforceDialogRef.current?.openDialog()}>
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Salesforce />}
        integrationName={translate('text_1731507195246vu9kt6xnhv6')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_1731510123491gx2nw155ce0')}
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
                  key={`salesforce-connection-${index}`}
                  to={generatePath(SALESFORCE_INTEGRATION_DETAILS_ROUTE, {
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
                          <Button icon="dots-horizontal" variant="quaternary" />
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
                            addSalesforceDialogRef.current?.openDialog({
                              provider: connection,
                              deleteModalRef: deleteSalesforceDialogRef,
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
                            deleteSalesforceDialogRef.current?.openDialog({
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

      <AddSalesforceDialog ref={addSalesforceDialogRef} />
      <DeleteSalesforceIntegrationDialog ref={deleteSalesforceDialogRef} />
    </>
  )
}

export default SalesforceIntegrations
