import { gql } from '@apollo/client'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { computeCustomerInitials } from '~/components/customers/utils'
import { Avatar, Button, InfiniteScroll, Table, Typography } from '~/components/designSystem'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
  Filters,
  formatFiltersForCustomerQuery,
} from '~/components/designSystem/Filters'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import { SearchInput } from '~/components/SearchInput'
import { CUSTOMER_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { CREATE_CUSTOMER_ROUTE, CUSTOMER_DETAILS_ROUTE, UPDATE_CUSTOMER_ROUTE } from '~/core/router'
import {
  AddCustomerDrawerFragmentDoc,
  CustomerAccountTypeEnum,
  CustomerItemFragmentDoc,
  useCustomersLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader } from '~/styles'

gql`
  fragment CustomerItem on Customer {
    id
    name
    displayName
    firstname
    lastname
    externalId
    createdAt
    activeSubscriptionsCount
    ...AddCustomerDrawer
  }

  query customers(
    $page: Int
    $limit: Int
    $searchTerm: String
    $accountType: [CustomerAccountTypeEnum!]
  ) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm, accountType: $accountType) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CustomerItem
      }
    }
  }

  ${CustomerItemFragmentDoc}
  ${AddCustomerDrawerFragmentDoc}
`

const CustomersList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const filtersForCustomerQuery = useMemo(() => {
    return formatFiltersForCustomerQuery(searchParams)
  }, [searchParams])

  const [getCustomers, { data, error, loading, fetchMore, variables }] = useCustomersLazyQuery({
    variables: {
      limit: 20,
      ...filtersForCustomerQuery,
      accountType: [
        (filtersForCustomerQuery.accountType as CustomerAccountTypeEnum) ??
          CustomerAccountTypeEnum.Customer,
      ],
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)

  const { debouncedSearch, isLoading } = useDebouncedSearch(getCustomers, loading)

  return (
    <div>
      <PageHeader.Wrapper withSide className="gap-4 whitespace-pre">
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_624efab67eb2570101d117a5')}
        </Typography>
        <div className="flex items-center gap-3">
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63befc65efcd9374da45b801')}
          />
          {hasPermissions(['customersCreate']) && (
            <Button data-test="create-customer" onClick={() => navigate(CREATE_CUSTOMER_ROUTE)}>
              {translate('text_1734452833961s338w0x3b4s')}
            </Button>
          )}
        </div>
      </PageHeader.Wrapper>

      <div className="px-12 py-3 shadow-b">
        <Filters.Provider
          filtersNamePrefix={CUSTOMER_LIST_FILTER_PREFIX}
          quickFiltersType={AvailableQuickFilters.customerAccountType}
          availableFilters={[AvailableFiltersEnum.customerAccountType]}
        >
          <Filters.QuickFilters />
        </Filters.Provider>
      </div>

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = data?.customers?.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <Table
          name="customers-list"
          data={data?.customers?.collection || []}
          isLoading={loading}
          hasError={!!error}
          containerSize={{
            default: 16,
            md: 48,
          }}
          onRowActionLink={({ id }) => generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: id })}
          columns={[
            {
              key: 'displayName',
              title: translate('text_624efab67eb2570101d117cc'),
              minWidth: 200,
              content: (customer) => {
                const customerInitials = computeCustomerInitials(customer)

                return (
                  <div className="flex items-center gap-3">
                    <Avatar
                      variant="user"
                      size="medium"
                      identifier={customer.displayName as string}
                      initials={customerInitials}
                    />
                    <Typography variant="bodyHl" color="textSecondary" noWrap>
                      {customer.displayName || '-'}
                    </Typography>
                  </div>
                )
              },
            },
            {
              key: 'email',
              title: translate('text_6419c64eace749372fc72b27'),
              content: ({ email }) => email || '-',
              maxSpace: true,
              minWidth: 200,
            },
            {
              key: 'activeSubscriptionsCount',
              title: translate('text_1734452833961chacuky8218'),
              content: ({ activeSubscriptionsCount }) => activeSubscriptionsCount,
              textAlign: 'right',
            },
            {
              key: 'paymentProvider',
              title: translate('text_6419c64eace749372fc72b40'),
              content: ({ paymentProvider }) =>
                paymentProvider ? <PaymentProviderChip paymentProvider={paymentProvider} /> : null,
            },
            {
              key: 'createdAt',
              title: translate('text_624efab67eb2570101d117e3'),
              content: ({ createdAt }) => formatTimeOrgaTZ(createdAt),
            },
          ]}
          actionColumnTooltip={() => translate('text_626162c62f790600f850b7b6')}
          actionColumn={(customer) => {
            if (!hasPermissions(['customersUpdate']) && !hasPermissions(['customersDelete'])) {
              return undefined
            }

            return [
              hasPermissions(['customersUpdate'])
                ? {
                    startIcon: 'pen',
                    title: translate('text_6261640f28a49700f1290df3'),
                    onAction: () =>
                      navigate(
                        generatePath(UPDATE_CUSTOMER_ROUTE, {
                          customerId: customer.id,
                        }),
                      ),
                  }
                : null,
              hasPermissions(['customersDelete'])
                ? {
                    startIcon: 'trash',
                    title: translate('text_6261640f28a49700f1290df5'),
                    onAction: () => deleteDialogRef.current?.openDialog({ customer }),
                  }
                : null,
            ]
          }}
          placeholder={{
            errorState: variables?.searchTerm
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_63ac86d797f728a87b2f9fea'),
                  subtitle: translate('text_63ac86d797f728a87b2f9ff2'),
                  buttonTitle: translate('text_63ac86d797f728a87b2f9ffa'),
                  buttonAction: () => location.reload(),
                  buttonVariant: 'primary',
                },
            emptyState: {
              ...(variables?.searchTerm && {
                title: translate('text_63befc65efcd9374da45b813'),
                subtitle: translate('text_63befc65efcd9374da45b817'),
              }),
              ...(!variables?.searchTerm &&
                !hasPermissions(['customersCreate']) && {
                  title: translate('text_664deb061ac6860101f40d1d'),
                  subtitle: translate('text_1734452833961ix7z38723pg'),
                }),
              ...(!variables?.searchTerm &&
                hasPermissions(['customersCreate']) && {
                  title: translate('text_17344528339611v83lf47q5m'),
                  subtitle: translate('text_1734452833961ix7z38723pg'),
                  buttonTitle: translate('text_1734452833961s338w0x3b4s'),
                  buttonAction: () => navigate(CREATE_CUSTOMER_ROUTE),
                  buttonVariant: 'primary',
                }),
              ...(!variables?.searchTerm &&
                hasPermissions(['customersCreate']) &&
                filtersForCustomerQuery.accountType === CustomerAccountTypeEnum.Partner && {
                  title: translate('text_1739870196554qh3i1j3twdo'),
                  subtitle: translate('text_1739870196554eghdpihly57'),
                  buttonTitle: translate('text_1734452833961s338w0x3b4s'),
                  buttonAction: () => navigate(CREATE_CUSTOMER_ROUTE),
                  buttonVariant: 'primary',
                }),
            },
          }}
        />
      </InfiniteScroll>

      <DeleteCustomerDialog ref={deleteDialogRef} />
    </div>
  )
}

export default CustomersList
