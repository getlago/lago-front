import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const ProductCatalog = lazyLoad(() => import('~/pages/catalog/ProductCatalog'))
const ProductDetails = lazyLoad(() => import('~/pages/catalog/details/ProductDetails'))
const Plans = lazyLoad(() => import('~/pages/catalog/Plans'))

export const PRODUCT_CATALOG_ROUTE = '/product-catalog'
export const PRODUCT_CATALOG_TAB_ROUTE = '/product-catalog/:tab'
export const PRODUCT_DETAILS_ROUTE = '/product-catalog/products/:productId/:tab'
export const PLAN_PRICING_ROUTE = '/plan-pricing'

export const catalogRoutes: CustomRouteObject[] = [
  {
    path: [PRODUCT_DETAILS_ROUTE],
    private: true,
    element: <ProductDetails />,
    permissions: ['productsView'],
  },
  {
    path: [PRODUCT_CATALOG_ROUTE, PRODUCT_CATALOG_TAB_ROUTE],
    private: true,
    element: <ProductCatalog />,
    permissionsOr: ['productsView', 'productItemsView', 'productItemFiltersView', 'rateCardsView'],
  },
  {
    path: [PLAN_PRICING_ROUTE],
    private: true,
    element: <Plans />,
    permissions: ['plansView'],
  },
]
