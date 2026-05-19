import { gql } from '@apollo/client'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import { CustomerOverview } from '~/components/customers/overview/CustomerOverview'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { Filters } from '~/components/designSystem/Filters'
import { CustomerInvoicesAvailableFilters } from '~/components/designSystem/Filters/types'
import { formatFiltersForCustomerInvoicesQuery } from '~/components/designSystem/Filters/utils'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import {
  CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX,
  CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX,
} from '~/core/constants/filters'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'

import { CustomerInvoicesList } from './CustomerInvoicesList'

const DRAFT_INVOICES_ITEMS_COUNT = 4

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

interface CustomerInvoicesTabProps {
  customerId: string
  customerTimezone?: TimezoneEnum
  externalId?: string
  userCurrency?: CurrencyEnum
  isPartner?: boolean
}

export const CustomerInvoicesTab = ({
  customerId,
  customerTimezone,
  isPartner,
  externalId,
  userCurrency,
}: CustomerInvoicesTabProps) => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const draftFilters = formatFiltersForCustomerInvoicesQuery(
    searchParams,
    CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX,
  )
  const finalizedFilters = formatFiltersForCustomerInvoicesQuery(
    searchParams,
    CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX,
  )

  const [getDraftInvoices, { data: dataDraft, error: errorDraft, loading: loadingDraft }] =
    useGetCustomerInvoicesLazyQuery({
      variables: {
        customerId,
        limit: DRAFT_INVOICES_ITEMS_COUNT,
        status: [InvoiceStatusTypeEnum.Draft],
      },
    })

  const [
    getFinalizedInvoices,
    {
      data: dataFinalized,
      error: errorFinalized,
      fetchMore: fetchMoreFinalized,
      loading: loadingFinalized,
    },
  ] = useGetCustomerInvoicesLazyQuery({
    variables: {
      customerId,
      limit: 20,
      status: [
        InvoiceStatusTypeEnum.Finalized,
        InvoiceStatusTypeEnum.Voided,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ],
    },
    notifyOnNetworkStatusChange: true,
  })

  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  useEffect(() => {
    getDraftInvoices({
      variables: {
        customerId,
        limit: DRAFT_INVOICES_ITEMS_COUNT,
        status: [InvoiceStatusTypeEnum.Draft],
        currency: draftFilters.currency,
        billingEntityIds: draftFilters.billingEntityId ? [draftFilters.billingEntityId] : undefined,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, draftFilters.currency, draftFilters.billingEntityId])

  useEffect(() => {
    getFinalizedInvoices({
      variables: {
        customerId,
        limit: 20,
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
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, searchTerm, finalizedFilters.currency, finalizedFilters.billingEntityId])

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value || undefined), DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel()
    }
  }, [debouncedSetSearchTerm])

  const invoicesDraftCount = dataDraft?.customerInvoices.metadata.totalCount || 0

  const isDraftFiltering = !!draftFilters.currency || !!draftFilters.billingEntityId
  const isFiltering =
    !!searchTerm || !!finalizedFilters.currency || !!finalizedFilters.billingEntityId

  const showSeeMore = invoicesDraftCount > DRAFT_INVOICES_ITEMS_COUNT

  return (
    <div className="flex flex-col gap-12">
      {!isPartner && (
        <CustomerOverview externalCustomerId={externalId} userCurrency={userCurrency} />
      )}

      <div>
        <PageSectionTitle
          title={translate('text_638f4d756d899445f18a49ee')}
          subtitle={translate('text_1737655039923xyw73dt51ee')}
        />

        <Filters.Provider
          filtersNamePrefix={CUSTOMER_INVOICES_DRAFT_FILTER_PREFIX}
          availableFilters={CustomerInvoicesAvailableFilters}
        >
          <div className="mb-4 flex items-center gap-2">
            <Filters.Component />
          </div>
        </Filters.Provider>

        <CustomerInvoicesList
          isSearching={isDraftFiltering}
          isLoading={loadingDraft}
          hasError={!!errorDraft}
          customerTimezone={customerTimezone}
          customerId={customerId}
          invoiceData={dataDraft?.customerInvoices}
        />

        {showSeeMore && (
          <div className="flex flex-col items-center justify-center py-2 shadow-b">
            <ButtonLink
              type="button"
              to={generatePath(CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, { customerId })}
              buttonProps={{
                variant: 'quaternary',
              }}
            >
              {translate('text_638f4d756d899445f18a4a0e')}
            </ButtonLink>
          </div>
        )}
      </div>

      <div>
        <PageSectionTitle
          title={translate('text_6250304370f0f700a8fdc291')}
          subtitle={translate('text_1737654864705k68zqvg5u9d')}
        />

        <Filters.Provider
          filtersNamePrefix={CUSTOMER_INVOICES_FINALIZED_FILTER_PREFIX}
          availableFilters={CustomerInvoicesAvailableFilters}
        >
          <div className="mb-4 flex items-center gap-3">
            <SearchInput
              onChange={debouncedSetSearchTerm}
              placeholder={translate('text_63c6861d9991cdd5a92c1419')}
            />
            <Filters.Component />
          </div>
        </Filters.Provider>

        <CustomerInvoicesList
          isSearching={isFiltering}
          isLoading={loadingFinalized}
          hasError={!!errorFinalized}
          customerTimezone={customerTimezone}
          customerId={customerId}
          invoiceData={dataFinalized?.customerInvoices}
          fetchMore={fetchMoreFinalized}
        />
      </div>
    </div>
  )
}
