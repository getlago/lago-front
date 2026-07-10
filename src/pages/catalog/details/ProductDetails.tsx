import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  ProductDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE, PRODUCT_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  LagoApiError,
  ProductForDeleteProductDialogFragmentDoc,
  ProductForProductDrawerFragmentDoc,
  useGetProductForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import { ProductDetailsOverview } from './ProductDetailsOverview'

import { useDeleteProductDialog } from '../dialogs/useDeleteProductDialog'
import { useProductDrawer } from '../drawers/product/useProductDrawer'

gql`
  fragment ProductForProductDetails on Product {
    id
    name
    code
    ...ProductForProductDrawer
    ...ProductForDeleteProductDialog
  }

  query getProductForDetails($id: ID!) {
    product(id: $id) {
      id
      ...ProductForProductDetails
    }
  }

  ${ProductForProductDrawerFragmentDoc}
  ${ProductForDeleteProductDialogFragmentDoc}
`

const PRODUCTS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.products,
})

const ProductDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { productId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductDrawer } = useProductDrawer()
  const { openDeleteProductDialog } = useDeleteProductDialog()

  const { data, loading, error } = useGetProductForDetailsQuery({
    variables: { id: productId as string },
    skip: !productId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PRODUCTS_LIST_PATH,
    translateKey: 'text_1783627031283wmx6cxubagw',
  })

  const product = data?.product

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: 'product-details-actions',
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: 'product-details-edit',
          hidden: !hasPermissions(['productsUpdate']),
          onClick: (closePopper) => {
            if (product) openEditProductDrawer(product)
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: 'product-details-delete',
          hidden: !hasPermissions(['productsDelete']),
          onClick: (closePopper) => {
            if (product) {
              openDeleteProductDialog({
                product,
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
        // closures capture `product` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${product?.description}|${product?.invoiceDisplayName}|${product?.attachedToPlanOrSubscription}`}
        breadcrumb={[
          { label: translate('text_1783019143196z1oi70j03vt'), path: PRODUCTS_LIST_PATH },
          { label: translate('text_1783020794399ai60io2ufkg') },
        ]}
        entity={{
          viewName: product?.name || '',
          viewNameLoading: loading,
          metadata: product?.code,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PRODUCT_DETAILS_ROUTE, {
              productId: productId as string,
              tab: ProductDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                <ProductDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_17831042398250iwa2xp8pba'),
            link: generatePath(PRODUCT_DETAILS_ROUTE, {
              productId: productId as string,
              tab: ProductDetailsTabsOptionsEnum.productItems,
            }),
            content: <div className="p-4">{translate('text_17831042398250iwa2xp8pba')}</div>,
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(PRODUCT_DETAILS_ROUTE, {
              productId: productId as string,
              tab: ProductDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PRODUCT_DETAILS_ROUTE, {
              productId: productId as string,
              tab: ProductDetailsTabsOptionsEnum.activityLogs,
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

export default ProductDetails
