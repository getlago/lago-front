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
import { ProductCategoryDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_CATEGORY_DETAILS_ROUTE } from '~/core/router'
import {
  ProductCategoryForDeleteProductCategoryDialogFragmentDoc,
  ProductCategoryForProductCategoryDrawerFragmentDoc,
  ProductCategoryListItemFragment,
  useProductCategoriesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductCategoryDialog } from './dialogs/useDeleteProductCategoryDialog'
import { useProductCategoryDrawer } from './drawers/productCategory/useProductCategoryDrawer'

gql`
  fragment ProductCategoryListItem on ProductCategory {
    id
    name
    code
    invoiceDisplayName
    productsCount
    createdAt
    ...ProductCategoryForProductCategoryDrawer
    ...ProductCategoryForDeleteProductCategoryDialog
  }

  query productCategories($page: Int, $limit: Int, $searchTerm: String) {
    productCategories(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...ProductCategoryListItem
      }
    }
  }

  ${ProductCategoryForProductCategoryDrawerFragmentDoc}
  ${ProductCategoryForDeleteProductCategoryDialogFragmentDoc}
`

const ProductCategoriesList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { openDrawer: openProductCategoryDrawer } = useProductCategoryDrawer()
  const { openDeleteProductCategoryDialog } = useDeleteProductCategoryDialog()
  const { page, goToPage } = usePageSearchParam()
  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProductCategories, { data, error, loading, variables }] = useProductCategoriesLazyQuery(
    {
      variables: { limit: DEFAULT_PAGE_SIZE, page },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    },
  )
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductCategories, loading)

  const canCreateProductCategories = hasPermissions(['productCategoriesCreate'])
  const canUpdateProductCategories = hasPermissions(['productCategoriesUpdate'])
  const canDeleteProductCategories = hasPermissions(['productCategoriesDelete'])

  const composeTooltipLabel = useCallback((): string => {
    const editLabel = translate('text_629728388c4d2300e2d3816a')
    const deleteLabel = translate('text_629728388c4d2300e2d38182')

    let tooltipLabel = [
      canUpdateProductCategories && editLabel.toLowerCase(),
      canDeleteProductCategories && deleteLabel.toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    tooltipLabel = tooltipLabel.charAt(0).toUpperCase() + tooltipLabel.slice(1)

    return tooltipLabel
  }, [canUpdateProductCategories, canDeleteProductCategories, translate])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
        productCategoryId: id,
        tab: ProductCategoryDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductCategoryListItemFragment> = (productCategory) => {
    const actions: ActionItem<ProductCategoryListItemFragment>[] = []

    if (canUpdateProductCategories) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductCategoryDrawer(productCategory),
      })
    }

    if (canDeleteProductCategories) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        // No callback: the dialog evicts the productCategory from the cached
        // list optimistically, so the row disappears without waiting
        // for a refetch.
        onAction: () => openDeleteProductCategoryDialog({ productCategory }),
      })
    }

    return actions
  }

  const columns: TableColumn<ProductCategoryListItemFragment>[] = [
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
      key: 'productsCount',
      title: translate('text_1783622030703zfer3z2fn5y'),
      textAlign: 'right',
      minWidth: 112,
      content: ({ productsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {productsCount}
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
          ...(canCreateProductCategories && {
            buttonTitle: translate('text_1783622030703h5vhmp73muk'),
            buttonVariant: 'primary',
            buttonAction: () => openProductCategoryDrawer(),
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
          data-test="productCategories-search-input"
        />
      </div>
      <PaginatedContent
        metadata={data?.productCategories?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="productCategories-list"
          data={data?.productCategories?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(productCategory) => `${productCategory.name}`}
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

export default ProductCategoriesList
