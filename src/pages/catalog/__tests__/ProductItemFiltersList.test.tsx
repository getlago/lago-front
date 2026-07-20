import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductItemFilterForListFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import ProductItemFiltersList, {
  PRODUCT_ITEM_FILTERS_LIST_TEST_ID,
} from '../ProductItemFiltersList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductItemFilterDrawer = jest.fn()
const mockOpenDeleteProductItemFilterDialog = jest.fn()
const mockUseProductItemFiltersLazyQuery = jest.fn()

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

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)
    return null
  },
}))

jest.mock('../drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenProductItemFilterDrawer }),
}))

jest.mock('../dialogs/useDeleteProductItemFilterDialog', () => ({
  useDeleteProductItemFilterDialog: () => ({
    openDeleteProductItemFilterDialog: mockOpenDeleteProductItemFilterDialog,
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
  useProductItemFiltersLazyQuery: (options: Record<string, unknown>) =>
    mockUseProductItemFiltersLazyQuery(options),
}))

const buildProductItemFilter = (
  overrides: Partial<ProductItemFilterForListFragment> = {},
): ProductItemFilterForListFragment => ({
  __typename: 'ProductItemFilter',
  id: 'pitem-filter-1',
  name: 'Premium seats',
  code: 'premium_seats',
  invoiceDisplayName: 'Premium seats filter',
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  productItem: {
    __typename: 'ProductItem',
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
  mockTableProps.mock.calls[0][0] as TableProps<ProductItemFilterForListFragment>

describe('ProductItemFiltersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseProductItemFiltersLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('renders the page container', () => {
    render(<ProductItemFiltersList />)

    expect(screen.getByTestId(PRODUCT_ITEM_FILTERS_LIST_TEST_ID)).toBeInTheDocument()
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<ProductItemFiltersList />)

    expect(mockUseProductItemFiltersLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('passes the fetched collection to the table', () => {
    const productItemFilter = buildProductItemFilter()

    mockUseProductItemFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        data: { productItemFilters: { collection: [productItemFilter], metadata: undefined } },
      },
    ])

    render(<ProductItemFiltersList />)

    expect(getTableProps().data).toEqual([productItemFilter])
  })

  it('renders the name, attached product item and created columns', () => {
    render(<ProductItemFiltersList />)

    const { columns } = getTableProps()

    expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
      'name',
      'productItem.name',
      'createdAt',
    ])
  })

  it('links each row to the product item filter details overview tab', () => {
    render(<ProductItemFiltersList />)

    expect(
      getTableProps().onRowActionLink?.({
        id: 'pitem-filter-1',
      } as ProductItemFilterForListFragment),
    ).toBe('/product-catalog/product-item-filters/pitem-filter-1/overview')
  })

  it('offers edit and delete row actions wired to the drawer and delete dialog', () => {
    render(<ProductItemFiltersList />)

    const productItemFilter = buildProductItemFilter()

    const actions = (getTableProps().actionColumn?.(productItemFilter) ??
      []) as ActionItem<ProductItemFilterForListFragment>[]

    expect(actions).toHaveLength(2)

    const [editAction, deleteAction] = actions

    editAction?.onAction(productItemFilter)
    expect(mockOpenProductItemFilterDrawer).toHaveBeenCalledWith({ productItemFilter })

    deleteAction?.onAction(productItemFilter)
    expect(mockOpenDeleteProductItemFilterDialog).toHaveBeenCalledWith({ productItemFilter })
  })

  it('hides both row actions without the update and delete permissions', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductItemFiltersList />)

    expect(getTableProps().actionColumn?.({} as ProductItemFilterForListFragment)).toHaveLength(0)
  })

  it('resets to page 1 before searching', () => {
    render(<ProductItemFiltersList />)

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
    render(<ProductItemFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeDefined()

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenProductItemFilterDrawer).toHaveBeenCalledTimes(1)
  })

  it('hides the create CTA without the productItemFiltersCreate permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductItemFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseProductItemFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<ProductItemFiltersList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).not.toBe(getTableProps().placeholder?.errorState?.title)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('renders an error state', () => {
    mockUseProductItemFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, error: new Error('boom') },
    ])

    render(<ProductItemFiltersList />)

    expect(getTableProps().hasError).toBe(true)
    expect(getTableProps().placeholder?.errorState?.title).toBe('text_629728388c4d2300e2d380d5')
  })

  it('uses the search variant of the error state while searching', () => {
    mockUseProductItemFiltersLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        error: new Error('boom'),
        variables: { ...defaultQueryState.variables, searchTerm: 'foo' },
      },
    ])

    render(<ProductItemFiltersList />)

    expect(getTableProps().placeholder?.errorState?.title).toBe('text_623b53fea66c76017eaebb6e')
  })
})
