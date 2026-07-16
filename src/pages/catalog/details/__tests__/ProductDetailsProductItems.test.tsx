import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { ProductItemForListFragment, ProductItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID,
  PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID,
  PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID,
  ProductDetailsProductItems,
} from '../ProductDetailsProductItems'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductItemDrawer = jest.fn()
const mockOpenDeleteProductItemDialog = jest.fn()
const mockUseProductItemsLazyQuery = jest.fn()
const mockUseProductItemTableColumns = jest.fn()
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

jest.mock('~/pages/catalog/drawers/productItem/useProductItemDrawer', () => ({
  useProductItemDrawer: () => ({ openDrawer: mockOpenProductItemDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductItemDialog', () => ({
  useDeleteProductItemDialog: () => ({
    openDeleteProductItemDialog: mockOpenDeleteProductItemDialog,
  }),
}))

jest.mock('~/pages/catalog/useProductItemTableColumns', () => ({
  useProductItemTableColumns: (args: Record<string, unknown>) =>
    mockUseProductItemTableColumns(args),
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
  useGetProductItemsForProductDetailsLazyQuery: (options: Record<string, unknown>) =>
    mockUseProductItemsLazyQuery(options),
}))

const product = { id: 'prod-1', name: 'Object storage', code: 'object_storage' }

const collection = [
  { id: 'pitem-1', name: 'Seats', code: 'seats', itemType: ProductItemTypeEnum.Fixed },
  { id: 'pitem-2', name: 'Compute', code: 'compute', itemType: ProductItemTypeEnum.Usage },
]

const emptyQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { productIds: ['prod-1'], limit: 6 },
}

const queryStateWith = (overrides: Record<string, unknown>) => [
  jest.fn(),
  { ...emptyQueryState, ...overrides },
]

const getTableProps = () =>
  mockTableProps.mock.calls[0][0] as TableProps<ProductItemForListFragment>

describe('ProductDetailsProductItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
    mockHasPermissions.mockReturnValue(true)
    mockUseProductItemsLazyQuery.mockReturnValue([jest.fn(), emptyQueryState])
    mockUseProductItemTableColumns.mockReturnValue([
      { key: 'name', title: 'Name', content: () => null },
    ])
  })

  describe('GIVEN no product is loaded yet', () => {
    describe('WHEN the section renders', () => {
      it('THEN does not render the preview nor fire the product items query', () => {
        render(<ProductDetailsProductItems />)

        expect(mockUseProductItemsLazyQuery).not.toHaveBeenCalled()
        expect(
          screen.queryByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN hides the create product item button', () => {
        render(<ProductDetailsProductItems />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a loaded product and the create permission', () => {
    describe('WHEN the create button is clicked', () => {
      it('THEN opens the drawer scoped to attach to the product', async () => {
        render(<ProductDetailsProductItems product={product} />)

        await userEvent.click(screen.getByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID))

        expect(mockOpenProductItemDrawer).toHaveBeenCalledWith({ attachToProduct: product })
      })
    })
  })

  describe('GIVEN a loaded product without the create permission', () => {
    describe('WHEN the section renders', () => {
      it('THEN hides the create product item button', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<ProductDetailsProductItems product={product} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_ADD_PRODUCT_ITEM_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a loaded product', () => {
    describe('WHEN the preview mounts', () => {
      it('THEN wires the query scoped to the product with the preview limit and cache policy', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(mockUseProductItemsLazyQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({ productIds: ['prod-1'], limit: 6 }),
            notifyOnNetworkStatusChange: true,
            fetchPolicy: 'cache-and-network',
          }),
        )
      })

      it('THEN requests columns without the attached-product column', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(mockUseProductItemTableColumns).toHaveBeenCalledWith({ withAttachedProduct: false })
      })
    })

    describe('WHEN there are no items and no active search', () => {
      it('THEN shows the compact empty placeholder instead of the table', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(screen.getByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID)).toBeInTheDocument()
        expect(mockTableProps).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the query is loading', () => {
      it('THEN renders the table in a loading state rather than the placeholder', () => {
        mockIsLoading = true

        render(<ProductDetailsProductItems product={product} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID),
        ).not.toBeInTheDocument()
        expect(getTableProps().isLoading).toBe(true)
      })
    })

    describe('WHEN items are returned', () => {
      beforeEach(() => {
        mockUseProductItemsLazyQuery.mockReturnValue(
          queryStateWith({ data: { productItems: { metadata: { totalCount: 2 }, collection } } }),
        )
      })

      it('THEN passes the collection to the table', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(getTableProps().data).toEqual(collection)
      })

      it('THEN links each row to the product item overview tab', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(
          getTableProps().onRowActionLink?.({ id: 'pitem-1' } as ProductItemForListFragment),
        ).toBe('/product-catalog/product-items/pitem-1/overview')
      })

      it('THEN offers edit and delete row actions wired to the drawer and delete dialog', () => {
        render(<ProductDetailsProductItems product={product} />)

        const productItem = { id: 'pitem-1', name: 'Seats' } as ProductItemForListFragment
        const actions = (getTableProps().actionColumn?.(productItem) ??
          []) as ActionItem<ProductItemForListFragment>[]

        expect(actions).toHaveLength(2)

        const [editAction, deleteAction] = actions

        editAction?.onAction(productItem)
        expect(mockOpenProductItemDrawer).toHaveBeenCalledWith({ productItem })

        deleteAction?.onAction(productItem)
        expect(mockOpenDeleteProductItemDialog).toHaveBeenCalledWith({ productItem })
      })

      it('THEN exposes a non-empty action column tooltip', () => {
        render(<ProductDetailsProductItems product={product} />)

        expect(typeof getTableProps().actionColumnTooltip).toBe('function')
        expect((getTableProps().actionColumnTooltip as () => string)()).toEqual(expect.any(String))
      })

      it('THEN provides an empty-state placeholder title and subtitle', () => {
        render(<ProductDetailsProductItems product={product} />)

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
        render(<ProductDetailsProductItems product={product} />)

        const { onChange } = mockSearchInputProps.mock.calls[0][0] as {
          onChange: (value: string) => void
        }

        onChange('seats')

        expect(mockDebouncedSearch).toHaveBeenCalledWith('seats')
      })
    })

    describe('WHEN there are no items but a search is active', () => {
      it('THEN renders the table with its empty search state instead of the placeholder', () => {
        mockUseProductItemsLazyQuery.mockReturnValue(
          queryStateWith({
            data: { productItems: { metadata: { totalCount: 0 }, collection: [] } },
            variables: { productIds: ['prod-1'], limit: 6, searchTerm: 'zzz' },
          }),
        )

        render(<ProductDetailsProductItems product={product} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_EMPTY_TEST_ID),
        ).not.toBeInTheDocument()
        expect(mockTableProps).toHaveBeenCalled()
      })
    })

    describe('WHEN the total count exceeds the preview limit', () => {
      it('THEN shows the view-all link', () => {
        mockUseProductItemsLazyQuery.mockReturnValue(
          queryStateWith({ data: { productItems: { metadata: { totalCount: 10 }, collection } } }),
        )

        render(<ProductDetailsProductItems product={product} />)

        expect(
          screen.getByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the total count fits within the preview limit', () => {
      it('THEN hides the view-all link', () => {
        mockUseProductItemsLazyQuery.mockReturnValue(
          queryStateWith({ data: { productItems: { metadata: { totalCount: 2 }, collection } } }),
        )

        render(<ProductDetailsProductItems product={product} />)

        expect(
          screen.queryByTestId(PRODUCT_DETAILS_PRODUCT_ITEMS_VIEW_ALL_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
