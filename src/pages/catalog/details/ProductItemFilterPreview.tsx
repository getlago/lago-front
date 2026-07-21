import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import {
  AvailableFiltersEnum,
  escapeFilterLabel,
  filterDataInlineSeparator,
} from '~/components/designSystem/Filters'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_ITEM_FILTER_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  ProductItemFilterForListFragmentDoc,
  useGetProductItemFiltersForProductItemDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductItemFilterDrawer } from '../drawers/productItemFilter/useProductItemFilterDrawer'
import { useProductItemFilterTableActions } from '../useProductItemFilterTableActions'
import { useProductItemFilterTableColumns } from '../useProductItemFilterTableColumns'

export const PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID = 'product-item-filter-preview-create'
export const PRODUCT_ITEM_FILTER_PREVIEW_VIEW_ALL_TEST_ID = 'product-item-filter-preview-view-all'
export const PRODUCT_ITEM_FILTER_PREVIEW_EMPTY_TEST_ID = 'product-item-filter-preview-empty'

const PREVIEW_LIMIT = 7

gql`
  query getProductItemFiltersForProductItemDetails(
    $productItemId: ID
    $limit: Int
    $searchTerm: String
  ) {
    productItemFilters(productItemId: $productItemId, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        totalCount
      }
      collection {
        id
        ...ProductItemFilterForList
      }
    }
  }

  ${ProductItemFilterForListFragmentDoc}
`

type ProductItemAttachment = {
  id: string
  name: string
  code: string
  billableMetric?: { filters?: Array<unknown> | null } | null
}

// Inner component so the item-filters query only mounts once the parent product
// item has loaded (avoids an initial fetch with an empty productItemId).
const ProductItemFilterPreviewList = ({ productItem }: { productItem: ProductItemAttachment }) => {
  const { translate } = useInternationalization()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductItemFilterTableActions()

  const [getProductItemFilters, { data, error, loading, variables }] =
    useGetProductItemFiltersForProductItemDetailsLazyQuery({
      variables: { productItemId: productItem.id, limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductItemFilters, loading)

  const { columns } = useProductItemFilterTableColumns({ withAttachedProductItem: false })

  const collection = data?.productItemFilters?.collection ?? []
  const totalCount = data?.productItemFilters?.metadata?.totalCount ?? 0
  const isSearching = !!variables?.searchTerm

  // Standard, search-aware table empty/error placeholder (same design as every
  // other list in the app). The truly-empty, not-searching case is handled by
  // the inline dashed box below, so this empty state only surfaces on search.
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
          title: translate('text_1784585400245cbvbv7nqwi8'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_1784585400245a6ghyeaz5wf'),
          subtitle: translate('text_1784585400245nj226z9y9tp'),
        },
  }

  // The product item filter value is id-encoded (the chip shows the name); the
  // "View all" link deep-links to the standalone list pre-filtered on this item.
  const productItemFilterValue = `${productItem.id}${filterDataInlineSeparator}${escapeFilterLabel(productItem.name)}`
  const viewAllTo = `${generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.productItemFilters,
  })}?${PRODUCT_ITEM_FILTER_LIST_FILTER_PREFIX}_${AvailableFiltersEnum.productItemFilterProductItem}=${encodeURIComponent(productItemFilterValue)}`

  const showEmptyBox = !isLoading && !error && !isSearching && collection.length === 0

  if (showEmptyBox) {
    return (
      <div
        data-test={PRODUCT_ITEM_FILTER_PREVIEW_EMPTY_TEST_ID}
        className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-grey-300 px-6 py-10 text-center"
      >
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1784585400245a6ghyeaz5wf')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1784585400245nj226z9y9tp')}
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        onChange={(value) => debouncedSearch?.(value)}
        placeholder={translate('text_17845854002450t175dwblcq')}
        data-test="product-item-filter-preview-search-input"
      />
      <Table
        name="product-item-filter-preview-list"
        data={collection}
        containerSize={0}
        rowSize={72}
        isLoading={isLoading}
        loadingRowCount={PREVIEW_LIMIT}
        hasError={!!error}
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
            data-test={PRODUCT_ITEM_FILTER_PREVIEW_VIEW_ALL_TEST_ID}
          >
            {translate('text_17845939276671s82cze921q', { count: totalCount })}
          </Button>
        </Link>
      )}
    </div>
  )
}

const ProductItemFilterPreview = ({ productItem }: { productItem: ProductItemAttachment }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemFilterDrawer } = useProductItemFilterDrawer()

  // A product item with no billable-metric filters cannot have item filters, so
  // the create action is hidden when there are none to scope against.
  const canCreateProductItemFilters =
    hasPermissions(['productItemFiltersCreate']) &&
    (productItem.billableMetric?.filters?.length ?? 0) > 0

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1783980718114wkor6aysepe')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_1784593927667g72f4poh3cq')}
          </Typography>
        </div>
        {canCreateProductItemFilters && (
          <Button
            variant="inline"
            data-test={PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID}
            onClick={() => openProductItemFilterDrawer({ attachToProductItem: productItem })}
          >
            {translate('text_17836220307039rf790f045t')}
          </Button>
        )}
      </div>

      <ProductItemFilterPreviewList productItem={productItem} />
    </section>
  )
}

export default ProductItemFilterPreview
