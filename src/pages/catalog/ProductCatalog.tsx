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
import { useProductItemDrawer } from './drawers/productItem/useProductItemDrawer'
import { useProductItemFilterDrawer } from './drawers/productItemFilter/useProductItemFilterDrawer'
import ProductItemFiltersList from './ProductItemFiltersList'
import ProductItemsList from './ProductItemsList'
import ProductsList from './ProductsList'
import RateCardsList from './RateCardsList'

const ProductCatalog = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openCreateProductDrawer } = useProductDrawer()
  const { openDrawer: openCreateProductItemDrawer } = useProductItemDrawer()
  const { openDrawer: openCreateProductItemFilterDrawer } = useProductItemFilterDrawer()

  const tabs = useMemo(
    () => [
      {
        title: translate('text_17831042398244jk9iv71lra'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.products,
        }),
        match: [
          PRODUCT_CATALOG_ROUTE,
          generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
            tab: ProductCatalogTabsOptionsEnum.products,
          }),
        ],
        content: <ProductsList />,
        hidden: !hasPermissions(['productsView']),
      },
      {
        title: translate('text_17831042398250iwa2xp8pba'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.productItems,
        }),
        content: <ProductItemsList />,
        hidden: !hasPermissions(['productItemsView']),
      },
      {
        title: translate('text_1783104239825gamldgumtq0'),
        link: generatePath(PRODUCT_CATALOG_TAB_ROUTE, {
          tab: ProductCatalogTabsOptionsEnum.productItemFilters,
        }),
        content: <ProductItemFiltersList />,
        hidden: !hasPermissions(['productItemFiltersView']),
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
              dataTest: 'product-catalog-create',
              items: [
                {
                  label: translate('text_1783622030703h5vhmp73muk'),
                  hidden: !hasPermissions(['productsCreate']),
                  dataTest: 'create-product',
                  onClick: (closePopper) => {
                    openCreateProductDrawer()
                    closePopper()
                  },
                },
                {
                  label: translate('text_1783622030703m9jlurg4jsn'),
                  hidden: !hasPermissions(['productItemsCreate']),
                  dataTest: 'create-product-item',
                  onClick: (closePopper) => {
                    openCreateProductItemDrawer()
                    closePopper()
                  },
                },
                {
                  label: translate('text_17836220307039rf790f045t'),
                  hidden: !hasPermissions(['productItemFiltersCreate']),
                  dataTest: 'create-product-item-filter',
                  onClick: (closePopper) => {
                    openCreateProductItemFilterDrawer()
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
