import { useSearchParams } from 'react-router'

import { Alert } from '~/components/designSystem/Alert'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { InvoiceProductCatalogContractFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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

const InvoiceProductCatalogSectionContent = ({
  invoiceId,
  section,
  sections,
}: {
  invoiceId: string
  section: InvoiceProductCatalogSectionItem
  sections: InvoiceProductCatalogSectionItem[]
}): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const { data, loading, error, goToPage, selectSection, onSearchChange } = useInvoiceProductFees({
    invoiceId,
    section,
    filters: formatInvoiceProductFeesFilters(searchParams),
  })
  const fees = data?.invoiceProductFees.collection ?? []

  const renderFees = (): JSX.Element => {
    if (error) {
      return <Alert type="danger">{translate('text_634812d6f16b31ce5cbf4126')}</Alert>
    }

    if (loading) return <Skeleton variant="text" className="h-12 w-full" />

    return (
      <ul>
        {fees.map((fee) => (
          <li key={fee.id} className="py-3 shadow-b">
            <Typography>
              {fee.product?.invoiceDisplayName || fee.product?.name || fee.itemName}
            </Typography>
          </li>
        ))}
      </ul>
    )
  }

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
        sticky={false}
      >
        {renderFees()}
      </PaginatedContent>
    </>
  )
}

export const InvoiceProductCatalogSection = ({
  invoiceId,
  contracts,
}: {
  invoiceId: string
  contracts: InvoiceProductCatalogContractFragment[]
}): JSX.Element => {
  const [searchParams] = useSearchParams()
  const sections = buildInvoiceProductCatalogSections(contracts)
  const activeSectionKey = resolveActiveSectionKey(
    sections,
    searchParams.get(INVOICE_PRODUCT_CATALOG_SECTION_SEARCH_PARAM),
  )
  const section = sections.find(({ key }) => key === activeSectionKey)

  return (
    <section
      data-test={INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID}
      className="flex flex-col gap-4 py-6"
    >
      {section ? (
        <InvoiceProductCatalogSectionContent
          key={`${invoiceId}:${activeSectionKey}`}
          invoiceId={invoiceId}
          section={section}
          sections={sections}
        />
      ) : (
        <div data-test={INVOICE_PRODUCT_CATALOG_EMPTY_TEST_ID} />
      )}
    </section>
  )
}
