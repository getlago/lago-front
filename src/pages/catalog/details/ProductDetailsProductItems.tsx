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
import { PRODUCT_ITEM_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  ProductItemForListFragmentDoc,
  useGetProductItemsForProductDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductItemDrawer } from '../drawers/productItem/useProductItemDrawer'
import { useProductItemTableActions } from '../useProductItemTableActions'
import { useProductItemTableColumns } from '../useProductItemTableColumns'

export const PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID = 'product-details-add-product-item'
export const PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID =
  'product-details-product-items-view-all'

const PREVIEW_LIMIT = 6

gql`
  query getProductItemsForProductDetails($productIds: [ID!], $limit: Int, $searchTerm: String) {
    productItems(productIds: $productIds, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        totalCount
      }
      collection {
        id
        ...ProductItemForList
      }
    }
  }

  ${ProductItemForListFragmentDoc}
`

type ProductAttachment = { id: string; name: string; code: string }

// Inner component so the query only mounts once the parent product has loaded
// (avoids an initial fetch with an empty productId).
const ProductItemsPreview = ({ product }: { product: ProductAttachment }) => {
  const { translate } = useInternationalization()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductItemTableActions()

  const [getProductItems, { data, error, loading, variables }] =
    useGetProductItemsForProductDetailsLazyQuery({
      variables: { productIds: [product.id], limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductItems, loading)

  const columns = useProductItemTableColumns({ withAttachedProduct: false })

  const totalCount = data?.productItems?.metadata?.totalCount ?? 0

  // Standard, search-aware table empty/error placeholder (same design as every
  // other list in the app); the Table renders it via `hasError`/empty data.
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
          title: translate('text_1783980718114wya9wp01m5i'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_1783980718114bqx4jce32fv'),
          subtitle: translate('text_1783980718114kj0fch41rw4'),
        },
  }

  // The product filter value is id-encoded (chip shows the code); the "View all"
  // link deep-links to the standalone list pre-filtered on this product.
  const productFilterValue = `${product.id}${filterDataInlineSeparator}${escapeFilterLabel(product.code)}`
  const viewAllTo = `${generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.productItems,
  })}?${PRODUCT_ITEM_LIST_FILTER_PREFIX}_${AvailableFiltersEnum.productItemProduct}=${encodeURIComponent(productFilterValue)}`

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        onChange={(value) => debouncedSearch?.(value)}
        placeholder={translate('text_1783980718114714izppxdwq')}
        data-test="product-details-product-items-search-input"
      />
      <Table
        name="product-details-product-items-list"
        data={data?.productItems?.collection ?? []}
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
            data-test={PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID}
          >
            {translate('text_1783980718114q92o669eemw', { count: totalCount })}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const ProductDetailsProductItems = ({ product }: { product?: ProductAttachment }) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemDrawer } = useProductItemDrawer()

  return (
    <section>
      <div className="flex h-18 items-center justify-between gap-4">
        <div className="flex flex-col">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_17831042398250iwa2xp8pba')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_1783980718114ltktg3qxx47')}
          </Typography>
        </div>
        {hasPermissions(['productItemsCreate']) && !!product && (
          <Button
            variant="inline"
            data-test={PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID}
            onClick={() => openProductItemDrawer({ attachToProduct: product })}
          >
            {translate('text_1783622030703m9jlurg4jsn')}
          </Button>
        )}
      </div>

      {product ? <ProductItemsPreview product={product} /> : null}
    </section>
  )
}
