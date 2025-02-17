import { gql } from '@apollo/client'
import { FC, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Avatar,
  Button,
  ButtonLink,
  Icon,
  IconName,
  Popper,
  Skeleton,
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
import { INTEGRATIONS_ROUTE, SALESFORCE_INTEGRATION_ROUTE } from '~/core/router'
import {
  DeleteSalesforceIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  SalesforceForCreateDialogFragmentDoc,
  SalesforceIntegrationDetailsFragment,
  useGetSalesforceIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Salesforce from '~/public/images/salesforce.svg'
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
      navigate(
        generatePath(SALESFORCE_INTEGRATION_ROUTE, {
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
            to={generatePath(SALESFORCE_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
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
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Salesforce />}
        integrationName={salesforceIntegration?.name || ''}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_1731510123491gx2nw155ce0')}
      />

      <div className="container">
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
