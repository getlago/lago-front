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
  AddAnrokDialog,
  AddAnrokDialogRef,
} from '~/components/settings/integrations/AddAnrokDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import AnrokIntegrationItemsList from '~/components/settings/integrations/AnrokIntegrationItemsList'
import AnrokIntegrationSettings from '~/components/settings/integrations/AnrokIntegrationSettings'
import {
  DeleteAnrokIntegrationDialog,
  DeleteAnrokIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAnrokIntegrationDialog'
import {
  ANROK_INTEGRATION_DETAILS_ROUTE,
  ANROK_INTEGRATION_ROUTE,
  INTEGRATIONS_ROUTE,
} from '~/core/router'
import {
  AddAnrokIntegrationDialogFragmentDoc,
  AnrokIntegrationDetailsFragment,
  AnrokIntegrationItemsFragmentDoc,
  DeleteAnrokIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetAnrokIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Anrok from '~/public/images/anrok.svg'
import { MenuPopper, PageHeader, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum AnrokIntegrationDetailsTabs {
  Settings = 'settings',
  Items = 'items',
}

gql`
  fragment AnrokIntegrationDetails on AnrokIntegration {
    id
    name
    ...DeleteAnrokIntegrationDialog
    ...AddAnrokIntegrationDialog
    ...AnrokIntegrationItems
  }

  query getAnrokIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: IntegrationTypeEnum!
  ) {
    integration(id: $id) {
      ... on AnrokIntegration {
        id
        ...AnrokIntegrationDetails
      }
    }

    integrations(limit: $limit, type: $integrationsType) {
      collection {
        ... on AnrokIntegration {
          id
        }
      }
    }
  }

  ${DeleteAnrokIntegrationDialogFragmentDoc}
  ${AddAnrokIntegrationDialogFragmentDoc}
  ${AnrokIntegrationItemsFragmentDoc}
`

const AnrokIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addAnrokDialogRef = useRef<AddAnrokDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAnrokIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetAnrokIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: IntegrationTypeEnum.Anrok,
    },
    skip: !integrationId,
  })
  const anrokIntegration = data?.integration as AnrokIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if ((data?.integrations?.collection.length || 0) >= PROVIDER_CONNECTION_LIMIT) {
      navigate(ANROK_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={ANROK_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {anrokIntegration?.name}
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
                  addAnrokDialogRef.current?.openDialog({
                    integration: anrokIntegration,
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
                    provider: anrokIntegration,
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
              <Anrok />
            </Avatar>
            <div>
              <Line>
                <Typography variant="headline">{anrokIntegration?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_6668821d94e4da4dfd8b3834')}&nbsp;•&nbsp;
                {translate('text_6668821d94e4da4dfd8b3840')}
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
            link: generatePath(ANROK_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: AnrokIntegrationDetailsTabs.Settings,
            }),
            component: <AnrokIntegrationSettings />,
          },
          {
            title: translate('text_661ff6e56ef7e1b7c542b200'),
            link: generatePath(ANROK_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: AnrokIntegrationDetailsTabs.Items,
            }),
            component: <AnrokIntegrationItemsList integrationId={anrokIntegration?.id} />,
          },
        ]}
      />
      <AddAnrokDialog ref={addAnrokDialogRef} />
      <DeleteAnrokIntegrationDialog ref={deleteDialogRef} />
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

export default AnrokIntegrationDetails
