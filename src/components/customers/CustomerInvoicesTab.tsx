import { gql } from '@apollo/client'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { CustomerOverview } from '~/components/customers/overview/CustomerOverview'
import { Filters } from '~/components/designSystem/Filters'
import { formatFiltersForCustomerInvoicesQuery } from '~/components/designSystem/Filters/utils'
import { usePageSearchParam } from '~/components/designSystem/Pagination'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import {
  CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX,
  CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX,
} from '~/core/constants/filters'
import {
  CurrencyEnum,
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerFilterDefaults } from '~/hooks/useCustomerFilterDefaults'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'

import { CustomerInvoicesList } from './CustomerInvoicesList'

const INVOICES_ITEMS_PER_PAGE = 5

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: [InvoiceStatusTypeEnum!]
    $searchTerm: String
    $currency: CurrencyEnum
    $billingEntityIds: [ID!]
  ) {
    customerInvoices(
      customerId: $customerId
      limit: $limit
      page: $page
      status: $status
      searchTerm: $searchTerm
      currency: $currency
      billingEntityIds: $billingEntityIds
    ) {
      ...InvoiceForInvoiceList
    }
  }

  ${InvoiceForInvoiceListFragmentDoc}
`

export const INVOICES_TAB_CONTAINER = 'invoices-tab-container'
export const INVOICES_TAB_DRAFT_SECTION = 'invoices-tab-draft-section'
export const INVOICES_TAB_FINALIZED_SECTION = 'invoices-tab-finalized-section'

interface CustomerInvoicesTabProps {
  customerId: string
  customerTimezone?: TimezoneEnum
  customerBillingEntity?: { id: string; code: string; name?: string | null } | null
  externalId?: string
  userCurrency?: CurrencyEnum
  isPartner?: boolean
}

export const CustomerInvoicesTab = ({
  customerId,
  customerTimezone,
  customerBillingEntity,
  isPartner,
  externalId,
  userCurrency,
}: CustomerInvoicesTabProps) => {
  const { translate } = useInternationalization()
  const baseFiltersProps = useCustomerFilterDefaults({
    filtersNamePrefix: CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX,
    include: ['currency', 'entity'],
  })

  const draftFiltersProps = baseFiltersProps
    ? { ...baseFiltersProps, filtersNamePrefix: CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX }
    : null

  const finalizedFiltersProps = baseFiltersProps
    ? { ...baseFiltersProps, filtersNamePrefix: CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX }
    : null
  const [searchParams] = useSearchParams()

  const draftFilters = formatFiltersForCustomerInvoicesQuery(
    searchParams,
    CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX,
  )
  const finalizedFilters = formatFiltersForCustomerInvoicesQuery(
    searchParams,
    CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX,
  )

  const { page: draftPage, goToPage: goToDraftPage } = usePageSearchParam('draft')
  const { page: finalizedPage, goToPage: goToFinalizedPage } = usePageSearchParam('finalized')

  const [draftSearchTerm, setDraftSearchTerm] = useState<string | undefined>(undefined)

  const {
    data: dataDraft,
    error: errorDraft,
    fetchMore: fetchMoreDraft,
    loading: loadingDraft,
  } = useGetCustomerInvoicesQuery({
    // Skip the cache on entry so re-opening the tab loads a fresh page 1 (skeleton), instead of
    // flashing the previously-viewed page.
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    variables: {
      customerId,
      limit: INVOICES_ITEMS_PER_PAGE,
      page: draftPage,
      status: [InvoiceStatusTypeEnum.Draft],
      searchTerm: draftSearchTerm,
      currency: draftFilters.currency,
      billingEntityIds: draftFilters.billingEntityId ? [draftFilters.billingEntityId] : undefined,
    },
  })

  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  const {
    data: dataFinalized,
    error: errorFinalized,
    fetchMore: fetchMoreFinalized,
    loading: loadingFinalized,
  } = useGetCustomerInvoicesQuery({
    variables: {
      customerId,
      limit: INVOICES_ITEMS_PER_PAGE,
      page: finalizedPage,
      status: [
        InvoiceStatusTypeEnum.Finalized,
        InvoiceStatusTypeEnum.Voided,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ],
      searchTerm,
      currency: finalizedFilters.currency,
      billingEntityIds: finalizedFilters.billingEntityId
        ? [finalizedFilters.billingEntityId]
        : undefined,
    },
    notifyOnNetworkStatusChange: true,
    // Skip the cache on entry so re-opening the tab loads a fresh page 1 (skeleton), instead of
    // flashing the previously-viewed page.
    fetchPolicy: 'network-only',
  })

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value || undefined), DEBOUNCE_SEARCH_MS),
    [],
  )

  const debouncedSetDraftSearchTerm = useMemo(
    () => debounce((value: string) => setDraftSearchTerm(value || undefined), DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel()
      debouncedSetDraftSearchTerm.cancel()
    }
  }, [debouncedSetSearchTerm, debouncedSetDraftSearchTerm])

  const invoicesDraftCount = dataDraft?.customerInvoices.metadata.totalCount || 0

  const isDraftFiltering =
    !!draftSearchTerm || !!draftFilters.currency || !!draftFilters.billingEntityId
  const isFiltering =
    !!searchTerm || !!finalizedFilters.currency || !!finalizedFilters.billingEntityId

  // Hide the Draft section entirely when the customer has no drafts AND the
  // user is not currently filtering. If a filter returns zero rows we keep
  // the section visible so the operator can clear the filter without
  // navigating away.
  const showDraftSection = isDraftFiltering || loadingDraft || invoicesDraftCount > 0

  return (
    <div className="flex flex-col gap-12" data-test={INVOICES_TAB_CONTAINER}>
      {!isPartner && (
        <CustomerOverview
          externalCustomerId={externalId}
          userCurrency={userCurrency}
          customerBillingEntity={customerBillingEntity}
        />
      )}

      {showDraftSection && (
        <div data-test={INVOICES_TAB_DRAFT_SECTION}>
          <PageSectionTitle
            title={translate('text_638f4d756d899445f18a49ee')}
            subtitle={translate('text_1737655039923xyw73dt51ee')}
          />

          <div className="mb-4 flex items-center gap-3">
            <SearchInput
              onChange={(value) => {
                goToDraftPage(1)
                debouncedSetDraftSearchTerm(value)
              }}
              placeholder={translate('text_63c6861d9991cdd5a92c1419')}
            />
            {draftFiltersProps && (
              <Filters.Provider {...draftFiltersProps}>
                <Filters.Component />
              </Filters.Provider>
            )}
          </div>

          <CustomerInvoicesList
            isSearching={isDraftFiltering}
            isLoading={loadingDraft}
            hasError={!!errorDraft}
            customerTimezone={customerTimezone}
            customerId={customerId}
            invoiceData={dataDraft?.customerInvoices}
            fetchMore={fetchMoreDraft}
            onPageChange={goToDraftPage}
            pageSize={INVOICES_ITEMS_PER_PAGE}
          />
        </div>
      )}

      <div data-test={INVOICES_TAB_FINALIZED_SECTION}>
        <PageSectionTitle
          title={translate('text_6250304370f0f700a8fdc291')}
          subtitle={translate('text_1737654864705k68zqvg5u9d')}
        />

        <div className="mb-4 flex items-center gap-3">
          <SearchInput
            onChange={(value) => {
              goToFinalizedPage(1)
              debouncedSetSearchTerm(value)
            }}
            placeholder={translate('text_63c6861d9991cdd5a92c1419')}
          />
          {finalizedFiltersProps && (
            <Filters.Provider {...finalizedFiltersProps}>
              <Filters.Component />
            </Filters.Provider>
          )}
        </div>

        <CustomerInvoicesList
          isSearching={isFiltering}
          isLoading={loadingFinalized}
          hasError={!!errorFinalized}
          customerTimezone={customerTimezone}
          customerId={customerId}
          invoiceData={dataFinalized?.customerInvoices}
          fetchMore={fetchMoreFinalized}
          onPageChange={goToFinalizedPage}
          pageSize={INVOICES_ITEMS_PER_PAGE}
        />
      </div>
    </div>
  )
}
