import { fireEvent, screen } from '@testing-library/react'
import { ComponentProps } from 'react'

import { Filters } from '~/components/Filters'
import { MainHeaderConfig } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import SubscriptionsPage from '../SubscriptionsPage'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDebouncedSearch = jest.fn()
const mockGoToPage = jest.fn()
let mockPage = 1

jest.mock('~/components/Filters', () => ({
  ...jest.requireActual('~/components/Filters'),
  Filters: {
    Provider: ({ children }: ComponentProps<typeof Filters.Provider>): JSX.Element => (
      <>{children}</>
    ),
    Component: (): null => null,
    QuickFilters: (): null => null,
  },
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: mockDebouncedSearch,
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionsListLazyQuery: () => [
    jest.fn(),
    {
      data: {
        subscriptions: {
          metadata: { currentPage: 1, totalPages: 1, totalCount: 0 },
          collection: [],
        },
      },
      loading: false,
      error: null,
      fetchMore: jest.fn(),
      variables: {},
    },
  ],
}))

let capturedListProps: Record<string, any> | null = null

jest.mock('~/components/subscriptions/SubscriptionsList', () => ({
  SubscriptionsList: (props: Record<string, any>) => {
    capturedListProps = props
    return <div data-test="subscriptions-list-mock">{props.name}</div>
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: mockPage, goToPage: mockGoToPage }),
}))

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPage = 1
    capturedConfig = null
    capturedListProps = null
  })

  describe('GIVEN the list is on page 3', (): void => {
    it('WHEN search is edited or cleared THEN resets the page before searching', (): void => {
      mockPage = 3
      render(<SubscriptionsPage />)
      render(<>{capturedConfig?.filtersSection}</>)

      const input = screen.getByRole('textbox')

      for (const value of [' new query ', '']) {
        mockGoToPage.mockClear()
        mockDebouncedSearch.mockClear()

        fireEvent.change(input, { target: { value } })

        expect(input).toHaveValue(value)
        expect(mockGoToPage).toHaveBeenCalledTimes(1)
        expect(mockGoToPage).toHaveBeenCalledWith(1)
        expect(mockDebouncedSearch).toHaveBeenCalledTimes(1)
        expect(mockDebouncedSearch).toHaveBeenCalledWith(value)
        expect(mockGoToPage.mock.invocationCallOrder[0]).toBeLessThan(
          mockDebouncedSearch.mock.invocationCallOrder[0],
        )
      }
    })
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the SubscriptionsList component', () => {
        render(<SubscriptionsPage />)

        expect(screen.getByTestId('subscriptions-list-mock')).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.entity?.viewName).toBe('text_6250304370f0f700a8fdc28d')
      })

      it('THEN should configure MainHeader with a filtersSection', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.filtersSection).toBeDefined()
      })

      it('THEN should not configure any actions', () => {
        render(<SubscriptionsPage />)

        expect(capturedConfig?.actions).toBeUndefined()
      })

      it('THEN should include billingEntityId column in SubscriptionsList', () => {
        render(<SubscriptionsPage />)

        const columnKeys = capturedListProps?.columns?.map(
          (col: { key: string }) => col.key,
        ) as string[]

        expect(columnKeys).toContain('billingEntityId')
      })
    })
  })

  describe('GIVEN search params are present', () => {
    describe('WHEN the page renders with empty results', () => {
      it('THEN should pass search-specific empty state placeholder to SubscriptionsList', () => {
        render(<SubscriptionsPage />)

        // With empty variables (no search params), hasSearchParams is false
        // so the emptyState title should be the no-search-params variant
        expect(capturedListProps?.placeholder?.emptyState?.title).toBe(
          'text_1751969008731m6hlinilrky',
        )
      })
    })
  })
})
