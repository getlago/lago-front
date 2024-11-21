import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  AddSalesforceDialog,
  AddSalesforceDialogRef,
} from '~/components/settings/integrations/AddSalesforceDialog'
import {
  DeleteSalesforceIntegrationDialog,
  DeleteSalesforceIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteSalesforceIntegrationDialog'
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
import { ListItemLink, MenuPopper, PageHeader, PopperOpener } from '~/styles'

gql`
  fragment SalesforceIntegrations on SalesforceIntegration {
    id
    name
    code
    ...SalesforceForCreateDialog
    ...DeleteSalesforceIntegrationDialog
  }

  query getSalesforceIntegrationsList($limit: Int, $type: IntegrationTypeEnum) {
    integrations(limit: $limit, type: $type) {
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
    variables: { limit: 1000, type: IntegrationTypeEnum.Salesforce },
  })

  const connections = data?.integrations?.collection as SalesforceIntegrationsFragment[] | undefined
  const deleteDialogCallback =
    connections && connections?.length === 1 ? () => navigate(INTEGRATIONS_ROUTE) : undefined

  return (
    <>
      <PageHeader $withSide>
        <div className="flex items-center gap-3">
          <ButtonLink
            to={INTEGRATIONS_ROUTE}
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
        </div>
        <Button variant="primary" onClick={() => addSalesforceDialogRef.current?.openDialog()}>
          {translate('text_65846763e6140b469140e235')}
        </Button>
      </PageHeader>
      <div className="container">
        <section className="flex items-center py-8">
          {loading ? (
            <>
              <Skeleton variant="connectorAvatar" size="large" className="mr-4" />
              <div className="flex-1">
                <Skeleton variant="text" className="mb-5 w-50" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="mr-4" variant="connector-full" size="large">
                <Salesforce />
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Typography variant="headline">
                    {translate('text_1731507195246vu9kt6xnhv6')}
                  </Typography>
                  <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
                </div>

                <Typography>{translate('text_1731510123491gx2nw155ce0')}</Typography>
              </div>
            </>
          )}
        </section>

        <div className="flex flex-col gap-8">
          <section>
            <div className="flex h-18 w-full items-center">
              <Typography variant="subhead">
                {translate('text_65846763e6140b469140e239')}
              </Typography>
            </div>

            <>
              {loading ? (
                <>
                  {[1, 2].map((i) => (
                    <div
                      className="flex h-18 items-center shadow-b"
                      key={`item-skeleton-item-${i}`}
                    >
                      <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                      <Skeleton variant="text" className="w-60" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {connections?.map((connection) => {
                    return (
                      <div className="relative" key={`salesforce-connection-${connection.id}`}>
                        <ListItemLink
                          tabIndex={0}
                          className="p-0"
                          to={generatePath(SALESFORCE_INTEGRATION_DETAILS_ROUTE, {
                            integrationId: connection.id,
                          })}
                        >
                          <div className="flex flex-row items-center gap-3">
                            <Avatar variant="connector" size="big">
                              <Icon name="plug" color="dark" />
                            </Avatar>
                            <div>
                              <Typography variant="body" color="grey700">
                                {connection.name}
                              </Typography>
                              <Typography variant="caption" color="grey600">
                                {connection.code}
                              </Typography>
                            </div>
                          </div>
                        </ListItemLink>
                        <Popper
                          PopperProps={{ placement: 'bottom-end' }}
                          opener={({ isOpen }) => (
                            <PopperOpener className="right-0">
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
                      </div>
                    )
                  })}
                </>
              )}
            </>
          </section>
        </div>
      </div>

      <AddSalesforceDialog ref={addSalesforceDialogRef} />
      <DeleteSalesforceIntegrationDialog ref={deleteSalesforceDialogRef} />
    </>
  )
}

export default SalesforceIntegrations
