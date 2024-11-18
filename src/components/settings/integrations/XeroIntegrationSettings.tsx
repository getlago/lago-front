import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Alert, Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import {
  INTEGRATIONS_ROUTE,
  XERO_INTEGRATION_DETAILS_ROUTE,
  XERO_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteXeroIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetXeroIntegrationsSettingsQuery,
  XeroForCreateDialogDialogFragmentDoc,
  XeroIntegrationSettingsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { XeroIntegrationDetailsTabs } from '~/pages/settings/XeroIntegrationDetails'
import { NAV_HEIGHT, theme } from '~/styles'

import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from './AddEditDeleteSuccessRedirectUrlDialog'
import { AddXeroDialog, AddXeroDialogRef } from './AddXeroDialog'
import {
  DeleteXeroIntegrationDialog,
  DeleteXeroIntegrationDialogRef,
} from './DeleteXeroIntegrationDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment XeroIntegrationSettings on XeroIntegration {
    id
    code
    connectionId
    hasMappingsConfigured
    name
    syncCreditNotes
    syncInvoices
    syncPayments
  }

  query getXeroIntegrationsSettings(
    $id: ID!
    $limit: Int
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on XeroIntegration {
        id
        ...XeroIntegrationSettings
        ...DeleteXeroIntegrationDialog
        ...XeroForCreateDialogDialog
      }
    }

    integrations(limit: $limit, type: $integrationsType) {
      collection {
        ... on XeroIntegration {
          id
        }
      }
    }
  }

  ${DeleteXeroIntegrationDialogFragmentDoc}
  ${XeroForCreateDialogDialogFragmentDoc}
`

const buildEnabledSynchronizedLabelKeys = (integration?: XeroIntegrationSettingsFragment) => {
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

  if (integration?.syncPayments) {
    labels.push('text_661ff6e56ef7e1b7c542b311')
  }

  return labels
}

const XeroIntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addXeroDialogRef = useRef<AddXeroDialogRef>(null)
  const deleteDialogRef = useRef<DeleteXeroIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetXeroIntegrationsSettingsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Xero,
    },
    skip: !integrationId,
  })
  const xeroIntegration = data?.integration as XeroIntegrationSettingsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(XERO_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <Settings>
        {!loading && !!xeroIntegration && !xeroIntegration?.hasMappingsConfigured && (
          <Alert
            type="warning"
            ButtonProps={{
              label: translate('text_661ff6e56ef7e1b7c542b20a'),
              onClick: () => {
                navigate(
                  generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
                    integrationId,
                    tab: XeroIntegrationDetailsTabs.Items,
                  }),
                )
              },
            }}
          >
            {translate('text_6672ebb8b1b50be550eccaa0')}
          </Alert>
        )}

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_661ff6e56ef7e1b7c542b232')}</Typography>
            <Button
              variant="quaternary"
              disabled={loading}
              onClick={() => {
                addXeroDialogRef.current?.openDialog({
                  provider: xeroIntegration,
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
                    <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
                    <Skeleton variant="text" width={240} />
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
                      {xeroIntegration?.name}
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
                      {xeroIntegration?.code}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="schema" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_661ff6e56ef7e1b7c542b2b4')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {buildEnabledSynchronizedLabelKeys(xeroIntegration)
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
      <AddXeroDialog ref={addXeroDialogRef} />
      <DeleteXeroIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default XeroIntegrationSettings

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
