import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  ProductItemDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE, PRODUCT_ITEM_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  LagoApiError,
  ProductItemForDeleteProductItemDialogFragmentDoc,
  ProductItemForDrawerFragmentDoc,
  useGetProductItemForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import { ProductItemDetailsOverview } from './ProductItemDetailsOverview'
import ProductItemFilterPreview from './ProductItemFilterPreview'

import { useDeleteProductItemDialog } from '../dialogs/useDeleteProductItemDialog'
import { useProductItemDrawer } from '../drawers/productItem/useProductItemDrawer'

gql`
  fragment ProductItemForProductItemDetails on ProductItem {
    id
    name
    code
    billableMetric {
      id
      filters {
        id
      }
    }
    ...ProductItemForDrawer
    ...ProductItemForDeleteProductItemDialog
  }

  query getProductItemForDetails($id: ID!) {
    productItem(id: $id) {
      id
      ...ProductItemForProductItemDetails
    }
  }

  ${ProductItemForDrawerFragmentDoc}
  ${ProductItemForDeleteProductItemDialogFragmentDoc}
`

const PRODUCT_ITEMS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.productItems,
})

const ProductItemDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { productItemId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductItemDrawer } = useProductItemDrawer()
  const { openDeleteProductItemDialog } = useDeleteProductItemDialog()

  const { data, loading, error } = useGetProductItemForDetailsQuery({
    variables: { id: productItemId as string },
    skip: !productItemId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PRODUCT_ITEMS_LIST_PATH,
    translateKey: 'text_1783980718114522760cy1qb',
  })

  const productItem = data?.productItem

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: 'product-item-details-actions',
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: 'product-item-details-edit',
          hidden: !hasPermissions(['productItemsUpdate']),
          onClick: (closePopper) => {
            if (productItem) openEditProductItemDrawer({ productItem })
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: 'product-item-details-delete',
          hidden: !hasPermissions(['productItemsDelete']),
          onClick: (closePopper) => {
            if (productItem) {
              openDeleteProductItemDialog({
                productItem,
                callback: () => navigate(PRODUCT_ITEMS_LIST_PATH),
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
        // closures capture `productItem` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${productItem?.description}|${productItem?.invoiceDisplayName}|${productItem?.attachedToPlanOrSubscription}`}
        breadcrumb={[
          { label: translate('text_1783019143196z1oi70j03vt'), path: PRODUCT_ITEMS_LIST_PATH },
          { label: translate('text_1783980718114nwd34e3ji77') },
        ]}
        entity={{
          viewName: productItem?.name || '',
          viewNameLoading: loading,
          metadata: productItem?.code ? (
            <TypographyWithCopy variant="body">{productItem.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
              productItemId: productItemId as string,
              tab: ProductItemDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                <ProductItemDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1783104239825nxqno33u945'),
            link: generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
              productItemId: productItemId as string,
              tab: ProductItemDetailsTabsOptionsEnum.rateCards,
            }),
            content: <div className="p-4">{translate('text_1783104239825nxqno33u945')}</div>,
          },
          {
            title: translate('text_1783980718114wkor6aysepe'),
            link: generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
              productItemId: productItemId as string,
              tab: ProductItemDetailsTabsOptionsEnum.itemFilters,
            }),
            content: productItem ? (
              <DetailsPage.Container>
                <ProductItemFilterPreview productItem={productItem} />
              </DetailsPage.Container>
            ) : null,
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
              productItemId: productItemId as string,
              tab: ProductItemDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
              productItemId: productItemId as string,
              tab: ProductItemDetailsTabsOptionsEnum.activityLogs,
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

export default ProductItemDetails
