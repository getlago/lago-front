import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddQuickbooksDialog } from '~/components/settings/integrations/AddQuickbooksDialog'
import { useDeleteQuickbooksIntegrationDialog } from '~/components/settings/integrations/DeleteQuickbooksIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  INTEGRATIONS_ROUTE,
  QUICKBOOKS_INTEGRATION_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  DeleteQuickbooksIntegrationDialogFragmentDoc,
  GetQuickbooksIntegrationsListQuery,
  IntegrationTypeEnum,
  QuickbooksForCreateDialogFragmentDoc,
  useGetQuickbooksIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Quickbooks from '~/public/images/quickbooks.svg'
import { MenuPopper, PopperOpener } from '~/styles'

import { QuickbooksIntegrationDetailsTabs } from './QuickbooksIntegrationDetails'

gql`
  fragment QuickbooksIntegrations on QuickbooksIntegration {
    id
    name
    code
    ...QuickbooksForCreateDialog
  }

  query getQuickbooksIntegrationsList($limit: Int, $types: [IntegrationTypeEnum!]) {
    integrations(limit: $limit, types: $types) {
      collection {
        ... on QuickbooksIntegration {
          id
          ...QuickbooksIntegrations
          ...QuickbooksForCreateDialog
          ...DeleteQuickbooksIntegrationDialog
        }
      }
    }
  }

  ${QuickbooksForCreateDialogFragmentDoc}
  ${DeleteQuickbooksIntegrationDialogFragmentDoc}
`

type TIntegration = NonNullable<
  GetQuickbooksIntegrationsListQuery['integrations']
>['collection'][number]
type TQuickbooksConnection = Extract<TIntegration, { __typename?: 'QuickbooksIntegration' }>

const isQuickbooksConnection = (integration: TIntegration): integration is TQuickbooksConnection =>
  integration.__typename === 'QuickbooksIntegration'

const QuickbooksIntegrations = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { openAddQuickbooksDialog } = useAddQuickbooksDialog()
  const { openDeleteQuickbooksIntegrationDialog } = useDeleteQuickbooksIntegrationDialog()
  const { data, loading } = useGetQuickbooksIntegrationsListQuery({
    variables: { limit: 1000, types: [IntegrationTypeEnum.Quickbooks] },
  })
  const isFirstLoad = loading && !data
  const connections = data?.integrations?.collection.filter(isQuickbooksConnection)
  const deleteDialogCallback =
    connections && connections?.length === 1
      ? () =>
          navigate(
            generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          )
      : undefined

  const openDeleteDialog = (provider: TQuickbooksConnection) => {
    openDeleteQuickbooksIntegrationDialog({
      provider,
      callback: deleteDialogCallback,
    })
  }

  const getRowActions = (connection: TQuickbooksConnection) =>
    [
      {
        icon: 'pen',
        labelKey: 'text_65845f35d7d69c3ab4793dac',
        onClick: () => openAddQuickbooksDialog({ provider: connection, deleteDialogCallback }),
      },
      {
        icon: 'trash',
        labelKey: 'text_645d071272418a14c1c76a81',
        onClick: () => openDeleteDialog(connection),
      },
    ] as const

  const renderRowMenuOpener = ({ isOpen }: { isOpen: boolean }) => (
    <PopperOpener className="right-0 md:right-0">
      <Tooltip
        placement="top-end"
        disableHoverListener={isOpen}
        title={translate('text_626162c62f790600f850b7b6')}
      >
        <Button icon="dots-horizontal" variant="quaternary" data-test="plan-item-options" />
      </Tooltip>
    </PopperOpener>
  )

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
        ]}
        entity={{
          viewName: translate('text_179543424168937zditnx1d9'),
          viewNameLoading: isFirstLoad,
          metadata: translate('text_1795434241689stydxtzzm1w'),
          metadataLoading: isFirstLoad,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <Quickbooks />,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_65846763e6140b469140e235'),
              variant: 'primary',
              onClick: () => {
                openAddQuickbooksDialog()
              },
            },
          ],
          loading: isFirstLoad,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {isFirstLoad &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!isFirstLoad &&
            connections?.map((connection) => {
              return (
                <IntegrationsPage.ListItem
                  key={connection.id}
                  to={generatePath(QUICKBOOKS_INTEGRATION_DETAILS_ROUTE, {
                    integrationId: connection.id,
                    tab: QuickbooksIntegrationDetailsTabs.Settings,
                    integrationGroup: IntegrationsTabsOptionsEnum.Lago,
                  })}
                  label={connection.name}
                  subLabel={connection.code}
                >
                  <Popper PopperProps={{ placement: 'bottom-end' }} opener={renderRowMenuOpener}>
                    {({ closePopper }) => (
                      <MenuPopper>
                        {getRowActions(connection).map(({ icon, labelKey, onClick }) => (
                          <Button
                            key={icon}
                            startIcon={icon}
                            variant="quaternary"
                            align="left"
                            onClick={() => {
                              onClick()
                              closePopper()
                            }}
                          >
                            {translate(labelKey)}
                          </Button>
                        ))}
                      </MenuPopper>
                    )}
                  </Popper>
                </IntegrationsPage.ListItem>
              )
            })}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}

export default QuickbooksIntegrations
