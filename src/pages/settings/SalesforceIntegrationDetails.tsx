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
  AddSalesforceDialog,
  AddSalesforceDialogRef,
} from '~/components/settings/integrations/AddSalesforceDialog'
import {
  DeleteSalesforceIntegrationDialog,
  DeleteSalesforceIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteSalesforceIntegrationDialog'
import { INTEGRATIONS_ROUTE, SALESFORCE_INTEGRATION_ROUTE } from '~/core/router'
import {
  DeleteSalesforceIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  SalesforceForCreateDialogFragmentDoc,
  SalesforceIntegrationDetailsFragment,
  useGetSalesforceIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Salesforce from '~/public/images/salesforce-large.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment SalesforceIntegrationDetails on SalesforceIntegration {
    id
    name
    code
    instanceId
    ...SalesforceForCreateDialog
    ...DeleteSalesforceIntegrationDialog
  }

  query getSalesforceIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on SalesforceIntegration {
        id
        ...SalesforceIntegrationDetails
      }
    }

    integrations(limit: $limit, type: $integrationsType) {
      collection {
        ... on SalesforceIntegration {
          id
        }
      }
    }
  }

  ${SalesforceForCreateDialogFragmentDoc}
  ${DeleteSalesforceIntegrationDialogFragmentDoc}
`

const SalesforceIntegrationDetails = () => {
  const { integrationId } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const addSalesforceDialogRef = useRef<AddSalesforceDialogRef>(null)
  const deleteSalesforceDialogRef = useRef<DeleteSalesforceIntegrationDialogRef>(null)

  const { data, loading } = useGetSalesforceIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Salesforce,
    },
    skip: !integrationId,
  })

  const salesforceIntegration = data?.integration as
    | SalesforceIntegrationDetailsFragment
    | undefined

  const deleteDialogCallback = () => {
    const integrations = data?.integrations?.collection || []

    if (integrations.length >= PROVIDER_CONNECTION_LIMIT) {
      navigate(SALESFORCE_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <div className="flex items-center gap-3">
          <ButtonLink
            to={SALESFORCE_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {salesforceIntegration?.name}
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
                  addSalesforceDialogRef.current?.openDialog({
                    provider: salesforceIntegration,
                    deleteModalRef: deleteSalesforceDialogRef,
                    deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dac')}
              </Button>
              {salesforceIntegration && (
                <Button
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={() => {
                    deleteSalesforceDialogRef.current?.openDialog({
                      provider: salesforceIntegration,
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
                  <Typography variant="headline">{salesforceIntegration?.name}</Typography>
                  <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
                </div>

                <Typography>{translate('text_1731510123491gx2nw155ce0')}</Typography>
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
                  addSalesforceDialogRef.current?.openDialog({
                    provider: salesforceIntegration,
                    deleteModalRef: deleteSalesforceDialogRef,
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
                  <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                  <Skeleton variant="text" className="w-60" />
                </div>
              ))}
            </>
          ) : (
            <>
              <IntegrationDetailsItem
                icon="text"
                label={translate('text_6419c64eace749372fc72b0f')}
                value={salesforceIntegration?.name}
              />
              <IntegrationDetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={salesforceIntegration?.code}
              />
              <IntegrationDetailsItem
                icon="link"
                label={translate('text_1731510123491s8iyc3roglx')}
                value={salesforceIntegration?.instanceId}
              />
            </>
          )}
        </>
      </div>
      <AddSalesforceDialog ref={addSalesforceDialogRef} />
      <DeleteSalesforceIntegrationDialog ref={deleteSalesforceDialogRef} />
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

export default SalesforceIntegrationDetails
