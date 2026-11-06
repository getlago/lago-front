import { NavigationTab, TabManagedBy } from '~/components/designSystem/NavigationTab'
import { Filters } from '~/components/Filters'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { SearchInput } from '~/components/SearchInput'
import { INVOICE_PRODUCT_FEES_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceProductCatalogTab } from './invoiceProductCatalogTabs'
import { buildInvoiceProductFeesDynamicFilters } from './invoiceProductFeesFilters'
import { InvoiceProductCatalogSectionItem } from './useInvoiceProductFees'

export const INVOICE_PRODUCT_CATALOG_TABS_TEST_ID = 'invoice-product-catalog-tabs'
export const INVOICE_PRODUCT_CATALOG_SEARCH_INPUT_TEST_ID = 'invoice-product-catalog-search-input'

export const InvoiceProductCatalogToolbar = ({
  tabs,
  section,
  onSelectSection,
  onSearchChange,
}: {
  tabs: InvoiceProductCatalogTab[]
  section: InvoiceProductCatalogSectionItem
  onSelectSection: (key: string) => void
  onSearchChange: (value: string) => void
}): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-4">
      {tabs.length > 1 && (
        <div data-test={INVOICE_PRODUCT_CATALOG_TABS_TEST_ID}>
          <NavigationTab
            managedBy={TabManagedBy.INDEX}
            currentTab={tabs.findIndex(({ key }) => key === section.key)}
            onChange={(index) => onSelectSection(tabs[index].key)}
            tabs={tabs.map(({ key, label }) => ({
              title: label,
              dataTest: `${INVOICE_PRODUCT_CATALOG_TABS_TEST_ID}-${key}`,
            }))}
          />
        </div>
      )}

      <Filters.Provider
        filtersNamePrefix={INVOICE_PRODUCT_FEES_FILTER_PREFIX}
        availableFilters={[AvailableFiltersEnum.appliedRateCardProductType]}
        dynamicFilters={buildInvoiceProductFeesDynamicFilters({ section, translate })}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            onChange={onSearchChange}
            placeholder={translate('text_179395714258761jqheadwll')}
            data-test={INVOICE_PRODUCT_CATALOG_SEARCH_INPUT_TEST_ID}
          />
          <Filters.Component />
        </div>
      </Filters.Provider>
    </div>
  )
}
