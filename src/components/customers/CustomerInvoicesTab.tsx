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
import { CUSTOMER_INVOICES_FILTER_PREFIX } from '~/core/constants/filters'
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

const INVOICES_ITEMS_PER_PAGE = 10

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
  const filtersProps = useCustomerFilterDefaults({
    filtersNamePrefix: CUSTOMER_INVOICES_FILTER_PREFIX,
    include: ['currency', 'entity'],
  })
  const [searchParams] = useSearchParams()

  const filters = formatFiltersForCustomerInvoicesQuery(
    searchParams,
    CUSTOMER_INVOICES_FILTER_PREFIX,
  )

  const { page, goToPage } = usePageSearchParam()

  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  const { data, error, loading } = useGetCustomerInvoicesQuery({
    // Skip the cache on entry so re-opening the tab loads a fresh page 1 (skeleton), instead of
    // flashing the previously-viewed page.
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    variables: {
      customerId,
      limit: INVOICES_ITEMS_PER_PAGE,
      page,
      status: [
        InvoiceStatusTypeEnum.Draft,
        InvoiceStatusTypeEnum.Finalized,
        InvoiceStatusTypeEnum.Voided,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ],
      searchTerm,
      currency: filters.currency,
      billingEntityIds: filters.billingEntityId ? [filters.billingEntityId] : undefined,
    },
  })

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value || undefined), DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel()
    }
  }, [debouncedSetSearchTerm])

  const isFiltering = !!searchTerm || !!filters.currency || !!filters.billingEntityId

  return (
    <div className="flex flex-col gap-12" data-test={INVOICES_TAB_CONTAINER}>
      {!isPartner && (
        <CustomerOverview
          externalCustomerId={externalId}
          userCurrency={userCurrency}
          customerBillingEntity={customerBillingEntity}
        />
      )}

      <div>
        <PageSectionTitle
          title={translate('text_6250304370f0f700a8fdc291')}
          subtitle={translate('text_1785339249327oh5sazpm82d')}
        />

        <div className="mb-4 flex items-center gap-3">
          <SearchInput
            onChange={(value) => {
              goToPage(1)
              debouncedSetSearchTerm(value)
            }}
            placeholder={translate('text_63c6861d9991cdd5a92c1419')}
          />
          {filtersProps && (
            <Filters.Provider {...filtersProps}>
              <Filters.Component />
            </Filters.Provider>
          )}
        </div>

        <CustomerInvoicesList
          isSearching={isFiltering}
          isLoading={loading}
          hasError={!!error}
          customerTimezone={customerTimezone}
          customerId={customerId}
          invoiceData={data?.customerInvoices}
          onPageChange={goToPage}
          pageSize={INVOICES_ITEMS_PER_PAGE}
        />
      </div>
    </div>
  )
}
