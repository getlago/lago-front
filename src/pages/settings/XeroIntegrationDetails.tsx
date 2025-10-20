import { gql } from '@apollo/client'
import Nango from '@nangohq/frontend'
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
import { AddXeroDialog, AddXeroDialogRef } from '~/components/settings/integrations/AddXeroDialog'
import {
  DeleteXeroIntegrationDialog,
  DeleteXeroIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteXeroIntegrationDialog'
import XeroIntegrationItemsList from '~/components/settings/integrations/XeroIntegrationItemsList'
import XeroIntegrationSettings from '~/components/settings/integrations/XeroIntegrationSettings'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  INTEGRATIONS_ROUTE,
  XERO_INTEGRATION_DETAILS_ROUTE,
  XERO_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteXeroIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetXeroIntegrationsDetailsQuery,
  XeroForCreateDialogDialogFragmentDoc,
  XeroIntegrationDetailsFragment,
  XeroIntegrationItemsFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Xero from '~/public/images/xero.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum XeroIntegrationDetailsTabs {
  Settings = 'settings',
  Items = 'items',
}

gql`
  fragment XeroIntegrationDetails on XeroIntegration {
    id
    name
    connectionId
    ...DeleteXeroIntegrationDialog
    ...XeroForCreateDialogDialog
    ...XeroIntegrationItems
  }

  query getXeroIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on XeroIntegration {
        id
        ...XeroIntegrationDetails
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on XeroIntegration {
          id
        }
      }
    }
  }

  ${DeleteXeroIntegrationDialogFragmentDoc}
  ${XeroForCreateDialogDialogFragmentDoc}
  ${XeroIntegrationItemsFragmentDoc}
`

const XeroIntegrationDetails = () => {
  const navigate = useNavigate()
  const { nangoPublicKey } = envGlobalVar()
  const { integrationId = '' } = useParams()
  const addXeroDialogRef = useRef<AddXeroDialogRef>(null)
  const deleteDialogRef = useRef<DeleteXeroIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetXeroIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Xero],
    },
    skip: !integrationId,
  })
  const xeroIntegration = data?.integration as XeroIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(
        generatePath(XERO_INTEGRATION_ROUTE, {
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
            to={generatePath(XERO_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {xeroIntegration?.name}
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
                  addXeroDialogRef.current?.openDialog({
                    provider: xeroIntegration,
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
                onClick={async () => {
                  const nango = new Nango({ publicKey: nangoPublicKey })

                  try {
                    await nango.auth('xero', xeroIntegration?.connectionId)

                    addToast({
                      message: translate('text_174677760992972pm9p2l5on'),
                      severity: 'success',
                    })
                  } catch {
                    addToast({
                      message: translate('text_62b31e1f6a5b8b1b745ece48'),
                      severity: 'danger',
                    })
                  } finally {
                    closePopper()
                  }
                }}
              >
                {translate('text_62b31e1f6a5b8b1b745ece41')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                fullWidth
                onClick={() => {
                  deleteDialogRef.current?.openDialog({
                    provider: xeroIntegration,
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
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Xero />}
        integrationName={xeroIntegration?.name}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={`${translate('text_6672ebb8b1b50be550eccaf8')} • ${translate('text_661ff6e56ef7e1b7c542b245')}`}
      />

      <NavigationTab
        className="px-4 md:px-12"
        loading={loading}
        tabs={[
          {
            title: translate('text_62728ff857d47b013204c726'),
            link: generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: XeroIntegrationDetailsTabs.Settings,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
            component: <XeroIntegrationSettings />,
          },
          {
            title: translate('text_661ff6e56ef7e1b7c542b200'),
            link: generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: XeroIntegrationDetailsTabs.Items,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
            component: <XeroIntegrationItemsList integrationId={xeroIntegration?.id} />,
          },
        ]}
      />
      <AddXeroDialog ref={addXeroDialogRef} />
      <DeleteXeroIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default XeroIntegrationDetails
