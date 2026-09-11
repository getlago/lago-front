import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { CatalogPlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE, PLAN_PRICING_ROUTE, useNavigate } from '~/core/router'
import {
  CatalogPlanForCatalogPlanDrawerFragmentDoc,
  CatalogPlanForDeleteCatalogPlanDialogFragmentDoc,
  LagoApiError,
  useGetCatalogPlanForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import CatalogPlanActivityLogs from './CatalogPlanActivityLogs'
import { CatalogPlanContracts } from './CatalogPlanContracts'
import { CatalogPlanDetailsOverview } from './CatalogPlanDetailsOverview'

import { useCatalogPlanTableActions } from '../useCatalogPlanTableActions'

gql`
  fragment CatalogPlanForCatalogPlanDetails on CatalogPlan {
    id
    name
    code
    currency
    description
    invoiceDisplayName
    appliedRateCardsCount
    attachedToContracts
    ...CatalogPlanForCatalogPlanDrawer
    ...CatalogPlanForDeleteCatalogPlanDialog
  }

  query getCatalogPlanForDetails($id: ID!) {
    catalogPlan(id: $id) {
      id
      ...CatalogPlanForCatalogPlanDetails
    }
  }

  ${CatalogPlanForCatalogPlanDrawerFragmentDoc}
  ${CatalogPlanForDeleteCatalogPlanDialogFragmentDoc}
`

const CatalogPlanDetails = (): JSX.Element => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { catalogPlanId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { buildActionItems } = useCatalogPlanTableActions()

  const { data, loading, error } = useGetCatalogPlanForDetailsQuery({
    variables: { id: catalogPlanId as string },
    skip: !catalogPlanId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PLAN_PRICING_ROUTE,
    translateKey: 'text_1789030049530nlr5nqu149i',
  })

  const catalogPlan = data?.catalogPlan

  const buildTabLink = (tab: CatalogPlanDetailsTabsOptionsEnum): string =>
    generatePath(CATALOG_PLAN_DETAILS_ROUTE, { catalogPlanId: catalogPlanId as string, tab })

  const overviewLink = buildTabLink(CatalogPlanDetailsTabsOptionsEnum.overview)

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: 'catalog-plan-details-actions',
      items: catalogPlan
        ? buildActionItems(catalogPlan, {
            onDeleted: () => navigate(PLAN_PRICING_ROUTE),
          }).map((item) => ({
            label: item.title,
            disabled: item.disabled,
            tooltip: item.tooltip,
            onClick: (closePopper: () => void) => {
              item.onAction(catalogPlan)
              closePopper()
            },
          }))
        : [],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        // Snapshot strips functions and tab content, so encode every mutable field the
        // closures/panes use but the header doesn't render, including the two lock-driving fields.
        snapshotKey={`${catalogPlan?.code}|${catalogPlan?.description}|${catalogPlan?.invoiceDisplayName}|${catalogPlan?.currency}|${catalogPlan?.appliedRateCardsCount}|${catalogPlan?.attachedToContracts}`}
        breadcrumb={[
          { label: translate('text_62442e40cea25600b0b6d85a'), path: PLAN_PRICING_ROUTE },
          { label: translate('text_1789030049530nkyhqgwxpkt') },
        ]}
        entity={{
          viewName: catalogPlan?.name || '',
          viewNameLoading: loading,
          metadata: catalogPlan?.code ? (
            <TypographyWithCopy variant="body">{catalogPlan.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: overviewLink,
            // matchPath is exact, so the nested section URL needs its own entry; suffixing
            // states that directly rather than passing a literal ':section' as a param value.
            match: [overviewLink, `${overviewLink}/:section`],
            content: (
              <DetailsPage.Container className="pt-6">
                <CatalogPlanDetailsOverview
                  rateCardsCount={catalogPlan?.appliedRateCardsCount}
                  loading={loading}
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_17891318128636r6g9igqqeq'),
            link: buildTabLink(CatalogPlanDetailsTabsOptionsEnum.contracts),
            content: (
              <DetailsPage.Container className="pt-6">
                <CatalogPlanContracts planCode={catalogPlan?.code} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: buildTabLink(CatalogPlanDetailsTabsOptionsEnum.activityLogs),
            content: (
              <DetailsPage.Container className="pt-6">
                <CatalogPlanActivityLogs catalogPlanId={catalogPlanId} />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default CatalogPlanDetails
