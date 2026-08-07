import { useEffect, useMemo } from 'react'
import { generatePath } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { ProductCatalogTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  PRODUCT_CATALOG_ROUTE,
  PRODUCT_CATALOG_TAB_ROUTE,
  useLocation,
  useNavigate,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductDrawer } from './drawers/product/useProductDrawer'
import { useProductCategoryDrawer } from './drawers/productCategory/useProductCategoryDrawer'
import { useProductFilterDrawer } from './drawers/productFilter/useProductFilterDrawer'
import {
  RATE_CARD_DRAWER_TITLE_CREATE_KEY,
  useRateCardDrawer,
} from './drawers/rateCard/useRateCardDrawer'
import ProductCategoriesList from './ProductCategoriesList'
import ProductFiltersList from './ProductFiltersList'
import ProductsList from './ProductsList'
import RateCardsList from './RateCardsList'

export const PRODUCT_CATALOG_CREATE_TEST_ID = 'product-catalog-create'
export const CREATE_PRODUCT_TEST_ID = 'create-productCategory'
export const CREATE_PRODUCT_ITEM_TEST_ID = 'create-product-item'
export const CREATE_PRODUCT_ITEM_FILTER_TEST_ID = 'create-product-item-filter'
export const CREATE_RATE_CARD_TEST_ID = 'create-rate-card'

const ProductCatalog = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openCreateProductCategoryDrawer } = useProductCategoryDrawer()
  const { openDrawer: openCreateProductDrawer } = useProductDrawer()
  const { openDrawer: openCreateProductFilterDrawer } = useProductFilterDrawer()
  const { openDrawer: openCreateRateCardDrawer } = useRateCardDrawer()

  const tabs = useMemo(
    () => [
      {
        title: translate('text_17831042398244jk9iv71lra'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.productCategories,
        }),
        match: [
          PRODUCT_CATALOG_ROUTE,
          generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
            tab: ProductCatalogTabsOptionsEnum.productCategories,
          }),
        ],
        content: <ProductCategoriesList />,
        hidden: !hasPermissions(['productCategoriesView']),
      },
      {
        title: translate('text_17831042398250iwa2xp8pba'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.products,
        }),
        content: <ProductsList />,
        hidden: !hasPermissions(['productsView']),
      },
      {
        title: translate('text_1783104239825gamldgumtq0'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.productFilters,
        }),
        content: <ProductFiltersList />,
        hidden: !hasPermissions(['productFiltersView']),
      },
      {
        title: translate('text_1783104239825nxqno33u945'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.rateCards,
        }),
        content: <RateCardsList />,
        hidden: !hasPermissions(['rateCardsView']),
      },
    ],
    [translate, hasPermissions],
  )

  // Landing on the bare base route redirects to the first tab the user can view.
  const firstVisibleTabLink = tabs.find((tab) => !tab.hidden)?.link

  useEffect(() => {
    if (pathname === PRODUCT_CATALOG_ROUTE && firstVisibleTabLink) {
      navigate(firstVisibleTabLink, { replace: true })
    }
  }, [pathname, navigate, firstVisibleTabLink])

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        entity={{ viewName: translate('text_1783019143196z1oi70j03vt') }}
        tabs={tabs}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_1742230191029lznwj3y41nb'),
              dataTest: PRODUCT_CATALOG_CREATE_TEST_ID,
              items: [
                {
                  label: translate('text_1783622030703h5vhmp73muk'),
                  hidden: !hasPermissions(['productCategoriesCreate']),
                  dataTest: CREATE_PRODUCT_TEST_ID,
                  onClick: (closePopper) => {
                    openCreateProductCategoryDrawer()
                    closePopper()
                  },
                },
                {
                  label: translate('text_1783622030703m9jlurg4jsn'),
                  hidden: !hasPermissions(['productsCreate']),
                  dataTest: CREATE_PRODUCT_ITEM_TEST_ID,
                  onClick: (closePopper) => {
                    openCreateProductDrawer()
                    closePopper()
                  },
                },
                {
                  label: translate('text_17836220307039rf790f045t'),
                  hidden: !hasPermissions(['productFiltersCreate']),
                  dataTest: CREATE_PRODUCT_ITEM_FILTER_TEST_ID,
                  onClick: (closePopper) => {
                    openCreateProductFilterDrawer()
                    closePopper()
                  },
                },
                {
                  label: translate(RATE_CARD_DRAWER_TITLE_CREATE_KEY),
                  hidden: !hasPermissions(['rateCardsCreate']),
                  dataTest: CREATE_RATE_CARD_TEST_ID,
                  onClick: (closePopper) => {
                    openCreateRateCardDrawer()
                    closePopper()
                  },
                },
              ],
            },
          ],
        }}
      />
      {activeTabContent}
    </>
  )
}

export default ProductCatalog
