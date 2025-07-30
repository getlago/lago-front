import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { CustomerOverview } from '~/components/customers/overview/CustomerOverview'
import { ButtonLink } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesLazyQuery,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

import { CustomerInvoicesList } from './CustomerInvoicesList'

const DRAFT_INVOICES_ITEMS_COUNT = 4

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: [InvoiceStatusTypeEnum!]
    $searchTerm: String
  ) {
    customerInvoices(
      customerId: $customerId
      limit: $limit
      page: $page
      status: $status
      searchTerm: $searchTerm
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
  const {
    data: dataDraft,
    error: errorDraft,
    loading: loadingDraft,
  } = useGetCustomerInvoicesQuery({
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
      variables: variablesFinalized,
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
  const { debouncedSearch, isLoading } = useDebouncedSearch(getFinalizedInvoices, loadingFinalized)
  const initialLoad = loadingDraft && loadingFinalized
  const invoicesDraft = dataDraft?.customerInvoices.collection
  const invoicesFinalized = dataFinalized?.customerInvoices.collection
  const invoicesDraftCount = dataDraft?.customerInvoices.metadata.totalCount || 0

  const hasDraftInvoices = !!invoicesDraft?.length
  const hasFinalizedInvoices = !!invoicesFinalized?.length
  const isSearching = !!variablesFinalized?.searchTerm
  const hasInvoices = hasDraftInvoices || hasFinalizedInvoices

  const showSeeMore = invoicesDraftCount > DRAFT_INVOICES_ITEMS_COUNT

  return (
    <div className="flex flex-col gap-12">
      {!initialLoad && hasInvoices && !isPartner && (
        <CustomerOverview externalCustomerId={externalId} userCurrency={userCurrency} />
      )}

      {!initialLoad && hasDraftInvoices && (
        <div>
          <PageSectionTitle
            title={translate('text_638f4d756d899445f18a49ee')}
            subtitle={translate('text_1737655039923xyw73dt51ee')}
          />

          <CustomerInvoicesList
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
      )}

      <div>
        <PageSectionTitle
          title={translate('text_6250304370f0f700a8fdc291')}
          subtitle={translate('text_1737654864705k68zqvg5u9d')}
          customAction={
            <SearchInput
              onChange={debouncedSearch}
              placeholder={translate('text_63c6861d9991cdd5a92c1419')}
            />
          }
        />

        <CustomerInvoicesList
          isSearching={isSearching}
          isLoading={isLoading}
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
