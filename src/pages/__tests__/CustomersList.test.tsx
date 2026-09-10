import { fireEvent, screen } from '@testing-library/react'
import { ComponentProps } from 'react'

import { PaginatedContent } from '~/components/designSystem/Pagination'
import { Filters } from '~/components/Filters'
import { MainHeaderConfig } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import CustomersList from '../CustomersList'

const mockMainHeaderConfigure = jest.fn<void, [MainHeaderConfig]>()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: MainHeaderConfig): null => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (): null => null,
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: ComponentProps<typeof PaginatedContent>): JSX.Element => (
    <>{children}</>
  ),
  usePageSearchParam: () => ({ page: 3, goToPage: mockGoToPage }),
}))

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

jest.mock('~/components/customers/DeleteCustomerDialog', () => ({
  useDeleteCustomerDialog: () => ({ openDeleteCustomerDialog: jest.fn() }),
}))

jest.mock('~/hooks/customer/useCustomersListHeaderActions', () => ({
  useCustomersListHeaderActions: () => [],
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string): string => key }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: (): boolean => false }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
    hasOrganizationPremiumAddon: (): boolean => false,
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
  useCustomersLazyQuery: () => [
    jest.fn(),
    { data: undefined, error: undefined, loading: false, variables: {} },
  ],
}))

describe('CustomersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the list is on page 3', (): void => {
    it('WHEN search is edited or cleared THEN resets the page before searching', (): void => {
      render(<CustomersList />)

      const config = mockMainHeaderConfigure.mock.calls[0][0]

      render(<>{config.filtersSection}</>)

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
})
