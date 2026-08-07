import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  Filters,
  formatFiltersForRateCardsQuery,
  mapRateCardFilterVars,
  RateCardAvailableFilters,
} from '~/components/Filters'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { SearchInput } from '~/components/SearchInput'
import { RATE_CARD_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { RateCardForListFragmentDoc, useRateCardsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import {
  RATE_CARD_DRAWER_TITLE_CREATE_KEY,
  useRateCardDrawer,
} from './drawers/rateCard/useRateCardDrawer'
import { useRateCardTableActions } from './useRateCardTableActions'
import { useRateCardTableColumns } from './useRateCardTableColumns'

// The operation is intentionally named `rateCards` (lowercase): the rate-card
// delete dialog (Task 3) refetches active queries by that exact string name.
gql`
  query rateCards(
    $page: Int
    $limit: Int
    $searchTerm: String
    $productId: ID
    $productFilterId: ID
  ) {
    rateCards(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productId: $productId
      productFilterId: $productFilterId
    ) {
      collection {
        id
        ...RateCardForList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${RateCardForListFragmentDoc}
`

export const RATE_CARDS_LIST_TEST_ID = 'rate-cards-list'

// New translation keys are exported as named constants (feature convention, see
// useRateCardTableColumns.tsx) so the test references them instead of
// duplicating the raw ids.
export const RATE_CARDS_SEARCH_PLACEHOLDER_KEY = 'text_17849293094725tv045xhkxf'
export const RATE_CARDS_EMPTY_TITLE_KEY = 'text_1784929309473260i6j8d7kb'
export const RATE_CARDS_EMPTY_SUBTITLE_KEY = 'text_1784929309473m4m8kk6q6g5'
export const RATE_CARDS_EMPTY_SEARCH_TITLE_KEY = 'text_17849293094732goytgdvyql'

const RateCardsList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openRateCardDrawer } = useRateCardDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useRateCardTableActions()
  const [searchParams] = useSearchParams()
  const { page, goToPage } = usePageSearchParam()

  const filtersForRateCardsQuery = useMemo(
    () => mapRateCardFilterVars(formatFiltersForRateCardsQuery(searchParams)),
    [searchParams],
  )

  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getRateCards, { data, error, loading, variables }] = useRateCardsLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page, ...filtersForRateCardsQuery },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getRateCards, loading)

  const canCreateRateCards = hasPermissions(['rateCardsCreate'])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const columns = useRateCardTableColumns({ withAttachedTo: true })

  const placeholder: TablePlaceholder = {
    errorState: variables?.searchTerm
      ? {
          title: translate('text_623b53fea66c76017eaebb6e'),
          subtitle: translate('text_63bab307a61c62af497e0599'),
        }
      : {
          title: translate('text_629728388c4d2300e2d380d5'),
          subtitle: translate('text_629728388c4d2300e2d380eb'),
          buttonTitle: translate('text_629728388c4d2300e2d38110'),
          buttonVariant: 'primary',
          buttonAction: () => location.reload(),
        },
    emptyState: variables?.searchTerm
      ? {
          title: translate(RATE_CARDS_EMPTY_SEARCH_TITLE_KEY),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate(RATE_CARDS_EMPTY_TITLE_KEY),
          subtitle: translate(RATE_CARDS_EMPTY_SUBTITLE_KEY),
          ...(canCreateRateCards && {
            buttonTitle: translate(RATE_CARD_DRAWER_TITLE_CREATE_KEY),
            buttonVariant: 'primary',
            buttonAction: () => openRateCardDrawer(),
          }),
        },
  }

  // Inset layout (per design, same as the customer subscriptions tab): the
  // wrapper owns the page gutter so the row dividers and the pager border stop
  // at it instead of running edge to edge; the table keeps only the minimal
  // 4px cell gutter.
  return (
    <div className="px-4 md:px-12" data-test={RATE_CARDS_LIST_TEST_ID}>
      <Filters.Provider
        filtersNamePrefix={RATE_CARD_LIST_FILTER_PREFIX}
        availableFilters={RateCardAvailableFilters}
      >
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate(RATE_CARDS_SEARCH_PLACEHOLDER_KEY)}
            data-test="rate-cards-search-input"
          />
          <Filters.Component />
        </div>
      </Filters.Provider>
      <PaginatedContent
        metadata={data?.rateCards?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="rate-cards-list"
          data={data?.rateCards?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(rateCard) => `${rateCard.name}`}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={actionColumnTooltip}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </div>
  )
}

export default RateCardsList
