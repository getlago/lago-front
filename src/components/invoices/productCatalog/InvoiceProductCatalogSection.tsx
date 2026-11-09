import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { PaginatedContent } from '~/components/designSystem/Pagination'
import { useViewFeeDetailsDrawer } from '~/components/invoices/details/ViewFeeDetailsDrawer'
import {
  CurrencyEnum,
  FeeForInvoiceProductCatalogSectionFragment,
  InvoiceProductCatalogContractFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceProductCatalogFeesTable } from './InvoiceProductCatalogFeesTable'
import { buildInvoiceProductCatalogTabs } from './invoiceProductCatalogTabs'
import { InvoiceProductCatalogToolbar } from './InvoiceProductCatalogToolbar'
import { formatInvoiceProductFeesFilters } from './invoiceProductFeesFilters'
import {
  buildInvoiceProductCatalogSections,
  INVOICE_PRODUCT_CATALOG_SECTION_SEARCH_PARAM,
  INVOICE_PRODUCT_FEES_PAGE_SIZE,
  InvoiceProductCatalogSectionItem,
  resolveActiveSectionKey,
  useInvoiceProductFees,
} from './useInvoiceProductFees'

export const INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID = 'invoice-product-catalog-section'
export const INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID = 'invoice-product-catalog-empty'

const EMPTY_FEES: FeeForInvoiceProductCatalogSectionFragment[] = []

type InvoiceProductCatalogSectionDisplayProps = {
  currency: CurrencyEnum
  customerTimezone?: TimezoneEnum | null
  hasTaxProviderError?: boolean
}

const InvoiceProductCatalogSectionContent = ({
  invoiceId,
  section,
  sections,
  ...displayProps
}: InvoiceProductCatalogSectionDisplayProps & {
  invoiceId: string
  section: InvoiceProductCatalogSectionItem
  sections: InvoiceProductCatalogSectionItem[]
}): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const viewFeeDetails = useViewFeeDetailsDrawer()
  const filters = formatInvoiceProductFeesFilters(searchParams)
  const { data, loading, error, variables, refetch, goToPage, selectSection, onSearchChange } =
    useInvoiceProductFees({ invoiceId, section, filters })
  const hasActiveSearchOrFilters = !!variables?.searchTerm || Object.keys(filters).length > 0

  return (
    <>
      <InvoiceProductCatalogToolbar
        tabs={buildInvoiceProductCatalogTabs(sections, translate)}
        section={section}
        onSelectSection={selectSection}
        onSearchChange={onSearchChange}
      />
      <PaginatedContent
        metadata={data?.invoiceProductFees.metadata}
        loading={loading}
        pageSize={INVOICE_PRODUCT_FEES_PAGE_SIZE}
        onPageChange={goToPage}
      >
        <InvoiceProductCatalogFeesTable
          {...displayProps}
          fees={data?.invoiceProductFees.collection ?? EMPTY_FEES}
          section={section}
          isLoading={loading}
          hasError={!!error}
          hasActiveSearchOrFilters={hasActiveSearchOrFilters}
          onRetry={() => refetch()}
          onFeeClick={viewFeeDetails.open}
        />
      </PaginatedContent>
    </>
  )
}

export const InvoiceProductCatalogSection = ({
  invoiceId,
  contracts,
  ...displayProps
}: InvoiceProductCatalogSectionDisplayProps & {
  invoiceId: string
  contracts: InvoiceProductCatalogContractFragment[]
}): JSX.Element => {
  const [searchParams] = useSearchParams()
  const sections = useMemo(() => buildInvoiceProductCatalogSections(contracts), [contracts])
  const activeSectionKey = resolveActiveSectionKey(
    sections,
    searchParams.get(INVOICE_PRODUCT_CATALOG_SECTION_SEARCH_PARAM),
  )
  const section = sections.find(({ key }) => key === activeSectionKey)

  return (
    <section data-test={INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID} className="flex flex-col py-6">
      {section ? (
        <InvoiceProductCatalogSectionContent
          key={`${invoiceId}:${activeSectionKey}`}
          invoiceId={invoiceId}
          section={section}
          sections={sections}
          {...displayProps}
        />
      ) : (
        <div data-test={INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID} />
      )}
    </section>
  )
}
