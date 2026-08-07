import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import {
  AvailableFiltersEnum,
  escapeFilterLabel,
  filterDataInlineSeparator,
} from '~/components/Filters'
import { SearchInput } from '~/components/SearchInput'
import { RATE_CARD_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  RateCardForListFragment,
  RateCardForListFragmentDoc,
  RateCardForPreviewProductFilterFragment,
  RateCardForPreviewProductFragment,
  useGetRateCardsForProductDetailsLazyQuery,
  useGetRateCardsForProductFilterDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { RATE_CARD_DRAWER_DESCRIPTION_KEY } from '../drawers/rateCard/RateCardDrawerContent'
import {
  RATE_CARD_DRAWER_TITLE_CREATE_KEY,
  useRateCardDrawer,
} from '../drawers/rateCard/useRateCardDrawer'
import {
  RATE_CARDS_EMPTY_SEARCH_TITLE_KEY,
  RATE_CARDS_EMPTY_SUBTITLE_KEY,
  RATE_CARDS_EMPTY_TITLE_KEY,
  RATE_CARDS_SEARCH_PLACEHOLDER_KEY,
} from '../RateCardsList'
import { useRateCardTableActions } from '../useRateCardTableActions'
import { useRateCardTableColumns } from '../useRateCardTableColumns'

// The parent fields this preview's `scope` prop reads: the parent entity's
// identity (for the query scope, the create-with-prefill and the "view all"
// deep-link) and, for a filter, its owning product item (the drawer seeds the
// create form's product item combobox from it). Each detail query spreads the
// matching fragment so the data dependency is declared where it is used, per the
// project's "every consumer declares its own named fragment; the parent spreads
// it" convention (mirrors ProductFilterPreview's ProductForFilterPreview).
gql`
  fragment RateCardForPreviewProduct on Product {
    id
    name
  }

  fragment RateCardForPreviewProductFilter on ProductFilter {
    id
    name
    product {
      id
      name
    }
  }
`

// The `rateCards` root field is queried twice more here (co-located, operation names
// used by the delete dialog's cache eviction + the drawer's create refetchQueries):
// once scoped to a product item, once scoped to a product item filter. Both reuse
// `RateCardForList` (the same fragment powering the standalone list) so the three
// surfaces never drift on which fields a rate card row needs.
gql`
  query getRateCardsForProductDetails($productId: ID, $limit: Int, $searchTerm: String) {
    rateCards(productId: $productId, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        totalCount
      }
      collection {
        id
        ...RateCardForList
      }
    }
  }

  query getRateCardsForProductFilterDetails(
    $productFilterId: ID
    $limit: Int
    $searchTerm: String
  ) {
    rateCards(productFilterId: $productFilterId, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        totalCount
      }
      collection {
        id
        ...RateCardForList
      }
    }
  }

  ${RateCardForListFragmentDoc}
`

export const RATE_CARD_PREVIEW_CREATE_TEST_ID = 'rate-card-preview-create'
export const RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID = 'rate-card-preview-view-all'

// New translation key, exported as a named constant (feature convention, see
// useRateCardTableColumns.tsx) so the test references it instead of duplicating
// the raw id.
export const RATE_CARD_PREVIEW_VIEW_ALL_KEY = 'text_1785001812444mgdhh9wr0jj'

const PREVIEW_LIMIT = 7

// Discriminated scope: which parent entity this preview is embedded under. Typed
// off the co-located parent fragments above (not inline shapes), so the parent
// detail queries that spread those fragments are what supply the data. The
// productFilter fragment additionally carries its own product item (id/name)
// because that is the exact shape `useRateCardDrawer`'s `attachToProductFilter`
// needs to seed the create form's product item combobox.
export type RateCardPreviewScope =
  | { product: RateCardForPreviewProductFragment }
  | { productFilter: RateCardForPreviewProductFilterFragment }

type RateCardPreviewListViewProps = {
  collection: RateCardForListFragment[]
  totalCount: number
  isLoading: boolean
  hasError: boolean
  isSearching: boolean
  onSearch: (value: string) => void
  viewAllTo: string
}

// Shared presentational piece between the two scoped lists below (product item /
// product item filter): only the query differs, the table/search/see-all rendering
// is identical.
const RateCardPreviewListView = ({
  collection,
  totalCount,
  isLoading,
  hasError,
  isSearching,
  onSearch,
  viewAllTo,
}: RateCardPreviewListViewProps) => {
  const { translate } = useInternationalization()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useRateCardTableActions()
  const columns = useRateCardTableColumns({ withAttachedTo: false })

  // Standard, search-aware table placeholder (same design + copy as the standalone
  // rate-cards list): the classic placeholder covers both the truly-empty,
  // not-searching case and the no-results-for-search case.
  const placeholder: TablePlaceholder = {
    errorState: isSearching
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
    emptyState: isSearching
      ? {
          title: translate(RATE_CARDS_EMPTY_SEARCH_TITLE_KEY),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate(RATE_CARDS_EMPTY_TITLE_KEY),
          subtitle: translate(RATE_CARDS_EMPTY_SUBTITLE_KEY),
        },
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        onChange={onSearch}
        placeholder={translate(RATE_CARDS_SEARCH_PLACEHOLDER_KEY)}
        data-test="rate-card-preview-search-input"
      />
      <Table
        name="rate-card-preview-list"
        data={collection}
        containerSize={0}
        rowSize={72}
        isLoading={isLoading}
        loadingRowCount={PREVIEW_LIMIT}
        hasError={hasError}
        onRowActionLink={getRowActionLink}
        actionColumnTooltip={actionColumnTooltip}
        actionColumn={actionColumn}
        columns={columns}
        placeholder={placeholder}
      />
      {totalCount > PREVIEW_LIMIT && (
        <Link to={viewAllTo} className="w-fit">
          <Button
            variant="quaternary"
            endIcon="arrow-right"
            data-test={RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID}
          >
            {translate(RATE_CARD_PREVIEW_VIEW_ALL_KEY, { count: totalCount })}
          </Button>
        </Link>
      )}
    </div>
  )
}

// Mounted only once the parent product item is known (see RateCardPreview below):
// avoids an initial fetch with an empty productId.
const RateCardPreviewListForProduct = ({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) => {
  const [getRateCards, { data, error, loading, variables }] =
    useGetRateCardsForProductDetailsLazyQuery({
      variables: { productId, limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getRateCards, loading)

  const collection = data?.rateCards?.collection ?? []
  const totalCount = data?.rateCards?.metadata?.totalCount ?? 0

  // The product item filter value is id-encoded (the chip shows the name); the
  // "View all" link deep-links to the standalone list pre-filtered on this item.
  const productValue = `${productId}${filterDataInlineSeparator}${escapeFilterLabel(productName)}`
  const viewAllTo = `${generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.rateCards,
  })}?${RATE_CARD_LIST_FILTER_PREFIX}_${AvailableFiltersEnum.rateCardProduct}=${encodeURIComponent(productValue)}`

  return (
    <RateCardPreviewListView
      collection={collection}
      totalCount={totalCount}
      isLoading={isLoading}
      hasError={!!error}
      isSearching={!!variables?.searchTerm}
      onSearch={(value) => debouncedSearch?.(value)}
      viewAllTo={viewAllTo}
    />
  )
}

// Mounted only once the parent product item filter is known (see RateCardPreview
// below): avoids an initial fetch with an empty productFilterId.
const RateCardPreviewListForProductFilter = ({
  productFilterId,
  productFilterName,
}: {
  productFilterId: string
  productFilterName: string
}) => {
  const [getRateCards, { data, error, loading, variables }] =
    useGetRateCardsForProductFilterDetailsLazyQuery({
      variables: { productFilterId, limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getRateCards, loading)

  const collection = data?.rateCards?.collection ?? []
  const totalCount = data?.rateCards?.metadata?.totalCount ?? 0

  const productFilterValue = `${productFilterId}${filterDataInlineSeparator}${escapeFilterLabel(productFilterName)}`
  const viewAllTo = `${generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.rateCards,
  })}?${RATE_CARD_LIST_FILTER_PREFIX}_${AvailableFiltersEnum.rateCardProductFilter}=${encodeURIComponent(productFilterValue)}`

  return (
    <RateCardPreviewListView
      collection={collection}
      totalCount={totalCount}
      isLoading={isLoading}
      hasError={!!error}
      isSearching={!!variables?.searchTerm}
      onSearch={(value) => debouncedSearch?.(value)}
      viewAllTo={viewAllTo}
    />
  )
}

const RateCardPreview = ({ scope }: { scope: RateCardPreviewScope }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openRateCardDrawer } = useRateCardDrawer()

  const canCreateRateCards = hasPermissions(['rateCardsCreate'])

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1783104239825nxqno33u945')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate(RATE_CARD_DRAWER_DESCRIPTION_KEY)}
          </Typography>
        </div>
        {canCreateRateCards && (
          <Button
            variant="inline"
            data-test={RATE_CARD_PREVIEW_CREATE_TEST_ID}
            onClick={() =>
              'product' in scope
                ? openRateCardDrawer({ attachToProduct: scope.product })
                : openRateCardDrawer({ attachToProductFilter: scope.productFilter })
            }
          >
            {translate(RATE_CARD_DRAWER_TITLE_CREATE_KEY)}
          </Button>
        )}
      </div>

      {'product' in scope ? (
        <RateCardPreviewListForProduct
          productId={scope.product.id}
          productName={scope.product.name}
        />
      ) : (
        <RateCardPreviewListForProductFilter
          productFilterId={scope.productFilter.id}
          productFilterName={scope.productFilter.name}
        />
      )}
    </section>
  )
}

export default RateCardPreview
