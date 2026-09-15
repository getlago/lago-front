import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table } from '~/components/designSystem/Table/Table'
import {
  AvailableFiltersEnum,
  escapeFilterLabel,
  filterDataInlineSeparator,
} from '~/components/Filters'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { Link, PRODUCT_CATALOG_TAB_ROUTE } from '~/core/router'
import {
  ProductForListFragmentDoc,
  useGetProductsForProductCategoryDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductDrawer } from '../drawers/product/useProductDrawer'
import { useProductTableActions } from '../useProductTableActions'
import { useProductTableColumns } from '../useProductTableColumns'

export const PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID = 'product-details-add-product-item'
export const PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID =
  'product-details-product-items-view-all'

const PREVIEW_LIMIT = 6

gql`
  query getProductsForProductCategoryDetails(
    $productCategoryIds: [ID!]
    $limit: Int
    $searchTerm: String
  ) {
    products(productCategoryIds: $productCategoryIds, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        totalCount
      }
      collection {
        id
        ...ProductForList
      }
    }
  }

  ${ProductForListFragmentDoc}
`

type ProductCategoryAttachment = { id: string; name: string; code: string }

// Inner component so the query only mounts once the parent productCategory has loaded
// (avoids an initial fetch with an empty productCategoryId).
const ProductsPreview = ({ productCategory }: { productCategory: ProductCategoryAttachment }) => {
  const { translate } = useInternationalization()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductTableActions()

  const [getProducts, { data, error, loading, variables }] =
    useGetProductsForProductCategoryDetailsLazyQuery({
      variables: { productCategoryIds: [productCategory.id], limit: PREVIEW_LIMIT },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProducts, loading)

  const columns = useProductTableColumns({ withAttachedProductCategory: false })

  const totalCount = data?.products?.metadata?.totalCount ?? 0

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm,
    noResultTitleKey: 'text_1783980718114wya9wp01m5i',
    emptyTitleKey: 'text_1783980718114bqx4jce32fv',
    emptySubtitleKey: 'text_1783980718114kj0fch41rw4',
  })

  // The productCategory filter value is id-encoded (chip shows the code); the "View all"
  // link deep-links to the standalone list pre-filtered on this productCategory.
  const productCategoryFilterValue = `${productCategory.id}${filterDataInlineSeparator}${escapeFilterLabel(productCategory.code)}`
  const viewAllTo = `${generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
    tab: ProductCatalogTabsOptionsEnum.products,
  })}?${PRODUCT_LIST_FILTER_PREFIX}_${AvailableFiltersEnum.productProductCategory}=${encodeURIComponent(productCategoryFilterValue)}`

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        onChange={debouncedSearch}
        placeholder={translate('text_1783980718114714izppxdwq')}
        data-test="product-details-product-items-search-input"
      />
      <Table
        name="product-details-product-items-list"
        data={data?.products?.collection ?? []}
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

export const ProductCategoryDetailsProducts = ({
  productCategory,
}: {
  productCategory?: ProductCategoryAttachment
}) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductDrawer } = useProductDrawer()

  return (
    <section>
      <PageSectionTitle
        title={translate('text_17831042398250iwa2xp8pba')}
        subtitle={translate('text_1783980718114ltktg3qxx47')}
        action={
          hasPermissions(['productsCreate']) && !!productCategory
            ? {
                title: translate('text_1783622030703m9jlurg4jsn'),
                dataTest: PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID,
                onClick: () => openProductDrawer({ attachToProductCategory: productCategory }),
              }
            : undefined
        }
      />

      {productCategory ? <ProductsPreview productCategory={productCategory} /> : null}
    </section>
  )
}
