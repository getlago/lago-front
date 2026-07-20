import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductItemForListFragment, ProductItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import ProductItemsList from '../ProductItemsList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductItemDrawer = jest.fn()
const mockOpenDeleteProductItemDialog = jest.fn()
const mockUseProductItemsLazyQuery = jest.fn()

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

jest.mock('~/components/designSystem/Filters', () => ({
  Filters: {
    Provider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Component: () => null,
  },
  formatFiltersForProductItemsQuery: () => ({}),
  ProductItemAvailableFilters: [],
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

jest.mock('../drawers/productItem/useProductItemDrawer', () => ({
  useProductItemDrawer: () => ({ openDrawer: mockOpenProductItemDrawer }),
}))

jest.mock('../dialogs/useDeleteProductItemDialog', () => ({
  useDeleteProductItemDialog: () => ({
    openDeleteProductItemDialog: mockOpenDeleteProductItemDialog,
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
  useProductItemsLazyQuery: (options: Record<string, unknown>) =>
    mockUseProductItemsLazyQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = () =>
  mockTableProps.mock.calls[0][0] as TableProps<ProductItemForListFragment>

describe('ProductItemsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseProductItemsLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<ProductItemsList />)

    expect(mockUseProductItemsLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ limit: DEFAULT_PAGE_SIZE, page: 1 }),
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('renders name, attached product, filters count, item type and creation date columns', () => {
    render(<ProductItemsList />)

    const { columns } = getTableProps()

    expect(columns).toHaveLength(5)
    expect(columns[0]).toEqual(expect.objectContaining({ key: 'name', maxSpace: true }))
    expect(columns[1]).toEqual(expect.objectContaining({ key: 'product.name' }))
    expect(columns[2]).toEqual(expect.objectContaining({ key: 'filtersCount', textAlign: 'right' }))
    expect(columns[3]).toEqual(expect.objectContaining({ key: 'itemType' }))
    expect(columns[4]).toEqual(expect.objectContaining({ key: 'createdAt', textAlign: 'right' }))
  })

  it('shows the attached product name or a dash', () => {
    render(<ProductItemsList />)

    const productColumn = getTableProps().columns[1]

    render(
      <>
        {productColumn?.content({
          product: { id: 'p1', name: 'Object storage', code: 'object_storage' },
        } as ProductItemForListFragment)}
      </>,
    )
    expect(screen.getByText('Object storage')).toBeInTheDocument()

    render(<>{productColumn?.content({ product: null } as ProductItemForListFragment)}</>)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('links each row to the product item details overview tab', () => {
    render(<ProductItemsList />)

    expect(getTableProps().onRowActionLink?.({ id: 'pitem-1' } as ProductItemForListFragment)).toBe(
      '/product-catalog/product-items/pitem-1/overview',
    )
  })

  it('offers edit and delete row actions wired to the drawer and delete dialog', () => {
    render(<ProductItemsList />)

    const productItem = {
      id: 'pitem-1',
      name: 'Seats',
      itemType: ProductItemTypeEnum.Fixed,
    } as ProductItemForListFragment

    const actions = (getTableProps().actionColumn?.(productItem) ??
      []) as ActionItem<ProductItemForListFragment>[]

    expect(actions).toHaveLength(2)

    const [editAction, deleteAction] = actions

    editAction?.onAction(productItem)
    expect(mockOpenProductItemDrawer).toHaveBeenCalledWith({ productItem })

    deleteAction?.onAction(productItem)
    expect(mockOpenDeleteProductItemDialog).toHaveBeenCalledWith({ productItem })
  })

  it('hides both row actions without the update and delete permissions', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductItemsList />)

    expect(getTableProps().actionColumn?.({} as ProductItemForListFragment)).toHaveLength(0)
  })

  it('resets to page 1 before searching', () => {
    render(<ProductItemsList />)

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
    render(<ProductItemsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783980718114bqx4jce32fv')
    expect(placeholder?.emptyState?.buttonTitle).toBe('text_1783622030703m9jlurg4jsn')

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenProductItemDrawer).toHaveBeenCalledTimes(1)
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseProductItemsLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<ProductItemsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783980718114wya9wp01m5i')
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })
})
