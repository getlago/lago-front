import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'

import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  ProductCatalogTabsOptionsEnum,
  ProductFilterDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { PRODUCT_CATALOG_TAB_ROUTE, PRODUCT_FILTER_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  LagoApiError,
  ProductFilterForDeleteProductFilterDialogFragmentDoc,
  ProductFilterForDrawerFragmentDoc,
  RateCardForPreviewProductFilterFragmentDoc,
  useGetProductFilterForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import { usePermissions } from '~/hooks/usePermissions'

import ProductFilterActivityLogs from './ProductFilterActivityLogs'
import ProductFilterDetailsOverview from './ProductFilterDetailsOverview'
import RateCardPreview from './RateCardPreview'

import { useDeleteProductFilterDialog } from '../dialogs/useDeleteProductFilterDialog'
import { useProductFilterDrawer } from '../drawers/productFilter/useProductFilterDrawer'

gql`
  fragment ProductFilterForProductFilterDetails on ProductFilter {
    id
    ...RateCardForPreviewProductFilter
    ...ProductFilterForDrawer
    ...ProductFilterForDeleteProductFilterDialog
  }

  query getProductFilterForDetails($id: ID!) {
    productFilter(id: $id) {
      id
      ...ProductFilterForProductFilterDetails
    }
  }

  ${RateCardForPreviewProductFilterFragmentDoc}
  ${ProductFilterForDrawerFragmentDoc}
  ${ProductFilterForDeleteProductFilterDialogFragmentDoc}
`

const PRODUCT_ITEM_FILTERS_LIST_PATH = generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
  tab: ProductCatalogTabsOptionsEnum.productFilters,
})

export const PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID = 'product-item-filter-details-actions'
export const PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID = 'product-item-filter-details-edit'
export const PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID = 'product-item-filter-details-delete'

const ProductFilterDetails = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { productFilterId } = useParams()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openEditProductFilterDrawer } = useProductFilterDrawer()
  const { openDeleteProductFilterDialog } = useDeleteProductFilterDialog()

  const { data, loading, error } = useGetProductFilterForDetailsQuery({
    variables: { id: productFilterId as string },
    skip: !productFilterId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useNotFoundRedirect({
    error,
    loading,
    redirectTo: PRODUCT_ITEM_FILTERS_LIST_PATH,
    translateKey: 'text_17845891447255gl990d4ipo',
  })

  const productFilter = data?.productFilter

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID,
      items: [
        {
          label: translate('text_625fd39a15394c0117e7d792'),
          dataTest: PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID,
          hidden: !hasPermissions(['productFiltersUpdate']),
          onClick: (closePopper) => {
            if (productFilter) openEditProductFilterDrawer({ productFilter })
            closePopper()
          },
        },
        {
          label: translate('text_629728388c4d2300e2d38182'),
          dataTest: PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID,
          hidden: !hasPermissions(['productFiltersDelete']),
          onClick: (closePopper) => {
            if (productFilter) {
              openDeleteProductFilterDialog({
                productFilter,
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
        // closures capture `productFilter` from the last push. Encode the mutable
        // fields the closures depend on (but that the header does not display)
        // so an edit touching only those re-pushes fresh closures.
        snapshotKey={`${productFilter?.description}|${productFilter?.invoiceDisplayName}|${productFilter?.attachedToPlanOrSubscription}`}
        breadcrumb={[
          {
            label: translate('text_1783019143196z1oi70j03vt'),
            path: PRODUCT_ITEM_FILTERS_LIST_PATH,
          },
          { label: translate('text_17845891447253jlqg3844uq') },
        ]}
        entity={{
          viewName: productFilter?.invoiceDisplayName || productFilter?.name || '',
          viewNameLoading: loading,
          metadata: productFilter?.code ? (
            <TypographyWithCopy variant="body">{productFilter.code}</TypographyWithCopy>
          ) : undefined,
          metadataLoading: loading,
        }}
        actions={{ items: actions, loading }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
              productFilterId: productFilterId as string,
              tab: ProductFilterDetailsTabsOptionsEnum.overview,
            }),
            content: (
              <DetailsPage.Container className="pt-6">
                <ProductFilterDetailsOverview productFilterId={productFilterId as string} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1783104239825nxqno33u945'),
            link: generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
              productFilterId: productFilterId as string,
              tab: ProductFilterDetailsTabsOptionsEnum.rateCards,
            }),
            content: productFilter ? (
              <DetailsPage.Container className="pt-6">
                <RateCardPreview scope={{ productFilter }} />
              </DetailsPage.Container>
            ) : null,
          },
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            link: generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
              productFilterId: productFilterId as string,
              tab: ProductFilterDetailsTabsOptionsEnum.plans,
            }),
            content: <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>,
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
              productFilterId: productFilterId as string,
              tab: ProductFilterDetailsTabsOptionsEnum.activityLogs,
            }),
            content: (
              <DetailsPage.Container className="pt-6">
                <ProductFilterActivityLogs productFilterId={productFilterId as string} />
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

export default ProductFilterDetails
