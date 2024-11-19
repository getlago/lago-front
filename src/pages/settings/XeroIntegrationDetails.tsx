import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
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
import { MenuPopper, PageHeader, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum XeroIntegrationDetailsTabs {
  Settings = 'settings',
  Items = 'items',
}

gql`
  fragment XeroIntegrationDetails on XeroIntegration {
    id
    name
    ...DeleteXeroIntegrationDialog
    ...XeroForCreateDialogDialog
    ...XeroIntegrationItems
  }

  query getXeroIntegrationsDetails($id: ID!, $limit: Int, $integrationsType: IntegrationTypeEnum!) {
    integration(id: $id) {
      ... on XeroIntegration {
        id
        ...XeroIntegrationDetails
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
  ${XeroIntegrationItemsFragmentDoc}
`

const XeroIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addXeroDialogRef = useRef<AddXeroDialogRef>(null)
  const deleteDialogRef = useRef<DeleteXeroIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetXeroIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Xero,
    },
    skip: !integrationId,
  })
  const xeroIntegration = data?.integration as XeroIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(XERO_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={XERO_INTEGRATION_ROUTE}
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
        </HeaderBlock>
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
      </PageHeader>
      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" className="mr-4" />
            <div>
              <Skeleton variant="text" className="mb-5 w-50" />
              <Skeleton variant="text" className="w-32" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Xero />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">{xeroIntegration?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_6672ebb8b1b50be550eccaf8')}&nbsp;•&nbsp;
                {translate('text_661ff6e56ef7e1b7c542b245')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>
      <NavigationTab
        className="px-4 md:px-12"
        loading={loading}
        tabs={[
          {
            title: translate('text_62728ff857d47b013204c726'),
            link: generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: XeroIntegrationDetailsTabs.Settings,
            }),
            component: <XeroIntegrationSettings />,
          },
          {
            title: translate('text_661ff6e56ef7e1b7c542b200'),
            link: generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: XeroIntegrationDetailsTabs.Items,
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

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)};
  }
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

export default XeroIntegrationDetails
