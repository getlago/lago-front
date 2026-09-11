import { screen } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { MainHeaderInPageAction } from '~/components/MainHeader/types'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CatalogPlanForListFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import CatalogPlansList, {
  CATALOG_PLANS_CREATE_TEST_ID,
  CATALOG_PLANS_LIST_SEARCH_TEST_ID,
} from '../CatalogPlansList'

const SEARCH_PLANS_KEY = 'text_1789030049528lqtvvif9k1p'
const COL_RATE_CARDS_KEY = 'text_1789030049528f40pn120tj7'
const COL_SUBSCRIPTIONS_KEY = 'text_1789030049528f6kajqwypsr'
const CREATE_PLAN_KEY = 'text_1789030049528b0qu0hphtg4'
const LIST_EMPTY_TITLE_KEY = 'text_17890300495285vbd2xto1kc'
const LIST_SEARCH_EMPTY_TITLE_KEY = 'text_1789030049528z655xwavs78'
const PLAN_DEFINITION_KEY = 'text_17890300495297g290y7et77'

const mockMainHeaderConfigure = jest.fn()
const mockTableProps = jest.fn()
const mockPaginatedContentProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenCatalogPlanDrawer = jest.fn()
const mockActionColumn = jest.fn()
const mockActionColumnTooltip = jest.fn()
const mockGetRowActionLink = jest.fn()
const mockUseCatalogPlansLazyQuery = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

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
  SearchInput: () => null,
}))

jest.mock('../drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: mockOpenCatalogPlanDrawer }),
}))

jest.mock('../useCatalogPlanTableActions', () => ({
  useCatalogPlanTableActions: () => ({
    actionColumn: mockActionColumn,
    actionColumnTooltip: mockActionColumnTooltip,
    getRowActionLink: mockGetRowActionLink,
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
  useCatalogPlansLazyQuery: (options: Record<string, unknown>) =>
    mockUseCatalogPlansLazyQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = (): TableProps<CatalogPlanForListFragment> =>
  mockTableProps.mock.calls[0][0] as TableProps<CatalogPlanForListFragment>

const getCreateAction = (): MainHeaderInPageAction =>
  (mockMainHeaderConfigure.mock.calls[0][0] as { actions: { items: MainHeaderInPageAction[] } })
    .actions.items[0]

type SearchInputElement = ReactElement<{
  onChange: (value: string) => void
  placeholder: string
  'data-test': string
}>

const getSearchInputElement = (): SearchInputElement =>
  (mockMainHeaderConfigure.mock.calls[0][0] as { filtersSection: SearchInputElement })
    .filtersSection

const catalogPlan = {
  id: '1',
  name: 'Premium',
  invoiceDisplayName: null,
  code: 'premium',
  appliedRateCardsCount: 3,
  contractsCount: 2,
  createdAt: '2024-06-11',
} as CatalogPlanForListFragment

describe('CatalogPlansList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseCatalogPlansLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('wires the query with the URL page, default limit and notifyOnNetworkStatusChange', () => {
    render(<CatalogPlansList />)

    expect(mockUseCatalogPlansLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
      }),
    )
  })

  it('renders as a full-page list: inset pager, default sticky, and the page-gutter container size', () => {
    render(<CatalogPlansList />)

    const paginatedContentProps = mockPaginatedContentProps.mock.calls[0][0] as {
      insetPager?: boolean
      sticky?: boolean
    }

    expect(paginatedContentProps.insetPager).toBe(true)
    expect(paginatedContentProps.sticky).toBeUndefined()
    expect(getTableProps().containerSize).toEqual({ default: 16, md: 48 })
  })

  it('renders the four list columns, with the counts and the date right-aligned', () => {
    render(<CatalogPlansList />)

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
        title: COL_SUBSCRIPTIONS_KEY,
        textAlign: 'right',
      }),
    )
    expect(columns[3]).toEqual(expect.objectContaining({ key: 'createdAt', textAlign: 'right' }))
  })

  it('displays the invoice display name over the name, with the code below', () => {
    render(<CatalogPlansList />)

    const nameColumn = getTableProps().columns[0]

    render(<>{nameColumn?.content({ ...catalogPlan, invoiceDisplayName: 'Premium (invoiced)' })}</>)

    expect(screen.getByText('Premium (invoiced)')).toBeInTheDocument()
    expect(screen.queryByText('Premium')).not.toBeInTheDocument()
    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('falls back to the plan name when there is no invoice display name', () => {
    render(<CatalogPlansList />)

    const nameColumn = getTableProps().columns[0]

    render(<>{nameColumn?.content(catalogPlan)}</>)

    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('renders the applied rate card and contract counts', () => {
    render(<CatalogPlansList />)

    const { columns } = getTableProps()

    render(<>{columns[1]?.content(catalogPlan)}</>)
    expect(screen.getByText('3')).toBeInTheDocument()

    render(<>{columns[2]?.content(catalogPlan)}</>)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('passes the table-actions hook output straight through to the Table', () => {
    render(<CatalogPlansList />)

    const { actionColumn, actionColumnTooltip, onRowActionLink } = getTableProps()

    expect(actionColumn).toBe(mockActionColumn)
    expect(actionColumnTooltip).toBe(mockActionColumnTooltip)
    expect(onRowActionLink).toBe(mockGetRowActionLink)
  })

  it('renders the search input in the header filters section and resets to page 1 before searching', () => {
    render(<CatalogPlansList />)

    const searchInputElement = getSearchInputElement()

    expect(searchInputElement.type).toBe(SearchInput)
    expect(searchInputElement.props.placeholder).toBe(SEARCH_PLANS_KEY)
    expect(searchInputElement.props['data-test']).toBe(CATALOG_PLANS_LIST_SEARCH_TEST_ID)

    searchInputElement.props.onChange('premium')

    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockDebouncedSearch).toHaveBeenCalledWith('premium')
    expect(mockGoToPage.mock.invocationCallOrder[0]).toBeLessThan(
      mockDebouncedSearch.mock.invocationCallOrder[0],
    )
  })

  it('offers the create-plan action in the header when allowed', () => {
    render(<CatalogPlansList />)

    const createAction = getCreateAction()

    expect(createAction).toEqual(
      expect.objectContaining({
        type: 'action',
        label: CREATE_PLAN_KEY,
        hidden: false,
        dataTest: CATALOG_PLANS_CREATE_TEST_ID,
      }),
    )

    createAction.onClick()
    expect(mockOpenCatalogPlanDrawer).toHaveBeenCalledWith()
  })

  it('hides the create-plan action without the plansCreate permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<CatalogPlansList />)

    expect(getCreateAction()).toEqual(expect.objectContaining({ hidden: true }))
  })

  it('offers the create-first-plan empty state when allowed', () => {
    render(<CatalogPlansList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe(LIST_EMPTY_TITLE_KEY)
    expect(placeholder?.emptyState?.subtitle).toBe(PLAN_DEFINITION_KEY)
    expect(placeholder?.emptyState?.buttonTitle).toBe(CREATE_PLAN_KEY)

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenCatalogPlanDrawer).toHaveBeenCalledWith()
  })

  it('hides the create button in the empty state without permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<CatalogPlansList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe(LIST_EMPTY_TITLE_KEY)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variants of the empty and error states while searching', () => {
    mockUseCatalogPlansLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<CatalogPlansList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe(LIST_SEARCH_EMPTY_TITLE_KEY)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
    expect(placeholder?.errorState?.title).toBe('text_623b53fea66c76017eaebb6e')
    expect(placeholder?.errorState?.buttonTitle).toBeUndefined()
  })
})
