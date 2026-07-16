import { gql } from '@apollo/client'
import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import {
  AvailableFiltersEnum,
  escapeFilterLabel,
  filterDataInlineSeparator,
} from '~/components/designSystem/Filters'
import { Table } from '~/components/designSystem/Table/Table'
import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_ITEM_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import {
  ProductCatalogTabsOptionsEnum,
  ProductItemDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATALOG_TAB_ROUTE, PRODUCT_ITEM_DETAILS_ROUTE } from '~/core/router'
import {
  ProductItemForListFragment,
  ProductItemForListFragmentDoc,
  useGetProductItemsForProductDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductItemDialog } from '../dialogs/useDeleteProductItemDialog'
import { useProductItemDrawer } from '../drawers/productItem/useProductItemDrawer'
import { useProductItemTableColumns } from '../useProductItemTableColumns'

export const PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID = 'product-details-add-product-item'
export const PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID = 'product-details-product-items-empty'
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
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemDrawer } = useProductItemDrawer()
  const { openDeleteProductItemDialog } = useDeleteProductItemDialog()

  const [getProductItems, { data, error, loading, variables }] =
    useGetProductItemsForProductDetailsLazyQuery({
      variables: { productIds: [product.id], limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductItems, loading)

  const canUpdateProductItems = hasPermissions(['productItemsUpdate'])
  const canDeleteProductItems = hasPermissions(['productItemsDelete'])

  const columns = useProductItemTableColumns({ withAttachedProduct: false })

  const composeTooltipLabel = useCallback((): string => {
    let tooltipLabel = [
      canUpdateProductItems && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteProductItems && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    tooltipLabel = tooltipLabel.charAt(0).toUpperCase() + tooltipLabel.slice(1)

    return tooltipLabel
  }, [canUpdateProductItems, canDeleteProductItems, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
        productItemId: id,
        tab: ProductItemDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductItemForListFragment> = (productItem) => {
    const actions: ActionItem<ProductItemForListFragment>[] = []

    if (canUpdateProductItems) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductItemDrawer({ productItem }),
      })
    }

    if (canDeleteProductItems) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteProductItemDialog({ productItem }),
      })
    }

    return actions
  }

  const totalCount = data?.productItems?.metadata?.totalCount ?? 0
  const hasSearch = !!variables?.searchTerm

  // No items and no active search: show the compact dashed placeholder instead
  // of the full-page empty illustration.
  if (!isLoading && totalCount === 0 && !hasSearch) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-grey-300 px-4 py-6"
        data-test={PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID}
      >
        <Typography variant="body" color="grey500">
          {translate('text_1783980718114mr3o8mh00qx')}
        </Typography>
      </div>
    )
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
        actionColumnTooltip={composeTooltipLabel}
        actionColumn={actionColumn}
        columns={columns}
        placeholder={{
          emptyState: {
            title: translate('text_1783980718114wya9wp01m5i'),
            subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
          },
        }}
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
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1" color="grey700">
            {translate('text_17831042398250iwa2xp8pba')}
          </Typography>
          <Typography variant="caption" color="grey600">
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
