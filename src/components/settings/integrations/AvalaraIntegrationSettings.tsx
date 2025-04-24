import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  DeleteAvalaraIntegrationDialog,
  DeleteAvalaraIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAvalaraIntegrationDialog'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  AVALARA_INTEGRATION_DETAILS_ROUTE,
  AVALARA_INTEGRATION_ROUTE,
  INTEGRATIONS_ROUTE,
} from '~/core/router/SettingRoutes'
import {
  AddAvalaraIntegrationDialogFragmentDoc,
  AvalaraIntegrationSettingsFragment,
  DeleteAvalaraIntegrationDialogFragmentDoc,
  useGetAvalaraIntegrationSettingsQuery,
  useRetryAllAvalaraInvoicesMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { AvalaraIntegrationDetailsTabs } from '~/pages/settings/AvalaraIntegrationDetails'

import { AddAvalaraDialog, AddAvalaraDialogRef } from './AddAvalaraDialog'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment AvalaraIntegrationSettings on AvalaraIntegration {
    id
    accountId
    code
    companyCode
    failedInvoicesCount
    hasMappingsConfigured
    licenseKey
    name
  }

  query getAvalaraIntegrationSettings($id: ID!, $limit: Int) {
    integration(id: $id) {
      ... on AvalaraIntegration {
        id
        ...AvalaraIntegrationSettings
        ...DeleteAvalaraIntegrationDialog
        ...AddAvalaraIntegrationDialog
      }
    }

    integrations(limit: $limit) {
      collection {
        ... on AvalaraIntegration {
          id
        }
      }
    }
  }

  mutation retryAllAvalaraInvoices($input: RetryAllInvoicesInput!) {
    retryAllInvoices(input: $input) {
      metadata {
        totalCount
      }
    }
  }

  ${DeleteAvalaraIntegrationDialogFragmentDoc}
  ${AddAvalaraIntegrationDialogFragmentDoc}
`

const AvalaraIntegrationSettings = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addAvalaraDialogRef = useRef<AddAvalaraDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAvalaraIntegrationDialogRef>(null)
  const { translate } = useInternationalization()

  const [retryAllAvalaraInvoices, { loading: retryAllAvalaraInvoicesLoading }] =
    useRetryAllAvalaraInvoicesMutation({
      onCompleted(result) {
        if (!!result?.retryAllInvoices?.metadata?.totalCount) {
          addToast({
            severity: 'info',
            message: translate('text_66ba5a76e614f000a738c97f'),
          })
        }
      },
      refetchQueries: ['getAvalaraIntegrationsSettings'],
    })

  const { data, loading } = useGetAvalaraIntegrationSettingsQuery({
    variables: {
      id: integrationId,
      limit: PROVIDER_CONNECTION_LIMIT,
    },
    skip: !integrationId,
  })

  const avalaraIntegration = data?.integration as AvalaraIntegrationSettingsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(AVALARA_INTEGRATION_ROUTE, {
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
      <IntegrationsPage.Container className="my-4 md:my-8">
        {!!avalaraIntegration && !avalaraIntegration?.hasMappingsConfigured && (
          <Alert
            type="warning"
            ButtonProps={{
              label: translate('text_661ff6e56ef7e1b7c542b20a'),
              onClick: () => {
                navigate(
                  generatePath(AVALARA_INTEGRATION_DETAILS_ROUTE, {
                    integrationId,
                    tab: AvalaraIntegrationDetailsTabs.Items,
                    integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                  }),
                )
              },
            }}
          >
            {translate('text_17454024925701tm53pi3us8')}
          </Alert>
        )}

        <section>
          <IntegrationsPage.Headline label={translate('text_661ff6e56ef7e1b7c542b232')}>
            {!!avalaraIntegration && (
              <Button
                variant="quaternary"
                disabled={loading}
                onClick={() => {
                  addAvalaraDialogRef.current?.openDialog({
                    integration: avalaraIntegration,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                }}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </IntegrationsPage.Headline>

          {loading &&
            [0, 1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}
          {!loading && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_626162c62f790600f850b76a')}
                value={avalaraIntegration?.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_62876e85e32e0300e1803127')}
                value={avalaraIntegration?.code}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1744293609278tzbixvdszc6')}
                value={avalaraIntegration?.accountId}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1744293635187073v2g6xw0o')}
                value={avalaraIntegration?.licenseKey}
              />
              <IntegrationsPage.DetailsItem
                icon="globe"
                label={translate('text_1744293635187hxvz11n5bq3')}
                value={avalaraIntegration?.companyCode}
              />
            </>
          )}
        </section>

        <div className="flex flex-row items-center justify-between gap-4 pb-6 shadow-b">
          <div className="flex-1">
            <Typography variant="bodyHl" color="grey700">
              {translate('text_66ba5a76e614f000a738c97a')}
            </Typography>
            {loading ? (
              <Skeleton className="mb-1 mt-2" variant="text" />
            ) : !!avalaraIntegration?.failedInvoicesCount ? (
              <div className="inline-flex flex-row gap-1">
                <Typography component="span" variant="caption" color="grey600">
                  {translate('text_66ba5a76e614f000a738c97b')}
                </Typography>
                <Typography component="span" variant="caption" color="grey700">
                  {translate(
                    'text_66ba5a76e614f000a738c97c',
                    {
                      failedInvoicesCount: avalaraIntegration?.failedInvoicesCount,
                    },
                    avalaraIntegration?.failedInvoicesCount || 1,
                  )}
                </Typography>
                <Typography component="span" variant="caption" color="grey600">
                  {translate('text_66ba5a76e614f000a738c97d')}
                </Typography>
              </div>
            ) : (
              <Typography variant="caption" color="grey600">
                {retryAllAvalaraInvoicesLoading
                  ? translate('text_66ba5ca33713b600c4e8fcf0')
                  : translate('text_66ba5ca33713b600c4e8fcf2')}
              </Typography>
            )}
          </div>

          <Button
            variant="quaternary"
            disabled={!avalaraIntegration?.failedInvoicesCount}
            onClick={async () => await retryAllAvalaraInvoices({ variables: { input: {} } })}
          >
            {translate('text_66ba5a76e614f000a738c97e')}
          </Button>
        </div>
      </IntegrationsPage.Container>

      <AddAvalaraDialog ref={addAvalaraDialogRef} />
      <DeleteAvalaraIntegrationDialog ref={deleteDialogRef} />
    </>
  )
}

export default AvalaraIntegrationSettings
