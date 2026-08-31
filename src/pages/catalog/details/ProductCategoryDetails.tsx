import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  ProductCategoryDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  PRODUCT_CATALOG_TAB_ROUTE,
  PRODUCT_CATEGORY_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  LagoApiError,
  ProductCategoryForDeleteProductCategoryDialogFragmentDoc,
  ProductCategoryForProductCategoryDrawerFragmentDoc,
  useGetProductCategoryForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import { ProductCategoryDetailsOverview } from './ProductCategoryDetailsOverview'
import { ProductCategoryDetailsProducts } from './ProductCategoryDetailsProducts'

import { useDeleteProductCategoryDialog } from '../dialogs/useDeleteProductCategoryDialog'
import { useProductCategoryDrawer } from '../drawers/productCategory/useProductCategoryDrawer'

gql`
  fragment ProductCategoryForProductCategoryDetails on ProductCategory {
    id
    name
    code
    ...ProductCategoryForProductCategoryDrawer
    ...ProductCategoryForDeleteProductCategoryDialog
  }

  query getProductCategoryForDetails($id: ID!) {
    productCategory(id: $id) {
      id
      ...ProductCategoryForProductCategoryDetails
    }
  }

  ${ProductCategoryForProductCategoryDrawerFragmentDoc}
  ${ProductCategoryForDeleteProductCategoryDialogFragmentDoc}
`

const PRODUCTS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.productCategories,
})

const ProductCategoryDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { productCategoryId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductCategoryDrawer } = useProductCategoryDrawer()
  const { openDeleteProductCategoryDialog } = useDeleteProductCategoryDialog()

  const { data, loading, error } = useGetProductCategoryForDetailsQuery({
    variables: { id: productCategoryId as string },
    skip: !productCategoryId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PRODUCTS_LIST_PATH,
    translateKey: 'text_1783627031283wmx6cxubagw',
  })

  const productCategory = data?.productCategory

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: 'product-details-actions',
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: 'product-details-edit',
          hidden: !hasPermissions(['productCategoriesUpdate']),
          onClick: (closePopper) => {
            if (productCategory) openEditProductCategoryDrawer(productCategory)
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: 'product-details-delete',
          hidden: !hasPermissions(['productCategoriesDelete']),
          onClick: (closePopper) => {
            if (productCategory) {
              openDeleteProductCategoryDialog({
                productCategory,
                callback: () => navigate(PRODUCTS_LIST_PATH),
              })
            }
            closePopper()
          },
        },
      ],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        // The MainHeader config snapshot strips functions, so the action
        // closures capture `productCategory` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${productCategory?.description}|${productCategory?.invoiceDisplayName}|${productCategory?.attachedToPlanOrSubscription}`}
        breadcrumb={[
          { label: translate('text_1783019143196z1oi70j03vt'), path: PRODUCTS_LIST_PATH },
          { label: translate('text_1783020794399ai60io2ufkg') },
        ]}
        entity={{
          viewName: productCategory?.name || '',
          viewNameLoading: loading,
          metadata: productCategory?.code ? (
            <TypographyWithCopy variant="body">{productCategory.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
              productCategoryId: productCategoryId as string,
              tab: ProductCategoryDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container className="pt-6">
                <ProductCategoryDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_17831042398250iwa2xp8pba'),
            link: generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
              productCategoryId: productCategoryId as string,
              tab: ProductCategoryDetailsTabsOptionsEnum.products,
            }),
            content: (
              <DetailsPage.Container className="pt-6">
                <ProductCategoryDetailsProducts
                  productCategory={
                    productCategory
                      ? {
                          id: productCategory.id,
                          name: productCategory.name,
                          code: productCategory.code,
                        }
                      : undefined
                  }
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
              productCategoryId: productCategoryId as string,
              tab: ProductCategoryDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
              productCategoryId: productCategoryId as string,
              tab: ProductCategoryDetailsTabsOptionsEnum.activityLogs,
            }),
            content: <div className="p-4">{translate('text_1747314141347qq6rasuxisl')}</div>,
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default ProductCategoryDetails
