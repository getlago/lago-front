import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const ProductCatalog = lazyLoad(() => import('~/pages/catalog/ProductCatalog'))
const ProductCategoryDetails = lazyLoad(
  () => import('~/pages/catalog/details/ProductCategoryDetails'),
)
const ProductDetails = lazyLoad(() => import('~/pages/catalog/details/ProductDetails'))
const ProductFilterDetails = lazyLoad(() => import('~/pages/catalog/details/ProductFilterDetails'))
const RateCardDetails = lazyLoad(() => import('~/pages/catalog/details/RateCardDetails'))
const Plans = lazyLoad(() => import('~/pages/catalog/Plans'))

export const PRODUCT_CATALOG_ROUTE = '/product-catalog'
export const PRODUCT_CATALOG_TAB_ROUTE = '/product-catalog/:tab'
export const PRODUCT_CATEGORY_DETAILS_ROUTE =
  '/product-catalog/product-categories/:productCategoryId/:tab'
export const PRODUCT_DETAILS_ROUTE = '/product-catalog/products/:productId/:tab'
export const PRODUCT_FILTER_DETAILS_ROUTE = '/product-catalog/product-filters/:productFilterId/:tab'
export const RATE_CARD_DETAILS_ROUTE = '/product-catalog/rate-cards/:rateCardId/:tab'
export const PLAN_PRICING_ROUTE = '/plan-pricing'

export const catalogRoutes: CustomRouteObject[] = [
  {
    path: [PRODUCT_CATEGORY_DETAILS_ROUTE],
    private: true,
    element: <ProductCategoryDetails />,
    permissions: ['productCategoriesView'],
  },
  {
    path: [PRODUCT_DETAILS_ROUTE],
    private: true,
    element: <ProductDetails />,
    permissions: ['productsView'],
  },
  {
    path: [PRODUCT_FILTER_DETAILS_ROUTE],
    private: true,
    element: <ProductFilterDetails />,
    permissions: ['productFiltersView'],
  },
  {
    path: RATE_CARD_DETAILS_ROUTE,
    private: true,
    element: <RateCardDetails />,
    permissions: ['rateCardsView'],
  },
  {
    path: [PRODUCT_CATALOG_ROUTE, PRODUCT_CATALOG_TAB_ROUTE],
    private: true,
    element: <ProductCatalog />,
    permissionsOr: ['productCategoriesView', 'productsView', 'productFiltersView', 'rateCardsView'],
  },
  {
    path: [PLAN_PRICING_ROUTE],
    private: true,
    element: <Plans />,
    permissions: ['plansView'],
  },
]
