import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_DETAILS_ROUTE } from '~/core/router'
import {
  ProductForDeleteProductDialogFragmentDoc,
  ProductForProductDrawerFragmentDoc,
  ProductListItemFragment,
  useProductsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductDialog } from './dialogs/useDeleteProductDialog'
import { useProductDrawer } from './drawers/product/useProductDrawer'

gql`
  fragment ProductListItem on Product {
    id
    name
    code
    invoiceDisplayName
    productItemsCount
    createdAt
    ...ProductForProductDrawer
    ...ProductForDeleteProductDialog
  }

  query products($page: Int, $limit: Int, $searchTerm: String) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...ProductListItem
      }
    }
  }

  ${ProductForProductDrawerFragmentDoc}
  ${ProductForDeleteProductDialogFragmentDoc}
`

const ProductsList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { openDrawer: openProductDrawer } = useProductDrawer()
  const { openDeleteProductDialog } = useDeleteProductDialog()
  const { page, goToPage } = usePageSearchParam()
  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProducts, { data, error, loading, variables }] = useProductsLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProducts, loading)

  const canCreateProducts = hasPermissions(['productsCreate'])
  const canUpdateProducts = hasPermissions(['productsUpdate'])
  const canDeleteProducts = hasPermissions(['productsDelete'])

  const composeTooltipLabel = useCallback((): string => {
    const editLabel = translate('text_629728388c4d2300e2d3816a')
    const deleteLabel = translate('text_629728388c4d2300e2d38182')

    let tooltipLabel = [
      canUpdateProducts && editLabel.toLowerCase(),
      canDeleteProducts && deleteLabel.toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    tooltipLabel = tooltipLabel.charAt(0).toUpperCase() + tooltipLabel.slice(1)

    return tooltipLabel
  }, [canUpdateProducts, canDeleteProducts, translate])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductListItemFragment> = (product) => {
    const actions: ActionItem<ProductListItemFragment>[] = []

    if (canUpdateProducts) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductDrawer(product),
      })
    }

    if (canDeleteProducts) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        // No callback: the dialog evicts the product from the cached
        // list optimistically, so the row disappears without waiting
        // for a refetch.
        onAction: () => openDeleteProductDialog({ product }),
      })
    }

    return actions
  }

  const columns: TableColumn<ProductListItemFragment>[] = [
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      minWidth: 200,
      maxSpace: true,
      content: ({ name, invoiceDisplayName, code }) => (
        <>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {invoiceDisplayName || name}
          </Typography>
          <TypographyWithCopy compact noWrap variant="caption">
            {code}
          </TypographyWithCopy>
        </>
      ),
    },
    {
      key: 'productItemsCount',
      title: translate('text_1783622030703zfer3z2fn5y'),
      textAlign: 'right',
      minWidth: 112,
      content: ({ productItemsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {productItemsCount}
        </Typography>
      ),
    },
    {
      key: 'createdAt',
      title: translate('text_629728388c4d2300e2d380e3'),
      textAlign: 'right',
      minWidth: 140,
      content: ({ createdAt }) => (
        <Typography color="grey600" variant="body" noWrap>
          {intlFormatDateTimeOrgaTZ(createdAt).date}
        </Typography>
      ),
    },
  ]

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
          title: translate('text_1783622030703xtzifa6nivi'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_1783622030703gf47xn4zdit'),
          subtitle: translate('text_1783622030703a20cxlyb5xr'),
          ...(canCreateProducts && {
            buttonTitle: translate('text_1783622030703h5vhmp73muk'),
            buttonVariant: 'primary',
            buttonAction: () => openProductDrawer(),
          }),
        },
  }

  // Inset layout (per design, same as the customer subscriptions tab): the
  // wrapper owns the page gutter so the row dividers and the pager border stop
  // at it instead of running edge to edge; the table keeps only the minimal
  // 4px cell gutter.
  return (
    <div className="px-4 md:px-12">
      <div className="py-4">
        <SearchInput
          onChange={searchInputOnChange}
          placeholder={translate('text_1783622030703pw6jb43diri')}
          data-test="products-search-input"
        />
      </div>
      <PaginatedContent
        metadata={data?.products?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="products-list"
          data={data?.products?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(product) => `${product.name}`}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={composeTooltipLabel}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </div>
  )
}

export default ProductsList
