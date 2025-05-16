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
  AddAvalaraDialog,
  AddAvalaraDialogRef,
} from '~/components/settings/integrations/AddAvalaraDialog'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import AvalaraIntegrationItemsList from '~/components/settings/integrations/AvalaraIntegrationItemsList'
import AvalaraIntegrationSettings from '~/components/settings/integrations/AvalaraIntegrationSettings'
import {
  DeleteAvalaraIntegrationDialog,
  DeleteAvalaraIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteAvalaraIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  AVALARA_INTEGRATION_DETAILS_ROUTE,
  AVALARA_INTEGRATION_ROUTE,
  INTEGRATIONS_ROUTE,
} from '~/core/router'
import {
  AddAvalaraIntegrationDialogFragmentDoc,
  AvalaraIntegrationDetailsFragment,
  DeleteAvalaraIntegrationDialogFragmentDoc,
  IntegrationTypeEnum,
  useGetAvalaraIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Avalara from '~/public/images/avalara.svg'
import { MenuPopper, PageHeader } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

export enum AvalaraIntegrationDetailsTabs {
  Settings = 'settings',
  Items = 'items',
}

gql`
  fragment AvalaraIntegrationDetails on AvalaraIntegration {
    id
    name
    ...DeleteAvalaraIntegrationDialog
    ...AddAvalaraIntegrationDialog
  }

  query getAvalaraIntegrationsDetails(
    $id: ID!
    $limit: Int
    $integrationsType: [IntegrationTypeEnum!]
  ) {
    integration(id: $id) {
      ... on AvalaraIntegration {
        id
        ...AvalaraIntegrationDetails
      }
    }

    integrations(limit: $limit, types: $integrationsType) {
      collection {
        ... on AvalaraIntegration {
          id
        }
      }
    }
  }

  ${DeleteAvalaraIntegrationDialogFragmentDoc}
  ${AddAvalaraIntegrationDialogFragmentDoc}
`

const AvalaraIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId = '' } = useParams()
  const addAvalaraDialogRef = useRef<AddAvalaraDialogRef>(null)
  const deleteDialogRef = useRef<DeleteAvalaraIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetAvalaraIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      integrationsType: [IntegrationTypeEnum.Avalara],
    },
    skip: !integrationId,
  })
  const avalaraIntegration = data?.integration as AvalaraIntegrationDetailsFragment
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
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            to={generatePath(AVALARA_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {avalaraIntegration?.name}
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
                  addAvalaraDialogRef.current?.openDialog({
                    integration: avalaraIntegration,
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
                    provider: avalaraIntegration,
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
        integrationLogo={<Avalara />}
        integrationName={avalaraIntegration?.name}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={`${translate('text_1744293609277s53zn6jcoq4')} • ${translate('text_6668821d94e4da4dfd8b3840')}`}
      />

      <NavigationTab
        className="px-4 md:px-12"
        loading={loading}
        tabs={[
          {
            title: translate('text_62728ff857d47b013204c726'),
            link: generatePath(AVALARA_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: AvalaraIntegrationDetailsTabs.Settings,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
            component: <AvalaraIntegrationSettings />,
          },
          {
            title: translate('text_661ff6e56ef7e1b7c542b200'),
            link: generatePath(AVALARA_INTEGRATION_DETAILS_ROUTE, {
              integrationId,
              tab: AvalaraIntegrationDetailsTabs.Items,
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
            component: <AvalaraIntegrationItemsList integrationId={avalaraIntegration?.id} />,
          },
        ]}
      />
      <AddAvalaraDialog ref={addAvalaraDialogRef} />
      <DeleteAvalaraIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

export default AvalaraIntegrationDetails
