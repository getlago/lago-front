import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import {
  MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT,
  ShowMoreText,
} from '~/components/designSystem/ShowMoreText'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  CatalogPlanForCatalogPlanDrawerFragmentDoc,
  LagoApiError,
  useGetCatalogPlanForDetailsOverviewQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useCatalogPlanDrawer } from '../drawers/catalogPlan/useCatalogPlanDrawer'

export const CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID = 'catalog-plan-overview-edit'
export const CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID = 'catalog-plan-quick-action-rate-cards'

gql`
  fragment CatalogPlanForCatalogPlanDetailsOverview on CatalogPlan {
    id
    name
    code
    currency
    description
    invoiceDisplayName
    appliedRateCardsCount
    ...CatalogPlanForCatalogPlanDrawer
  }

  query getCatalogPlanForDetailsOverview($id: ID!) {
    catalogPlan(id: $id) {
      id
      ...CatalogPlanForCatalogPlanDetailsOverview
    }
  }

  ${CatalogPlanForCatalogPlanDrawerFragmentDoc}
`

export const CatalogPlanOverviewSection = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditCatalogPlanDrawer } = useCatalogPlanDrawer()
  const { catalogPlanId = '' } = useParams()

  const { data, loading } = useGetCatalogPlanForDetailsOverviewQuery({
    variables: { id: catalogPlanId },
    skip: !catalogPlanId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
  const catalogPlan = data?.catalogPlan

  if (!catalogPlan && loading) {
    return <DetailsPage.Skeleton />
  }

  const hasNoRateCard = catalogPlan?.appliedRateCardsCount === 0

  return (
    <div className="flex flex-col gap-12">
      <section>
        {hasPermissions(['plansUpdate']) && (
          <PageSectionTitle
            title={translate('text_628cf761cbe6820138b8f2e4')}
            subtitle={translate('text_17890300495297g290y7et77')}
            action={{
              title: translate('text_1789030049528hmelti5lsxj'),
              dataTest: CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID,
              onClick: () => catalogPlan && openEditCatalogPlanDrawer(catalogPlan),
            }}
          />
        )}

        <div className="flex flex-col gap-4">
          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_62442e40cea25600b0b6d852'),
                value: catalogPlan?.name || '-',
              },
              {
                label: translate('text_642d5eb2783a2ad10d670320'),
                value: catalogPlan?.code ? (
                  <TypographyWithCopy variant="body" color="grey700">
                    {catalogPlan.code}
                  </TypographyWithCopy>
                ) : (
                  '-'
                ),
              },
            ]}
          />

          {!!catalogPlan?.description && (
            <DetailsPage.InfoGridItem
              className="col-span-2"
              label={translate('text_6388b923e514213fed58331c')}
              value={
                <ShowMoreText
                  variant="body"
                  color="grey700"
                  text={catalogPlan.description}
                  limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT}
                />
              }
            />
          )}

          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_632b4acf0c41206cbcb8c324'),
                value: catalogPlan?.currency || '-',
              },
              !!catalogPlan?.invoiceDisplayName && {
                label: translate('text_65018c8e5c6b626f030bcf26'),
                value: catalogPlan.invoiceDisplayName,
              },
            ]}
          />
        </div>
      </section>

      {hasNoRateCard && (
        <section>
          <PageSectionTitle title={translate('text_17890300495307orirxcvgn8')} />

          <Selector
            icon="book"
            title={translate('text_1789030049530umr4s4zqygs')}
            data-test={CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID}
            endContent={<Button icon="plus" variant="quaternary" />}
          />
        </section>
      )}
    </div>
  )
}
