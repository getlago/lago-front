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
import {
  AddNetsuiteDialog,
  AddNetsuiteDialogRef,
} from '~/components/settings/integrations/AddNetsuiteDialog'
import {
  DeleteNetsuiteIntegrationDialog,
  DeleteNetsuiteIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteNetsuiteIntegrationDialog'
import NetsuiteIntegrationItemsList from '~/components/settings/integrations/NetsuiteIntegrationItemsList'
import NetsuiteIntegrationSettings from '~/components/settings/integrations/NetsuiteIntegrationSettings'
import {
  INTEGRATIONS_ROUTE,
  NETSUITE_INTEGRATION_DETAILS_ROUTE,
  NETSUITE_INTEGRATION_ROUTE,
} from '~/core/router'
import {
  DeleteNetsuiteIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  NetsuiteForCreateDialogDialogFragmentDoc,
  NetsuiteIntegrationDetailsFragment,
  NetsuiteIntegrationItemsFragmentDoc,
  useGetNetsuiteIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Netsuite from '~/public/images/netsuite.svg'
import { MenuPopper, PageHeader, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum NetsuiteIntegrationDetailsTabs {
  Settings = 'settings',
  Items = 'items',
}

gql`
  fragment NetsuiteIntegrationDetails on NetsuiteIntegration {
    id
    name
    ...DeleteNetsuiteIntegrationDialog
    ...NetsuiteForCreateDialogDialog
    ...NetsuiteIntegrationItems
  }

  query getNetsuiteIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on NetsuiteIntegration {
        id
        ...NetsuiteIntegrationDetails
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
  ${NetsuiteIntegrationItemsFragmentDoc}
`

const NetsuiteIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addNetsuiteDialogRef = useRef<AddNetsuiteDialogRef>(null)
  const deleteDialogRef = useRef<DeleteNetsuiteIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNetsuiteIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Netsuite,
    },
    skip: !integrationId,
  })
  const netsuiteIntegration = data?.integration as NetsuiteIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(NETSUITE_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={NETSUITE_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {netsuiteIntegration?.name}
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
                  addNetsuiteDialogRef.current?.openDialog({
                    provider: netsuiteIntegration,
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
                    provider: netsuiteIntegration,
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
            <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
            <div>
              <Skeleton variant="text" width={200} marginBottom="22px" />
              <Skeleton variant="text" width={128} />
            </div>
          </>
        ) : (
          <>
            <Avatar className="mr-4" variant="connector-full" size="large">
              <Netsuite />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">{netsuiteIntegration?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_661ff6e56ef7e1b7c542b239')}&nbsp;•&nbsp;
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
            link: generatePath(NETSUITE_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: NetsuiteIntegrationDetailsTabs.Settings,
            }),
            component: <NetsuiteIntegrationSettings />,
          },
          {
            title: translate('text_661ff6e56ef7e1b7c542b200'),
            link: generatePath(NETSUITE_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: NetsuiteIntegrationDetailsTabs.Items,
            }),
            component: <NetsuiteIntegrationItemsList integrationId={netsuiteIntegration?.id} />,
          },
        ]}
      />
      <AddNetsuiteDialog ref={addNetsuiteDialogRef} />
      <DeleteNetsuiteIntegrationDialog ref={deleteDialogRef} />
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

export default NetsuiteIntegrationDetails
