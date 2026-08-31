import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  CurrencyEnum,
  RateCardForListFragment,
  RateCardRateModelEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import RateCardsList, { RATE_CARDS_LIST_TEST_ID } from '../RateCardsList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenRateCardDrawer = jest.fn()
const mockOpenDeleteRateCardDialog = jest.fn()
const mockUseRateCardsLazyQuery = jest.fn()

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
  formatFiltersForRateCardsQuery: () => ({}),
  mapRateCardFilterVars: () => ({}),
  RateCardAvailableFilters: [],
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

jest.mock('../drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenRateCardDrawer }),
  RATE_CARD_DRAWER_TITLE_CREATE_KEY: 'text_1784925227817k72h5sd0wyu',
}))

jest.mock('../dialogs/useDeleteRateCardDialog', () => ({
  useDeleteRateCardDialog: () => ({
    openDeleteRateCardDialog: mockOpenDeleteRateCardDialog,
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
  useRateCardsLazyQuery: (options: Record<string, unknown>) => mockUseRateCardsLazyQuery(options),
}))

const buildRateCard = (
  overrides: Partial<RateCardForListFragment> = {},
): RateCardForListFragment => ({
  __typename: 'RateCard',
  id: 'rate-card-1',
  name: 'Premium seats',
  code: 'premium_seats',
  createdAt: '2024-01-20T00:00:00Z',
  ratesCount: 2,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  description: null,
  billingTiming: 'advance' as RateCardForListFragment['billingTiming'],
  displayOnInvoice: true,
  regroupPaidFees: RateCardRegroupPaidFeesEnum.None,
  proration: false,
  walletTargetable: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    productType: 'metered' as RateCardForListFragment['product']['productType'],
    billableMetric: null,
  },
  productFilter: null,
  activeRate: {
    __typename: 'RateCardRate',
    id: 'rate-1',
    rateModel: RateCardRateModelEnum.Standard,
    rateProperties: { amount: '10' },
    minAmountCents: 0,
  },
  ...overrides,
})

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = () => mockTableProps.mock.calls[0][0] as TableProps<RateCardForListFragment>

describe('RateCardsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseRateCardsLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('renders the page container', () => {
    render(<RateCardsList />)

    expect(screen.getByTestId(RATE_CARDS_LIST_TEST_ID)).toBeInTheDocument()
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<RateCardsList />)

    expect(mockUseRateCardsLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('passes the fetched collection to the table', () => {
    const rateCard = buildRateCard()

    mockUseRateCardsLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        data: { rateCards: { collection: [rateCard], metadata: undefined } },
      },
    ])

    render(<RateCardsList />)

    expect(getTableProps().data).toEqual([rateCard])
  })

  it('renders the name, attached to, active rate, rates count and created columns', () => {
    render(<RateCardsList />)

    const { columns } = getTableProps()

    expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
      'name',
      'productFilter.name',
      'activeRate',
      'ratesCount',
      'createdAt',
    ])
  })

  it('links each row to the rate card details overview tab', () => {
    render(<RateCardsList />)

    expect(
      getTableProps().onRowActionLink?.({
        id: 'rate-card-1',
      } as RateCardForListFragment),
    ).toBe('/product-catalog/rate-cards/rate-card-1/overview')
  })

  it('offers edit and delete row actions wired to the drawer and delete dialog', () => {
    render(<RateCardsList />)

    const rateCard = buildRateCard()

    const actions = (getTableProps().actionColumn?.(rateCard) ??
      []) as ActionItem<RateCardForListFragment>[]

    expect(actions).toHaveLength(2)

    const [editAction, deleteAction] = actions

    editAction?.onAction(rateCard)
    expect(mockOpenRateCardDrawer).toHaveBeenCalledWith({ rateCard })

    deleteAction?.onAction(rateCard)
    expect(mockOpenDeleteRateCardDialog).toHaveBeenCalledWith({ rateCard })
  })

  it('hides both row actions without the update and delete permissions', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<RateCardsList />)

    expect(getTableProps().actionColumn?.({} as RateCardForListFragment)).toHaveLength(0)
  })

  it('resets to page 1 before searching', () => {
    render(<RateCardsList />)

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

  it('offers the create-rate-card CTA in the empty state when allowed', () => {
    render(<RateCardsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeDefined()

    placeholder?.emptyState?.buttonAction?.()
    expect(mockOpenRateCardDrawer).toHaveBeenCalledTimes(1)
  })

  it('hides the create CTA without the rateCardsCreate permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<RateCardsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variant of the empty state while searching', () => {
    mockUseRateCardsLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<RateCardsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).not.toBe(getTableProps().placeholder?.errorState?.title)
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('renders an error state', () => {
    mockUseRateCardsLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, error: new Error('boom') },
    ])

    render(<RateCardsList />)

    expect(getTableProps().hasError).toBe(true)
    expect(getTableProps().placeholder?.errorState?.title).toBe('text_629728388c4d2300e2d380d5')
  })

  it('uses the search variant of the error state while searching', () => {
    mockUseRateCardsLazyQuery.mockReturnValue([
      jest.fn(),
      {
        ...defaultQueryState,
        error: new Error('boom'),
        variables: { ...defaultQueryState.variables, searchTerm: 'foo' },
      },
    ])

    render(<RateCardsList />)

    expect(getTableProps().placeholder?.errorState?.title).toBe('text_623b53fea66c76017eaebb6e')
  })
})
