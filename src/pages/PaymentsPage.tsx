import { gql } from '@apollo/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { usePageSearchParam } from '~/components/designSystem/Pagination'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import {
  Filters,
  formatFiltersForPaymentsQuery,
  PaymentAvailableFilters,
} from '~/components/Filters'
import { PaymentsList } from '~/components/invoices/PaymentsList'
import { formatCountToMetadata } from '~/components/MainHeader/formatCountToMetadata'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { PAYMENT_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CREATE_PAYMENT_ROUTE, useNavigate } from '~/core/router'
import { PaymentForPaymentsListFragmentDoc, useGetPaymentsListLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getPaymentsList(
    $invoiceId: ID
    $externalCustomerId: ID
    $limit: Int
    $page: Int
    $searchTerm: String
    $currency: CurrencyEnum
    $paymentStatus: [PayablePaymentStatusEnum!]
    $amountFrom: BigInt
    $amountTo: BigInt
    $receiptNumber: String
    $createdAtFrom: ISO8601Date
    $createdAtTo: ISO8601Date
    $paymentProviderType: [ProviderTypeEnum!]
    $invoiceNumber: String
    $paymentType: [PaymentTypeEnum!]
    $payableType: [PayableTypeEnum!]
  ) {
    payments(
      invoiceId: $invoiceId
      externalCustomerId: $externalCustomerId
      limit: $limit
      page: $page
      searchTerm: $searchTerm
      currency: $currency
      paymentStatus: $paymentStatus
      amountFrom: $amountFrom
      amountTo: $amountTo
      receiptNumber: $receiptNumber
      createdAtFrom: $createdAtFrom
      createdAtTo: $createdAtTo
      paymentProviderType: $paymentProviderType
      invoiceNumber: $invoiceNumber
      paymentType: $paymentType
      payableType: $payableType
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...PaymentForPaymentsList
      }
    }
  }

  ${PaymentForPaymentsListFragmentDoc}
`

const PaymentsPage = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const navigate = useNavigate()
  const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
  const { organization, loading: organizationLoading } = useOrganizationInfos()
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState<string>()
  const nextSearchTerm = searchInput.trim().length >= 3 ? searchInput : undefined
  const searchPending = nextSearchTerm !== searchTerm
  const queryPending =
    searchPending ||
    (organizationLoading && searchParams.has(`${PAYMENT_LIST_FILTER_PREFIX}_amount`))
  const lastQuery = useRef<string>()

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { page, goToPage } = usePageSearchParam()

  const [getPayments, { data, loading, error, fetchMore, variables }] = useGetPaymentsListLazyQuery(
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    },
  )

  const queryVariables = useMemo(
    () => ({
      ...formatFiltersForPaymentsQuery(searchParams, organization?.defaultCurrency || undefined),
      limit: pageSize,
      page,
      searchTerm,
    }),
    [searchParams, organization?.defaultCurrency, pageSize, page, searchTerm],
  )

  useEffect(() => {
    if (!searchPending) return

    const timeout = setTimeout(() => {
      setSearchTerm(nextSearchTerm)
      goToPage(1)
    }, DEBOUNCE_SEARCH_MS)

    return () => clearTimeout(timeout)
  }, [nextSearchTerm, searchPending, goToPage])

  useEffect(() => {
    const signature = JSON.stringify(queryVariables)

    if (queryPending || lastQuery.current === signature) return

    lastQuery.current = signature
    void getPayments({ variables: queryVariables })
  }, [getPayments, queryVariables, queryPending])

  const paymentsIsLoading = loading || queryPending

  const paymentsTotalCount = data?.payments?.metadata?.totalCount

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_6672ebb8b1b50be550eccbed'),
          metadata: formatCountToMetadata(paymentsTotalCount, translate),
          metadataLoading: paymentsIsLoading && paymentsTotalCount === undefined,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_1737471851634wpeojigr27w'),
              variant: 'primary',
              endIcon: isPremium ? undefined : 'sparkles',
              onClick: () => {
                if (isPremium) {
                  navigate(CREATE_PAYMENT_ROUTE)
                } else {
                  openPremiumWarningDialog()
                }
              },
            },
          ],
        }}
        filtersSection={
          <Filters.Provider
            filtersNamePrefix={PAYMENT_LIST_FILTER_PREFIX}
            availableFilters={PaymentAvailableFilters}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <SearchInput
                onChange={setSearchInput}
                placeholder={translate('text_17370296250897aidak5kjcg')}
              />
              <Filters.Component />
            </div>
          </Filters.Provider>
        }
      />

      <PaymentsList
        error={error}
        fetchMore={fetchMore}
        payments={data?.payments?.collection}
        isLoading={paymentsIsLoading}
        metadata={data?.payments?.metadata}
        variables={variables}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          goToPage(1)
        }}
      />
    </>
  )
}

export default PaymentsPage
