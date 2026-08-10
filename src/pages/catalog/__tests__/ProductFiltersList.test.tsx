import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductFilterForListFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import ProductFiltersList, { PRODUCT_ITEM_FILTERS_LIST_TEST_ID } from '../ProductFiltersList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductFilterDrawer = jest.fn()
const mockOpenDeleteProductFilterDialog = jest.fn()
const mockUseProductFiltersLazyQuery = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: 1, goToPage: mockGoToPage }),
}))

jest.mock('~/components/Filters', () => ({
  Filters: {
    Provider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Component: () => null,
  },
  formatFiltersForProductFiltersQuery: () => ({}),
  ProductFilterAvailableFilters: [],
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)
    return null
  },
}))

jest.mock('../drawers/productFilter/useProductFilterDrawer', () => ({
  useProductFilterDrawer: () => ({ openDrawer: mockOpenProductFilterDrawer }),
}))

jest.mock('../dialogs/useDeleteProductFilterDialog', () => ({
  useDeleteProductFilterDialog: () => ({
    openDeleteProductFilterDialog: mockOpenDeleteProductFilterDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 20, 2024' }),
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: mockDebouncedSearch,
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useProductFiltersLazyQuery: (options: Record<string, unknown>) =>
    mockUseProductFiltersLazyQuery(options),
}))

const buildProductFilter = (
  overrides: Partial<ProductFilterForListFragment> = {},
): ProductFilterForListFragment => ({
  __typename: 'ProductFilter',
  id: 'pitem-filter-1',
  name: 'Premium seats',
  code: 'premium_seats',
  invoiceDisplayName: 'Premium seats filter',
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    invoiceDisplayName: 'Seat charge',
    code: 'seats',
  },
  values: [],
  ...overrides,
})

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = () =>
  mockTableProps.mock.calls[0][0] as TableProps<ProductFilterForListFragment>

describe('ProductFiltersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseProductFiltersLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('renders the page container', () => {
    render(<ProductFiltersList />)

    expect(screen.getByTestId(PRODUCT_ITEM_FILTERS_LIST_TEST_ID)).toBeInTheDocument()
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<ProductFiltersList />)

    expect(mockUseProductFiltersLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('passes the fetched collection to the table', () => {
    const productFilter = buildProductFilter()

    mockUseProductFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        data: { productFilters: { collection: [productFilter], metadata: undefined } },
      },
    ])

    render(<ProductFiltersList />)

    expect(getTableProps().data).toEqual([productFilter])
  })

  it('renders the name, attached product and created columns', () => {
    render(<ProductFiltersList />)

    const { columns } = getTableProps()

    expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
      'name',
      'product.name',
      'createdAt',
    ])
  })

  it('links each row to the product filter details overview tab', () => {
    render(<ProductFiltersList />)

    expect(
      getTableProps().onRowActionLink?.({
        id: 'pitem-filter-1',
      } as ProductFilterForListFragment),
    ).toBe('/product-catalog/product-filters/pitem-filter-1/overview')
  })

  it('offers edit and delete row actions wired to the drawer and delete dialog', () => {
    render(<ProductFiltersList />)

    const productFilter = buildProductFilter()

    const actions = (getTableProps().actionColumn?.(productFilter) ??
      []) as ActionItem<ProductFilterForListFragment>[]

    expect(actions).toHaveLength(2)

    const [editAction, deleteAction] = actions

    editAction?.onAction(productFilter)
    expect(mockOpenProductFilterDrawer).toHaveBeenCalledWith({ productFilter })

    deleteAction?.onAction(productFilter)
    expect(mockOpenDeleteProductFilterDialog).toHaveBeenCalledWith({ productFilter })
  })

  it('hides both row actions without the update and delete permissions', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductFiltersList />)

    expect(getTableProps().actionColumn?.({} as ProductFilterForListFragment)).toHaveLength(0)
  })

  it('resets to page 1 before searching', () => {
    render(<ProductFiltersList />)

    const { onChange } = mockSearchInputProps.mock.calls[0][0] as {
      onChange: (value: string) => void
    }

    onChange('seats')

    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockDebouncedSearch).toHaveBeenCalledWith('seats')
    expect(mockGoToPage.mock.invocationCallOrder[0]).toBeLessThan(
      mockDebouncedSearch.mock.invocationCallOrder[0],
    )
  })

  it('offers the create-item-filter CTA in the empty state when allowed', () => {
    render(<ProductFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeDefined()

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenProductFilterDrawer).toHaveBeenCalledTimes(1)
  })

  it('hides the create CTA without the productFiltersCreate permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseProductFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<ProductFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).not.toBe(getTableProps().placeholder?.errorState?.title)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('renders an error state', () => {
    mockUseProductFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, error: new Error('boom') },
    ])

    render(<ProductFiltersList />)

    expect(getTableProps().hasError).toBe(true)
    expect(getTableProps().placeholder?.errorState?.title).toBe('text_629728388c4d2300e2d380d5')
  })

  it('uses the search variant of the error state while searching', () => {
    mockUseProductFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        error: new Error('boom'),
        variables: { ...defaultQueryState.variables, searchTerm: 'foo' },
      },
    ])

    render(<ProductFiltersList />)

    expect(getTableProps().placeholder?.errorState?.title).toBe('text_623b53fea66c76017eaebb6e')
  })
})
