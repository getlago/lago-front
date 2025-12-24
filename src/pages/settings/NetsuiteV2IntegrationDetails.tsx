import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddNetsuiteV2Dialog,
  AddNetsuiteV2DialogRef,
} from '~/components/settings/integrations/AddNetsuiteV2Dialog'
import {
  DeleteNetsuiteV2IntegrationDialog,
  DeleteNetsuiteV2IntegrationDialogRef,
} from '~/components/settings/integrations/DeleteNetsuiteV2IntegrationDialog'
import NetsuiteV2IntegrationSettings from '~/components/settings/integrations/NetsuiteV2IntegrationSettings'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  INTEGRATIONS_ROUTE,
  NETSUITE_V2_INTEGRATION_DETAILS_ROUTE,
  NETSUITE_V2_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteNetsuiteV2IntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  NetsuiteV2ForCreateDialogDialogFragmentDoc,
  NetsuiteV2IntegrationDetailsFragment,
  useGetNetsuiteV2IntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Netsuite from '~/public/images/netsuite.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum NetsuiteV2IntegrationDetailsTabs {
  Settings = 'settings',
}

gql`
  fragment NetsuiteV2IntegrationDetails on NetsuiteV2Integration {
    id
    name
    ...DeleteNetsuiteV2IntegrationDialog
    ...NetsuiteV2ForCreateDialogDialog
  }

  query getNetsuiteV2IntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on NetsuiteV2Integration {
        id
        ...NetsuiteV2IntegrationDetails
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on NetsuiteV2Integration {
          id
        }
      }
    }
  }

  ${DeleteNetsuiteV2IntegrationDialogFragmentDoc}
  ${NetsuiteV2ForCreateDialogDialogFragmentDoc}
`

const NetsuiteIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addNetsuiteV2DialogRef = useRef<AddNetsuiteV2DialogRef>(null)
  const deleteDialogRef = useRef<DeleteNetsuiteV2IntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNetsuiteV2IntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Netsuite],
    },
    skip: !integrationId,
  })
  const netsuiteV2Integration = data?.integration as NetsuiteV2IntegrationDetailsFragment | undefined
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(NETSUITE_V2_INTEGRATION_ROUTE, {
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
            to={generatePath(NETSUITE_V2_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {netsuiteV2Integration?.name}
            </Typography>
          )}
        </PageHeader.Group>
        {netsuiteV2Integration && (
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
                    addNetsuiteV2DialogRef.current?.openDialog({
                      provider: netsuiteV2Integration,
                      deleteModalRef: deleteDialogRef,
                      deleteDialogCallback,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_65845f35d7d69c3ab4793dac')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={() => {
                    deleteDialogRef.current?.openDialog({
                      provider: netsuiteV2Integration,
                      callback: deleteDialogCallback,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_65845f35d7d69c3ab4793dad')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      {netsuiteV2Integration && (
        <IntegrationsPage.Header
          isLoading={loading}
          integrationLogo={<Netsuite />}
          integrationName={netsuiteV2Integration?.name}
          integrationChip={translate('text_62b1edddbf5f461ab971270d')}
          integrationDescription={`${translate('text_1766068213462z5ia1fxaveh')} • ${translate('text_661ff6e56ef7e1b7c542b245')}`}
        />
      )}

      {netsuiteV2Integration && (
        <NavigationTab
          className="px-4 md:px-12"
          loading={loading}
          tabs={[
            {
              title: translate('text_62728ff857d47b013204c726'),
              link: generatePath(NETSUITE_V2_INTEGRATION_DETAILS_ROUTE, {
                integrationId,
                tab: NetsuiteV2IntegrationDetailsTabs.Settings,
                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
              }),
              component: <NetsuiteV2IntegrationSettings />,
            },
          ]}
        />
      )}
      <AddNetsuiteV2Dialog ref={addNetsuiteV2DialogRef} />
      <DeleteNetsuiteV2IntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default NetsuiteIntegrationDetails
