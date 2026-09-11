import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { PageSectionTitle } from '~/components/layouts/Section'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CATALOG_PLAN_ADD_RATE_CARD_TEST_ID = 'catalog-plan-add-rate-card'

// `planAppliedRateCards` and `createPlanAppliedRateCard` exist and are catalog-plan scoped,
// but neither has a design yet, so the list and attach flow stay unbuilt here.
export const CatalogPlanRateCardsSection = (): JSX.Element => {
  const { translate } = useInternationalization()

  const placeholder: TablePlaceholder = {
    emptyState: {
      title: translate('text_1789030049529u2gzzho6x8x'),
      subtitle: translate('text_17891323549937b5qwry7pn1'),
    },
  }

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

      <Table
        name="catalog-plan-rate-cards"
        data={[]}
        columns={[]}
        containerSize={0}
        rowSize={72}
        placeholder={placeholder}
      />
    </section>
  )
}
