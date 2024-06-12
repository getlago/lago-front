import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Alert, Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import {
  INTEGRATIONS_ROUTE,
  NETSUITE_INTEGRATION_DETAILS_ROUTE,
  NETSUITE_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteNetsuiteIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  NetsuiteForCreateDialogDialogFragmentDoc,
  NetsuiteIntegrationSettingsFragment,
  useGetNetsuiteIntegrationsSettingsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NetsuiteIntegrationDetailsTabs } from '~/pages/settings/NetsuiteIntegrationDetails'
import { NAV_HEIGHT, theme } from '~/styles'

import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from './AddEditDeleteSuccessRedirectUrlDialog'
import { AddNetsuiteDialog, AddNetsuiteDialogRef } from './AddNetsuiteDialog'
import {
  DeleteNetsuiteIntegrationDialog,
  DeleteNetsuiteIntegrationDialogRef,
} from './DeleteNetsuiteIntegrationDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment NetsuiteIntegrationSettings on NetsuiteIntegration {
    id
    accountId
    clientId
    clientSecret
    code
    hasMappingsConfigured
    name
    scriptEndpointUrl
    syncCreditNotes
    syncInvoices
    syncPayments
    syncSalesOrders
  }

  query getNetsuiteIntegrationsSettings(
    $id: ID!
    $limit: Int
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on NetsuiteIntegration {
        id
        ...NetsuiteIntegrationSettings
        ...DeleteNetsuiteIntegrationDialog
        ...NetsuiteForCreateDialogDialog
      }
    }

    integrations(limit: $limit, type: $integrationsType) {
      collection {
        ... on NetsuiteIntegration {
          id
        }
      }
    }
  }

  ${DeleteNetsuiteIntegrationDialogFragmentDoc}
  ${NetsuiteForCreateDialogDialogFragmentDoc}
`

const buildEnabledSynchronizedLabelKeys = (integration?: NetsuiteIntegrationSettingsFragment) => {
  const labels = [
    'text_661ff6e56ef7e1b7c542b2a6',
    'text_661ff6e56ef7e1b7c542b2c2',
    'text_661ff6e56ef7e1b7c542b2d7',
  ]

  if (integration?.syncInvoices) {
    labels.push('text_661ff6e56ef7e1b7c542b2ff')
  }

  if (integration?.syncCreditNotes) {
    labels.push('text_661ff6e56ef7e1b7c542b2e9')
  }

  if (integration?.syncSalesOrders) {
    labels.push('text_661ff6e56ef7e1b7c542b31e')
  }

  if (integration?.syncPayments) {
    labels.push('text_661ff6e56ef7e1b7c542b311')
  }

  return labels
}

const NetsuiteIntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addNetsuiteDialogRef = useRef<AddNetsuiteDialogRef>(null)
  const deleteDialogRef = useRef<DeleteNetsuiteIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNetsuiteIntegrationsSettingsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Netsuite,
    },
    skip: !integrationId,
  })
  const netsuiteIntegration = data?.integration as NetsuiteIntegrationSettingsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(NETSUITE_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <Settings>
        {!!netsuiteIntegration && !netsuiteIntegration?.hasMappingsConfigured && (
          <Alert
            type="warning"
            ButtonProps={{
              label: translate('text_661ff6e56ef7e1b7c542b20a'),
              onClick: () => {
                navigate(
                  generatePath(NETSUITE_INTEGRATION_DETAILS_ROUTE, {
                    integrationId,
                    tab: NetsuiteIntegrationDetailsTabs.Items,
                  }),
                )
              },
            }}
          >
            {translate('text_661ff6e56ef7e1b7c542b218')}
          </Alert>
        )}

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_661ff6e56ef7e1b7c542b232')}</Typography>
            <Button
              variant="quaternary"
              disabled={loading}
              onClick={() => {
                addNetsuiteDialogRef.current?.openDialog({
                  provider: netsuiteIntegration,
                  deleteModalRef: deleteDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <Item key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} height={12} />
                  </Item>
                ))}
              </>
            ) : (
              <>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="text" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_626162c62f790600f850b76a')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {netsuiteIntegration?.name}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="id" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_62876e85e32e0300e1803127')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {netsuiteIntegration?.code}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="info-circle" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_661ff6e56ef7e1b7c542b216')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {netsuiteIntegration?.accountId}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="info-circle" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_661ff6e56ef7e1b7c542b230')}
                    </Typography>
                    <Typography
                      variant="body"
                      color="grey700"
                      sx={{
                        lineBreak: 'anywhere',
                      }}
                    >
                      {netsuiteIntegration?.clientId}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="key" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_661ff6e56ef7e1b7c542b247')}
                    </Typography>
                    <Typography
                      variant="body"
                      color="grey700"
                      sx={{
                        lineBreak: 'anywhere',
                      }}
                    >
                      {netsuiteIntegration?.clientSecret}
                    </Typography>
                  </div>
                </Item>
                {!!netsuiteIntegration?.scriptEndpointUrl && (
                  <Item>
                    <Avatar variant="connector" size="big">
                      <Icon name="link" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_661ff6e56ef7e1b7c542b2a0')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {netsuiteIntegration?.scriptEndpointUrl}
                      </Typography>
                    </div>
                  </Item>
                )}
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="schema" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_661ff6e56ef7e1b7c542b2b4')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {buildEnabledSynchronizedLabelKeys(netsuiteIntegration)
                        .map((t) => translate(t))
                        .sort((a, b) => a.localeCompare(b))
                        .join(', ')}
                    </Typography>
                  </div>
                </Item>
              </>
            )}
          </>
        </section>
      </Settings>

      <AddNetsuiteDialog ref={addNetsuiteDialogRef} />
      <DeleteNetsuiteIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default NetsuiteIntegrationSettings

const Settings = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  margin: ${theme.spacing(8)} ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};

  ${theme.breakpoints.down('md')} {
    margin: ${theme.spacing(4)};
  }
`

const InlineTitle = styled.div`
  position: relative;
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Item = styled.div`
  min-height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} 0;
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`
