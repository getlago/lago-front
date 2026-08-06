import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  ProductItemFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  PRODUCT_CATALOG_TAB_ROUTE,
  PRODUCT_ITEM_FILTER_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import {
  LagoApiError,
  ProductItemFilterForDeleteProductItemFilterDialogFragmentDoc,
  ProductItemFilterForDrawerFragmentDoc,
  useGetProductItemFilterForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import ProductItemFilterActivityLogs from './ProductItemFilterActivityLogs'
import ProductItemFilterDetailsOverview from './ProductItemFilterDetailsOverview'

import { useDeleteProductItemFilterDialog } from '../dialogs/useDeleteProductItemFilterDialog'
import { useProductItemFilterDrawer } from '../drawers/productItemFilter/useProductItemFilterDrawer'

gql`
  fragment ProductItemFilterForProductItemFilterDetails on ProductItemFilter {
    id
    ...ProductItemFilterForDrawer
    ...ProductItemFilterForDeleteProductItemFilterDialog
  }

  query getProductItemFilterForDetails($id: ID!) {
    productItemFilter(id: $id) {
      id
      ...ProductItemFilterForProductItemFilterDetails
    }
  }

  ${ProductItemFilterForDrawerFragmentDoc}
  ${ProductItemFilterForDeleteProductItemFilterDialogFragmentDoc}
`

export const PRODUCT_ITEM_FILTERS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.productItemFilters,
})

export const PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID = 'product-item-filter-details-actions'
export const PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID = 'product-item-filter-details-edit'
export const PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID = 'product-item-filter-details-delete'

const ProductItemFilterDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { productItemFilterId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductItemFilterDrawer } = useProductItemFilterDrawer()
  const { openDeleteProductItemFilterDialog } = useDeleteProductItemFilterDialog()

  const { data, loading, error } = useGetProductItemFilterForDetailsQuery({
    variables: { id: productItemFilterId as string },
    skip: !productItemFilterId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PRODUCT_ITEM_FILTERS_LIST_PATH,
    translateKey: 'text_17845891447255gl990d4ipo',
  })

  const productItemFilter = data?.productItemFilter

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID,
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID,
          hidden: !hasPermissions(['productItemFiltersUpdate']),
          onClick: (closePopper) => {
            if (productItemFilter) openEditProductItemFilterDrawer({ productItemFilter })
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID,
          hidden: !hasPermissions(['productItemFiltersDelete']),
          onClick: (closePopper) => {
            if (productItemFilter) {
              openDeleteProductItemFilterDialog({
                productItemFilter,
                callback: () => navigate(PRODUCT_ITEM_FILTERS_LIST_PATH),
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
        // closures capture `productItemFilter` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${productItemFilter?.description}|${productItemFilter?.invoiceDisplayName}|${productItemFilter?.attachedToPlanOrSubscription}`}
        breadcrumb={[
          {
            label: translate('text_1783019143196z1oi70j03vt'),
            path: PRODUCT_ITEM_FILTERS_LIST_PATH,
          },
          { label: translate('text_17845891447253jlqg3844uq') },
        ]}
        entity={{
          viewName: productItemFilter?.invoiceDisplayName || productItemFilter?.name || '',
          viewNameLoading: loading,
          metadata: productItemFilter?.code ? (
            <TypographyWithCopy variant="body">{productItemFilter.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
              productItemFilterId: productItemFilterId as string,
              tab: ProductItemFilterDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container>
                <ProductItemFilterDetailsOverview
                  productItemFilterId={productItemFilterId as string}
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1783104239825nxqno33u945'),
            link: generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
              productItemFilterId: productItemFilterId as string,
              tab: ProductItemFilterDetailsTabsOptionsEnum.rateCards,
            }),
            content: <div className="p-4">{translate('text_1783104239825nxqno33u945')}</div>,
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
              productItemFilterId: productItemFilterId as string,
              tab: ProductItemFilterDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
              productItemFilterId: productItemFilterId as string,
              tab: ProductItemFilterDetailsTabsOptionsEnum.activityLogs,
            }),
            content: (
              <DetailsPage.Container>
                <ProductItemFilterActivityLogs
                  productItemFilterId={productItemFilterId as string}
                />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export default ProductItemFilterDetails
