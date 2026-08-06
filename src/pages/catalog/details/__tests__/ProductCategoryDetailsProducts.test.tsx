import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { ProductForListFragment, ProductTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID,
  PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID,
  ProductCategoryDetailsProducts,
} from '../ProductCategoryDetailsProducts'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductDrawer = jest.fn()
const mockOpenDeleteProductDialog = jest.fn()
const mockUseProductsLazyQuery = jest.fn()
const mockUseProductTableColumns = jest.fn()
let mockIsLoading = false

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)
    return null
  },
}))

jest.mock('~/pages/catalog/drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenProductDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductDialog', () => ({
  useDeleteProductDialog: () => ({
    openDeleteProductDialog: mockOpenDeleteProductDialog,
  }),
}))

jest.mock('~/pages/catalog/useProductTableColumns', () => ({
  useProductTableColumns: (args: Record<string, unknown>) => mockUseProductTableColumns(args),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({ debouncedSearch: mockDebouncedSearch, isLoading: mockIsLoading }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetProductsForProductCategoryDetailsLazyQuery: (options: Record<string, unknown>) =>
    mockUseProductsLazyQuery(options),
}))

const productCategory = { id: 'prod-1', name: 'Object storage', code: 'object_storage' }

const collection = [
  { id: 'pitem-1', name: 'Seats', code: 'seats', productType: ProductTypeEnum.Fixed },
  { id: 'pitem-2', name: 'Compute', code: 'compute', productType: ProductTypeEnum.Usage },
]

const emptyQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { productCategoryIds: ['prod-1'], limit: 6 },
}

const queryStateWith = (overrides: Record<string, unknown>) => [
  jest.fn(),
  { ...emptyQueryState, ...overrides },
]

const getTableProps = () => mockTableProps.mock.calls[0][0] as TableProps<ProductForListFragment>

describe('ProductCategoryDetailsProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
    mockHasPermissions.mockReturnValue(true)
    mockUseProductsLazyQuery.mockReturnValue([jest.fn(), emptyQueryState])
    mockUseProductTableColumns.mockReturnValue([
      { key: 'name', title: 'Name', content: () => null },
    ])
  })

  describe('GIVEN no productCategory is loaded yet', () => {
    describe('WHEN the section renders', () => {
      it('THEN does not render the preview nor fire the products query', () => {
        render(<ProductCategoryDetailsProducts />)

        expect(mockUseProductsLazyQuery).not.toHaveBeenCalled()
        expect(mockTableProps).not.toHaveBeenCalled()
      })

      it('THEN hides the create product button', () => {
        render(<ProductCategoryDetailsProducts />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a loaded productCategory and the create permission', () => {
    describe('WHEN the create button is clicked', () => {
      it('THEN opens the drawer scoped to attach to the productCategory', async () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        await userEvent.click(screen.getByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID))

        expect(mockOpenProductDrawer).toHaveBeenCalledWith({
          attachToProductCategory: productCategory,
        })
      })
    })
  })

  describe('GIVEN a loaded productCategory without the create permission', () => {
    describe('WHEN the section renders', () => {
      it('THEN hides the create product button', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a loaded productCategory', () => {
    describe('WHEN the preview mounts', () => {
      it('THEN wires the query scoped to the productCategory with the preview limit and cache policy', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(mockUseProductsLazyQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({ productCategoryIds: ['prod-1'], limit: 6 }),
            notifyOnNetworkStatusChange: true,
            fetchPolicy: 'cache-and-network',
          }),
        )
      })

      it('THEN requests columns without the attached-productCategory column', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(mockUseProductTableColumns).toHaveBeenCalledWith({
          withAttachedProductCategory: false,
        })
      })
    })

    describe('WHEN there are no items and no active search', () => {
      it('THEN renders the table with the standard empty-state placeholder', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(mockTableProps).toHaveBeenCalled()
        expect(getTableProps().placeholder?.emptyState?.title).toBe('text_1783980718114bqx4jce32fv')
      })
    })

    describe('WHEN the query is loading', () => {
      it('THEN renders the table in a loading state', () => {
        mockIsLoading = true

        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(getTableProps().isLoading).toBe(true)
      })
    })

    describe('WHEN items are returned', () => {
      beforeEach(() => {
        mockUseProductsLazyQuery.mockReturnValue(
          queryStateWith({ data: { products: { metadata: { totalCount: 2 }, collection } } }),
        )
      })

      it('THEN passes the collection to the table', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(getTableProps().data).toEqual(collection)
      })

      it('THEN links each row to the product overview tab', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(getTableProps().onRowActionLink?.({ id: 'pitem-1' } as ProductForListFragment)).toBe(
          '/product-catalog/products/pitem-1/overview',
        )
      })

      it('THEN offers edit and delete row actions wired to the drawer and delete dialog', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        const product = { id: 'pitem-1', name: 'Seats' } as ProductForListFragment
        const actions = (getTableProps().actionColumn?.(product) ??
          []) as ActionItem<ProductForListFragment>[]

        expect(actions).toHaveLength(2)

        const [editAction, deleteAction] = actions

        editAction?.onAction(product)
        expect(mockOpenProductDrawer).toHaveBeenCalledWith({ product })

        deleteAction?.onAction(product)
        expect(mockOpenDeleteProductDialog).toHaveBeenCalledWith({ product })
      })

      it('THEN exposes a non-empty action column tooltip', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(typeof getTableProps().actionColumnTooltip).toBe('function')
        expect((getTableProps().actionColumnTooltip as () => string)()).toEqual(expect.any(String))
      })

      it('THEN provides an empty-state placeholder title and subtitle', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(getTableProps().placeholder).toEqual(
          expect.objectContaining({
            emptyState: expect.objectContaining({
              title: expect.any(String),
              subtitle: expect.any(String),
            }),
          }),
        )
      })

      it('THEN routes search input changes through the debounced search', () => {
        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        const { onChange } = mockSearchInputProps.mock.calls[0][0] as {
          onChange: (value: string) => void
        }

        onChange('seats')

        expect(mockDebouncedSearch).toHaveBeenCalledWith('seats')
      })
    })

    describe('WHEN there are no items but a search is active', () => {
      it('THEN renders the table with its empty search state', () => {
        mockUseProductsLazyQuery.mockReturnValue(
          queryStateWith({
            data: { products: { metadata: { totalCount: 0 }, collection: [] } },
            variables: { productCategoryIds: ['prod-1'], limit: 6, searchTerm: 'zzz' },
          }),
        )

        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(mockTableProps).toHaveBeenCalled()
        expect(getTableProps().placeholder?.emptyState?.title).toBe('text_1783980718114wya9wp01m5i')
      })
    })

    describe('WHEN the total count exceeds the preview limit', () => {
      it('THEN shows the view-all link', () => {
        mockUseProductsLazyQuery.mockReturnValue(
          queryStateWith({ data: { products: { metadata: { totalCount: 10 }, collection } } }),
        )

        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(
          screen.getByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the total count fits within the preview limit', () => {
      it('THEN hides the view-all link', () => {
        mockUseProductsLazyQuery.mockReturnValue(
          queryStateWith({ data: { products: { metadata: { totalCount: 2 }, collection } } }),
        )

        render(<ProductCategoryDetailsProducts productCategory={productCategory} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
