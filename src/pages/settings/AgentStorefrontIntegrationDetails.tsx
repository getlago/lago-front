import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { Table } from '~/components/designSystem/Table/Table'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useAddAgentStorefrontDialog } from '~/components/settings/integrations/agentStorefront/AddAgentStorefrontDialog'
import { useDeleteAgentStorefrontIntegrationDialog } from '~/components/settings/integrations/agentStorefront/DeleteAgentStorefrontIntegrationDialog'
import { useSellPlanToAgentsDialog } from '~/components/settings/integrations/agentStorefront/SellPlanToAgentsDialog'
import { useStopSellingPlanDialog } from '~/components/settings/integrations/agentStorefront/StopSellingPlanDialog'
import {
  formatFreeCredits,
  formatTopupRange,
} from '~/components/settings/integrations/agentStorefront/utils'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { AGENT_STOREFRONT_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE, useNavigate } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  AgentStorefrontSoldPlansFragmentDoc,
  EditAgentStorefrontIntegrationFragmentDoc,
  useGetAgentStorefrontIntegrationDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import AgentStorefront from '~/public/images/agentic-storefront.svg'

gql`
  fragment AgentStorefrontIntegrationDetails on AgentStorefrontIntegration {
    id
    name
    code
    paymentProviderCode
    paymentProvider {
      id
      name
    }
    resourceEndpoint
    resourceInstructions
    agentUrl
    authDocumentUrl
    billingDocumentUrl
    claimUrl
    ...AgentStorefrontSoldPlans
    ...EditAgentStorefrontIntegration
  }

  query getAgentStorefrontIntegrationDetails($id: ID!) {
    integration(id: $id) {
      ... on AgentStorefrontIntegration {
        id
        ...AgentStorefrontIntegrationDetails
      }
    }
  }

  ${AgentStorefrontSoldPlansFragmentDoc}
  ${EditAgentStorefrontIntegrationFragmentDoc}
`

export const AGENT_ACCESS_COPY_TEST_ID = 'agent-access-copy'
export const AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID = 'agent-storefront-edit-connection'
export const AGENT_STOREFRONT_SELL_PLAN_TEST_ID = 'agent-storefront-sell-plan'
export const AGENT_STOREFRONT_ACTIONS_TEST_ID = 'agent-storefront-actions'
export const AGENT_STOREFRONT_ACTIONS_EDIT_TEST_ID = 'agent-storefront-actions-edit'
export const AGENT_STOREFRONT_ACTIONS_DELETE_TEST_ID = 'agent-storefront-actions-delete'
export const AGENT_STOREFRONT_PLAN_EDIT_TEST_ID = 'agent-storefront-plan-edit'
export const AGENT_STOREFRONT_PLAN_STOP_SELLING_TEST_ID = 'agent-storefront-plan-stop-selling'

type AgentAccessRow = {
  id: 'agentUrl' | 'authDocumentUrl' | 'billingDocumentUrl' | 'claimUrl'
  labelKey: string
  tooltipKey: string
  toastKey: string
  url: string
}

const AgentStorefrontIntegrationDetails = (): JSX.Element => {
  const { integrationId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { openEditAgentStorefrontDialog } = useAddAgentStorefrontDialog()
  const { openDeleteAgentStorefrontIntegrationDialog } = useDeleteAgentStorefrontIntegrationDialog()
  const { openSellPlanDialog, openEditPlanDialog } = useSellPlanToAgentsDialog(integrationId)
  const { openStopSellingPlanDialog } = useStopSellingPlanDialog(integrationId)

  const { data, loading } = useGetAgentStorefrontIntegrationDetailsQuery({
    variables: { id: integrationId },
    skip: !integrationId,
  })

  const isFirstLoad = loading && !data
  const integration =
    data?.integration?.__typename === 'AgentStorefrontIntegration' ? data.integration : undefined
  const storefrontName = translate('text_1795083825203aqsrrdi5tii')

  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])
  const canSellPlan = canEditIntegration && hasPermissions(['plansView'])

  const deleteCallback = (): void => {
    navigate(
      generatePath(AGENT_STOREFRONT_INTEGRATION_ROUTE, {
        integrationGroup: IntegrationsTabsOptionsEnum.Lago,
      }),
    )
  }

  const openEditConnection = (): void => {
    if (!integration) return

    openEditAgentStorefrontDialog({ integration, deleteCallback })
  }

  const openSellPlan = (): void => {
    if (!integration) return

    openSellPlanDialog(integration.plans.map(({ planCode }) => planCode))
  }

  const renderContent = (): JSX.Element | null => {
    if (isFirstLoad) {
      return (
        <section>
          {[0, 1, 2].map((i) => (
            <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
          ))}
        </section>
      )
    }

    if (!integration) return null

    const agentAccessRows: AgentAccessRow[] = [
      {
        id: 'agentUrl',
        labelKey: 'text_1795087403334b8usf6gcb18',
        tooltipKey: 'text_17950874033352ze5rtfx7ed',
        toastKey: 'text_179508740333403t8vdbyvps',
        url: integration.agentUrl,
      },
      {
        id: 'authDocumentUrl',
        labelKey: 'text_1795087403334blg2clntwnm',
        tooltipKey: 'text_1795087403335rbnr2dofcl0',
        toastKey: 'text_1795087403334k7xo9p5ayfj',
        url: integration.authDocumentUrl,
      },
      {
        id: 'billingDocumentUrl',
        labelKey: 'text_1795087403334lu41jqtz7ra',
        tooltipKey: 'text_17950874033359ibq4ch0tyk',
        toastKey: 'text_1795087403334wlspymdjfg1',
        url: integration.billingDocumentUrl,
      },
      {
        id: 'claimUrl',
        labelKey: 'text_17950874033346iluwrfk3z2',
        tooltipKey: 'text_1795087403335l8t74g8d0uy',
        toastKey: 'text_1795087403334sxp4owcefg5',
        url: integration.claimUrl,
      },
    ]

    const soldPlans = integration.plans.map((sold) => ({ ...sold, id: sold.planCode }))

    return (
      <>
        <section>
          <IntegrationsPage.Headline label={translate('text_664c732c264d7eed1c74fdc5')}>
            {canEditIntegration && (
              <Button
                variant="inline"
                data-test={AGENT_STOREFRONT_EDIT_CONNECTION_TEST_ID}
                onClick={openEditConnection}
              >
                {translate('text_62b1edddbf5f461ab9712787')}
              </Button>
            )}
          </IntegrationsPage.Headline>
          <IntegrationsPage.DetailsItem
            icon="text"
            label={translate('text_6419c64eace749372fc72b0f')}
            value={integration.name}
          />
          <IntegrationsPage.DetailsItem
            icon="id"
            label={translate('text_62876e85e32e0300e1803127')}
            value={integration.code}
          />
          <IntegrationsPage.DetailsItem
            icon="bank"
            label={translate('text_1789557972392jhb3cywzp35')}
            value={integration.paymentProvider?.name ?? integration.paymentProviderCode}
          />
          {!!integration.resourceEndpoint && (
            <IntegrationsPage.DetailsItem
              icon="link"
              label={translate('text_1749819996843c2c5f1j8e0n')}
              value={integration.resourceEndpoint}
            />
          )}
          {!!integration.resourceInstructions && (
            <IntegrationsPage.DetailsItem
              icon="link"
              label={translate('text_17950874033333vlgz9y5w1x')}
              value={integration.resourceInstructions}
            />
          )}
        </section>

        <section>
          <IntegrationsPage.Headline label={translate('text_179508740333464utmmbw00r')} />
          <Table
            name="agent-storefront-agent-access"
            containerSize={0}
            rowSize={72}
            data={agentAccessRows}
            columns={[
              {
                key: 'url',
                title: translate('text_1795087403334v09qxm7w3ze'),
                maxSpace: true,
                content: ({ labelKey, url }) => (
                  <div className="flex flex-col items-start">
                    <Typography variant="body" color="grey700">
                      {translate(labelKey)}
                    </Typography>
                    <ButtonLink
                      type="button"
                      external
                      to={url}
                      buttonProps={{ variant: 'inline', size: 'small' }}
                    >
                      {url}
                    </ButtonLink>
                  </div>
                ),
              },
            ]}
            actionColumn={({ id, url, tooltipKey, toastKey }) => (
              <Tooltip title={translate(tooltipKey)} placement="top-end">
                <Button
                  icon="duplicate"
                  variant="quaternary"
                  data-test={`${AGENT_ACCESS_COPY_TEST_ID}-${id}`}
                  onClick={() => {
                    copyToClipboard(url)
                    addToast({ severity: 'info', translateKey: toastKey })
                  }}
                />
              </Tooltip>
            )}
          />
        </section>

        <section>
          <IntegrationsPage.Headline label={translate('text_17950874033342k6s49m679r')}>
            {canSellPlan && (
              <Button
                variant="inline"
                data-test={AGENT_STOREFRONT_SELL_PLAN_TEST_ID}
                onClick={openSellPlan}
              >
                {translate('text_1795096449972ph15gro1av3')}
              </Button>
            )}
          </IntegrationsPage.Headline>
          <Table
            name="agent-storefront-plans"
            containerSize={0}
            rowSize={72}
            data={soldPlans}
            placeholder={{
              emptyState: {
                title: translate('text_1795087403334adylfmop61u'),
                subtitle: translate('text_1795087403334jwb61f37pou'),
                ...(canSellPlan && {
                  buttonTitle: translate('text_1795096449972ph15gro1av3'),
                  buttonAction: openSellPlan,
                }),
              },
            }}
            actionColumnTooltip={() => translate('text_1795096449972fw5x6253azm')}
            actionColumn={(sold) => {
              if (!canEditIntegration) return null

              const { plan } = sold

              return [
                plan
                  ? {
                      startIcon: 'pen',
                      title: translate('text_1789030049528hmelti5lsxj'),
                      dataTest: AGENT_STOREFRONT_PLAN_EDIT_TEST_ID,
                      onAction: () => openEditPlanDialog({ ...sold, plan }),
                    }
                  : null,
                {
                  startIcon: 'trash',
                  title: translate('text_1795096449973pi06nk2ocoy'),
                  dataTest: AGENT_STOREFRONT_PLAN_STOP_SELLING_TEST_ID,
                  onAction: () => openStopSellingPlanDialog(sold),
                },
              ]
            }}
            columns={[
              {
                key: 'planCode',
                title: translate('text_6419c64eace749372fc72b0f'),
                maxSpace: true,
                content: ({ plan, planCode }) => (
                  <div className="flex flex-col">
                    <Typography variant="body" color="grey700">
                      {plan?.name ?? planCode}
                    </Typography>
                    {!!plan && (
                      <Typography variant="caption" color="grey600">
                        {plan.code}
                      </Typography>
                    )}
                  </div>
                ),
              },
              {
                key: 'minimumTopupCents',
                title: translate('text_1795087403334r6bywx08c3t'),
                textAlign: 'right',
                content: (sold) => formatTopupRange(sold),
              },
              {
                key: 'freeCreditsCents',
                title: translate('text_1784883525803ne7j9k70cy2'),
                textAlign: 'right',
                content: (sold) => formatFreeCredits(sold),
              },
            ]}
          />
        </section>
      </>
    )
  }

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
          {
            label: storefrontName,
            path: generatePath(AGENT_STOREFRONT_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            }),
          },
        ]}
        entity={{
          viewName: integration?.name ?? '',
          viewNameLoading: isFirstLoad,
          metadata: `${storefrontName} • ${translate('text_1795083825204u0cvlpt2mav')}`,
          metadataLoading: isFirstLoad,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <AgentStorefront />,
        }}
        snapshotKey={JSON.stringify(integration ?? null)}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              dataTest: AGENT_STOREFRONT_ACTIONS_TEST_ID,
              items: [
                {
                  label: translate('text_65845f35d7d69c3ab4793dac'),
                  hidden: !canEditIntegration,
                  dataTest: AGENT_STOREFRONT_ACTIONS_EDIT_TEST_ID,
                  onClick: (closePopper) => {
                    openEditConnection()
                    closePopper()
                  },
                },
                {
                  label: translate('text_645d071272418a14c1c76a81'),
                  hidden: !canDeleteIntegration,
                  dataTest: AGENT_STOREFRONT_ACTIONS_DELETE_TEST_ID,
                  onClick: (closePopper) => {
                    if (integration) {
                      openDeleteAgentStorefrontIntegrationDialog({
                        integration,
                        callback: deleteCallback,
                      })
                    }
                    closePopper()
                  },
                },
              ],
            },
          ],
          loading: isFirstLoad,
        }}
      />

      <IntegrationsPage.Container>{renderContent()}</IntegrationsPage.Container>
    </>
  )
}

export default AgentStorefrontIntegrationDetails
