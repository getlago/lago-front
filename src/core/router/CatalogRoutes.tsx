import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const ProductCatalog = lazyLoad(() => import('~/pages/catalog/ProductCatalog'))
const Plans = lazyLoad(() => import('~/pages/catalog/Plans'))

export const PRODUCT_CATALOG_ROUTE = '/product-catalog'
export const PLAN_CATALOG_ROUTE = '/plan-catalog'

export const catalogRoutes: CustomRouteObject[] = [
  {
    path: [PRODUCT_CATALOG_ROUTE],
    private: true,
    element: <ProductCatalog />,
    permissionsOr: ['productsView', 'productItemsView', 'rateCardsView'],
  },
  {
    path: [PLAN_CATALOG_ROUTE],
    private: true,
    element: <Plans />,
    permissions: ['plansView'],
  },
]
