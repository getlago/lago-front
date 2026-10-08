import { screen } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CatalogPlanForListFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import CatalogPlansTabList, { CATALOG_PLANS_TAB_LIST_SEARCH_TEST_ID } from '../CatalogPlansTabList'

const COL_RATE_CARDS_KEY = 'text_1789030049528f40pn120tj7'
const COL_CONTRACTS_KEY = 'text_1789030049528f6kajqwypsr'
const SEARCH_PLANS_KEY = 'text_1789030049528lqtvvif9k1p'
const LIST_EMPTY_TITLE_KEY = 'text_17890300495285vbd2xto1kc'
const LIST_SEARCH_EMPTY_TITLE_KEY = 'text_1789030049528z655xwavs78'

const mockTableProps = jest.fn()
const mockPaginatedContentProps = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockActionColumn = jest.fn()
const mockActionColumnTooltip = jest.fn()
const mockGetRowActionLink = jest.fn()
const mockUseCatalogPlansQuery = jest.fn()
const mockSearchInputProps = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children, ...props }: { children: ReactNode }) => {
    mockPaginatedContentProps(props)
    return <>{children}</>
  },
  usePageSearchParam: () => ({ page: 1, goToPage: mockGoToPage }),
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)

    return null
  },
}))

jest.mock('../../useCatalogPlanTableActions', () => ({
  useCatalogPlanTableActions: () => ({
    actionColumn: mockActionColumn,
    actionColumnTooltip: mockActionColumnTooltip,
    getRowActionLink: mockGetRowActionLink,
  }),
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
  useGetCatalogPlansForCatalogObjectDetailsLazyQuery: (options: Record<string, unknown>) =>
    mockUseCatalogPlansQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = (): TableProps<CatalogPlanForListFragment> =>
  mockTableProps.mock.calls[0][0] as TableProps<CatalogPlanForListFragment>

type SearchInputElement = ReactElement<{
  onChange: (value: string) => void
  placeholder: string
  'data-test': string
}>

const catalogPlan = {
  id: '1',
  name: 'Premium',
  invoiceDisplayName: null,
  code: 'premium',
  appliedRateCardsCount: 3,
  contractsCount: 2,
  createdAt: '2024-06-11',
} as CatalogPlanForListFragment

describe('CatalogPlansTabList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCatalogPlansQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it.each([
    [{ productId: 'prod-1' }, { productIds: ['prod-1'] }],
    [{ productFilterId: 'pif-1' }, { productFilterIds: ['pif-1'] }],
    [{ productCategoryId: 'cat-1' }, { productCategoryIds: ['cat-1'] }],
    [{ rateCardId: 'rc-1' }, { rateCardIds: ['rc-1'] }],
  ])('maps scope %p to query variables %p', (scope, expectedVariables) => {
    render(<CatalogPlansTabList scope={scope} />)

    expect(mockUseCatalogPlansQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { ...expectedVariables, limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('renders the list flush with the parent tab container, with no extra side gutter', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    expect(getTableProps().containerSize).toBe(0)
  })

  it('renders the four list columns, with the counts and the date right-aligned', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const { columns } = getTableProps()

    expect(columns).toHaveLength(4)
    expect(columns[0]).toEqual(expect.objectContaining({ key: 'name', maxSpace: true }))
    expect(columns[1]).toEqual(
      expect.objectContaining({
        key: 'appliedRateCardsCount',
        title: COL_RATE_CARDS_KEY,
        textAlign: 'right',
      }),
    )
    expect(columns[2]).toEqual(
      expect.objectContaining({
        key: 'contractsCount',
        title: COL_CONTRACTS_KEY,
        textAlign: 'right',
      }),
    )
    expect(columns[3]).toEqual(expect.objectContaining({ key: 'createdAt', textAlign: 'right' }))
  })

  it('displays the invoice display name over the name, with the code below', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const nameColumn = getTableProps().columns[0]

    render(<>{nameColumn?.content({ ...catalogPlan, invoiceDisplayName: 'Premium (invoiced)' })}</>)

    expect(screen.getByText('Premium (invoiced)')).toBeInTheDocument()
    expect(screen.queryByText('Premium')).not.toBeInTheDocument()
    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('renders the applied rate card and contract counts', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const { columns } = getTableProps()

    render(<>{columns[1]?.content(catalogPlan)}</>)
    expect(screen.getByText('3')).toBeInTheDocument()

    render(<>{columns[2]?.content(catalogPlan)}</>)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('passes the table-actions hook output straight through to the Table', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const { actionColumn, actionColumnTooltip, onRowActionLink } = getTableProps()

    expect(actionColumn).toBe(mockActionColumn)
    expect(actionColumnTooltip).toBe(mockActionColumnTooltip)
    expect(onRowActionLink).toBe(mockGetRowActionLink)
  })

  it('renders the search input and resets to page 1 before searching', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const searchInputProps = mockSearchInputProps.mock.calls[0][0] as SearchInputElement['props']

    expect(searchInputProps.placeholder).toBe(SEARCH_PLANS_KEY)
    expect(searchInputProps['data-test']).toBe(CATALOG_PLANS_TAB_LIST_SEARCH_TEST_ID)

    searchInputProps.onChange('premium')

    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockDebouncedSearch).toHaveBeenCalledWith('premium')
    expect(mockGoToPage.mock.invocationCallOrder[0]).toBeLessThan(
      mockDebouncedSearch.mock.invocationCallOrder[0],
    )
  })

  it('has no create action in the empty state (plans do not attach directly to this object)', () => {
    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe(LIST_EMPTY_TITLE_KEY)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseCatalogPlansQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<CatalogPlansTabList scope={{ productId: 'prod-1' }} />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe(LIST_SEARCH_EMPTY_TITLE_KEY)
  })
})
