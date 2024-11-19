import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Alert, Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  ANROK_INTEGRATION_DETAILS_ROUTE,
  ANROK_INTEGRATION_ROUTE,
  INTEGRATIONS_ROUTE,
} from '~/core/router'
import {
  AddAnrokIntegrationDialogFragmentDoc,
  AnrokIntegrationSettingsFragment,
  DeleteAnrokIntegrationDialogFragmentDoc,
  useGetAnrokIntegrationsSettingsQuery,
  useRetryAllInvoicesMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { AnrokIntegrationDetailsTabs } from '~/pages/settings/AnrokIntegrationDetails'
import { NAV_HEIGHT, theme } from '~/styles'

import { AddAnrokDialog, AddAnrokDialogRef } from './AddAnrokDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from './AddEditDeleteSuccessRedirectUrlDialog'
import {
  DeleteAnrokIntegrationDialog,
  DeleteAnrokIntegrationDialogRef,
} from './DeleteAnrokIntegrationDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment AnrokIntegrationSettings on AnrokIntegration {
    id
    name
    code
    apiKey
    hasMappingsConfigured
    failedInvoicesCount
  }

  query getAnrokIntegrationsSettings($id: ID!, $limit: Int) {
    integration(id: $id) {
      ... on AnrokIntegration {
        id
        ...AnrokIntegrationSettings
        ...DeleteAnrokIntegrationDialog
        ...AddAnrokIntegrationDialog
      }
    }

    integrations(limit: $limit) {
      collection {
        ... on AnrokIntegration {
          id
        }
      }
    }
  }

  mutation retryAllInvoices($input: RetryAllInvoicesInput!) {
    retryAllInvoices(input: $input) {
      metadata {
        totalCount
      }
    }
  }

  ${DeleteAnrokIntegrationDialogFragmentDoc}
  ${AddAnrokIntegrationDialogFragmentDoc}
`

const AnrokIntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addAnrokDialogRef = useRef<AddAnrokDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAnrokIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const [retryAllInvoices] = useRetryAllInvoicesMutation({
    onCompleted(result) {
      if (!!result?.retryAllInvoices?.metadata?.totalCount) {
        addToast({
          severity: 'info',
          message: translate('text_66ba5a76e614f000a738c97f'),
        })
      }
    },
    refetchQueries: ['getAnrokIntegrationsSettings'],
  })
  const { data, loading } = useGetAnrokIntegrationsSettingsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
    },
    skip: !integrationId,
  })
  const anrokIntegration = data?.integration as AnrokIntegrationSettingsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(ANROK_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <Settings>
        {!!anrokIntegration && !anrokIntegration?.hasMappingsConfigured && (
          <Alert
            type="warning"
            ButtonProps={{
              label: translate('text_661ff6e56ef7e1b7c542b20a'),
              onClick: () => {
                navigate(
                  generatePath(ANROK_INTEGRATION_DETAILS_ROUTE, {
                    integrationId,
                    tab: AnrokIntegrationDetailsTabs.Items,
                  }),
                )
              },
            }}
          >
            {translate('text_6668821d94e4da4dfd8b3888')}
          </Alert>
        )}

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_661ff6e56ef7e1b7c542b232')}</Typography>
            <Button
              variant="quaternary"
              disabled={loading}
              onClick={() => {
                addAnrokDialogRef.current?.openDialog({
                  integration: anrokIntegration,
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
                    <Skeleton variant="text" className="w-60" />
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
                      {anrokIntegration?.name}
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
                      {anrokIntegration?.code}
                    </Typography>
                  </div>
                </Item>
                <Item>
                  <Avatar variant="connector" size="big">
                    <Icon name="info-circle" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_6668821d94e4da4dfd8b38d5')}
                    </Typography>
                    <Typography
                      variant="body"
                      color="grey700"
                      sx={{
                        lineBreak: 'anywhere',
                      }}
                    >
                      {anrokIntegration?.apiKey}
                    </Typography>
                  </div>
                </Item>
              </>
            )}
          </>
        </section>

        <Stack
          direction="row"
          gap={4}
          justifyContent="space-between"
          alignItems="center"
          paddingBottom={6}
          sx={{ boxShadow: theme.shadows[7] }}
        >
          <Stack flex={1}>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_66ba5a76e614f000a738c97a')}
            </Typography>
            {loading ? (
              <Skeleton className="mb-1 mt-2" variant="text" />
            ) : !!anrokIntegration?.failedInvoicesCount ? (
              <Stack display="inline" divider={<>{/* Space here is important */} </>}>
                <Typography component="span" variant="caption" color="grey600">
                  {translate('text_66ba5a76e614f000a738c97b')}
                </Typography>
                <Typography component="span" variant="caption" color="grey700">
                  {translate(
                    'text_66ba5a76e614f000a738c97c',
                    {
                      failedInvoicesCount: anrokIntegration?.failedInvoicesCount,
                    },
                    anrokIntegration?.failedInvoicesCount || 1,
                  )}
                </Typography>
                <Typography component="span" variant="caption" color="grey600">
                  {translate('text_66ba5a76e614f000a738c97d')}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="caption" color="grey600">
                {translate('text_66ba5ca33713b600c4e8fcf0')}
              </Typography>
            )}
          </Stack>

          <Button
            variant="quaternary"
            disabled={!anrokIntegration?.failedInvoicesCount}
            onClick={async () => await retryAllInvoices({ variables: { input: {} } })}
          >
            {translate('text_66ba5a76e614f000a738c97e')}
          </Button>
        </Stack>
      </Settings>
      <AddAnrokDialog ref={addAnrokDialogRef} />
      <DeleteAnrokIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default AnrokIntegrationSettings

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
