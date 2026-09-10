import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CATALOG_PLAN_RATE_CARDS_EMPTY_TEST_ID = 'catalog-plan-rate-cards-empty'
export const CATALOG_PLAN_ADD_RATE_CARD_TEST_ID = 'catalog-plan-add-rate-card'

// `planAppliedRateCards` and `createPlanAppliedRateCard` exist and are catalog-plan scoped,
// but neither has a design yet, so the list and attach flow stay unbuilt here.
export const CatalogPlanRateCardsSection = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <section>
      <PageSectionTitle
        title={translate('text_1783104239825nxqno33u945')}
        subtitle={translate('text_1789030049529jp760bke0x8')}
        action={{
          title: translate('text_1789030049529b0zmy1slfxl'),
          dataTest: CATALOG_PLAN_ADD_RATE_CARD_TEST_ID,
          onClick: () => undefined,
        }}
      />

      <div
        className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-grey-300 p-6 text-center"
        data-test={CATALOG_PLAN_RATE_CARDS_EMPTY_TEST_ID}
      >
        <Typography variant="body" color="grey600">
          {translate('text_1789030049529u2gzzho6x8x')}
        </Typography>
      </div>
    </section>
  )
}
