import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductForListFragment, ProductTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import ProductsList from '../ProductsList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductDrawer = jest.fn()
const mockOpenDeleteProductDialog = jest.fn()
const mockUseProductsLazyQuery = jest.fn()

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
  formatFiltersForProductsQuery: () => ({}),
  ProductAvailableFilters: [],
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)
    return null
  },
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

jest.mock('../drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenProductDrawer }),
}))

jest.mock('../dialogs/useDeleteProductDialog', () => ({
  useDeleteProductDialog: () => ({
    openDeleteProductDialog: mockOpenDeleteProductDialog,
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
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jun 11, 2024' }),
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
  useProductsLazyQuery: (options: Record<string, unknown>) => mockUseProductsLazyQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = () => mockTableProps.mock.calls[0][0] as TableProps<ProductForListFragment>

describe('ProductsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseProductsLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<ProductsList />)

    expect(mockUseProductsLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ limit: DEFAULT_PAGE_SIZE, page: 1 }),
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('renders name, attached productCategory, filters count, item type and creation date columns', () => {
    render(<ProductsList />)

    const { columns } = getTableProps()

    expect(columns).toHaveLength(5)
    expect(columns[0]).toEqual(expect.objectContaining({ key: 'name', maxSpace: true }))
    expect(columns[1]).toEqual(expect.objectContaining({ key: 'productCategory.name' }))
    expect(columns[2]).toEqual(expect.objectContaining({ key: 'filtersCount', textAlign: 'right' }))
    expect(columns[3]).toEqual(expect.objectContaining({ key: 'productType' }))
    expect(columns[4]).toEqual(expect.objectContaining({ key: 'createdAt', textAlign: 'right' }))
  })

  it('shows the attached productCategory name or a dash', () => {
    render(<ProductsList />)

    const productCategoryColumn = getTableProps().columns[1]

    render(
      <>
        {productCategoryColumn?.content({
          productCategory: { id: 'p1', name: 'Object storage', code: 'object_storage' },
        } as ProductForListFragment)}
      </>,
    )
    expect(screen.getByText('Object storage')).toBeInTheDocument()

    render(
      <>{productCategoryColumn?.content({ productCategory: null } as ProductForListFragment)}</>,
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('links each row to the productCategory item details overview tab', () => {
    render(<ProductsList />)

    expect(getTableProps().onRowActionLink?.({ id: 'pitem-1' } as ProductForListFragment)).toBe(
      '/product-catalog/products/pitem-1/overview',
    )
  })

  it('offers edit and delete row actions wired to the drawer and delete dialog', () => {
    render(<ProductsList />)

    const product = {
      id: 'pitem-1',
      name: 'Seats',
      productType: ProductTypeEnum.Fixed,
    } as ProductForListFragment

    const actions = (getTableProps().actionColumn?.(product) ??
      []) as ActionItem<ProductForListFragment>[]

    expect(actions).toHaveLength(2)

    const [editAction, deleteAction] = actions

    editAction?.onAction(product)
    expect(mockOpenProductDrawer).toHaveBeenCalledWith({ product })

    deleteAction?.onAction(product)
    expect(mockOpenDeleteProductDialog).toHaveBeenCalledWith({ product })
  })

  it('hides both row actions without the update and delete permissions', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductsList />)

    expect(getTableProps().actionColumn?.({} as ProductForListFragment)).toHaveLength(0)
  })

  it('resets to page 1 before searching', () => {
    render(<ProductsList />)

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

  it('offers the create-product-item CTA in the empty state when allowed', () => {
    render(<ProductsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783980718114bqx4jce32fv')
    expect(placeholder?.emptyState?.buttonTitle).toBe('text_1783622030703m9jlurg4jsn')

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenProductDrawer).toHaveBeenCalledTimes(1)
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseProductsLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<ProductsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783980718114wya9wp01m5i')
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })
})
