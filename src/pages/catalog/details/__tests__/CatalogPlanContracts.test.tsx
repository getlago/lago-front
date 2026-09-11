import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ContractForCatalogPlanContractsFragment, ContractStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CatalogPlanContracts } from '../CatalogPlanContracts'

const mockTableProps = jest.fn()
const mockPaginatedContentProps = jest.fn()
const mockGoToPage = jest.fn()
const mockUseGetCatalogPlanContractsQuery = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: (props: { children: ReactNode }) => {
    mockPaginatedContentProps(props)
    return <>{props.children}</>
  },
  usePageSearchParam: () => ({ page: 1, goToPage: mockGoToPage }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCatalogPlanContractsQuery: (options: Record<string, unknown>) =>
    mockUseGetCatalogPlanContractsQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
}

const buildContract = (
  overrides: Partial<ContractForCatalogPlanContractsFragment> = {},
): ContractForCatalogPlanContractsFragment => ({
  __typename: 'Contract',
  id: 'contract-1',
  status: ContractStatusEnum.Active,
  startedAt: '2026-06-11T00:00:00Z',
  endedAt: null,
  customer: {
    __typename: 'Customer',
    id: 'cus-1',
    name: 'Acme',
    displayName: 'Acme Inc.',
    externalId: 'acme',
  },
  ...overrides,
})

const getTableProps = (): TableProps<ContractForCatalogPlanContractsFragment> =>
  mockTableProps.mock.calls[0][0]

describe('CatalogPlanContracts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetCatalogPlanContractsQuery.mockReturnValue(defaultQueryState)
  })

  describe('GIVEN a known plan code', () => {
    describe('WHEN the tab renders', () => {
      it('THEN wires the query with the plan code, the URL page and the default limit', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        expect(mockUseGetCatalogPlanContractsQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { planCode: 'premium', limit: DEFAULT_PAGE_SIZE, page: 1 },
            skip: false,
            notifyOnNetworkStatusChange: true,
          }),
        )
      })

      it('THEN uses the tab-nested layout, not the full-page one', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        expect(getTableProps().containerSize).toBe(0)
        expect(mockPaginatedContentProps).toHaveBeenCalledWith(
          expect.objectContaining({ sticky: false }),
        )
      })

      it('THEN passes the query metadata to the pager', () => {
        mockUseGetCatalogPlanContractsQuery.mockReturnValue({
          ...defaultQueryState,
          data: {
            contracts: {
              __typename: 'ContractCollection',
              metadata: { currentPage: 1, totalPages: 1, totalCount: 1 },
              collection: [buildContract()],
            },
          },
        })

        render(<CatalogPlanContracts planCode="premium" />)

        expect(mockPaginatedContentProps).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: { currentPage: 1, totalPages: 1, totalCount: 1 },
          }),
        )
      })

      it('THEN passes no row link, since the app has no contract detail route', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        expect(getTableProps().onRowActionLink).toBeUndefined()
      })

      it('THEN renders the four columns in order', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        expect(getTableProps().columns.map((column) => column?.key)).toEqual([
          'customer.displayName',
          'status',
          'startedAt',
          'endedAt',
        ])
      })
    })
  })

  describe('GIVEN the plan code has not resolved yet', () => {
    describe('WHEN the tab renders', () => {
      it('THEN skips the query', () => {
        render(<CatalogPlanContracts />)

        expect(mockUseGetCatalogPlanContractsQuery).toHaveBeenCalledWith(
          expect.objectContaining({ skip: true }),
        )
      })
    })
  })

  describe('GIVEN a contract row', () => {
    describe('WHEN the customer column content renders', () => {
      it('THEN shows the display name and a copyable external id', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const customerColumn = getTableProps().columns.find(
          (column) => column?.key === 'customer.displayName',
        )

        render(<>{customerColumn?.content(buildContract())}</>)

        expect(screen.getByText('Acme Inc.')).toBeInTheDocument()
        expect(screen.getByText('acme')).toBeInTheDocument()
      })
    })

    describe('WHEN the status column content renders', () => {
      it('THEN maps the status through contractStatusMapping', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const statusColumn = getTableProps().columns.find((column) => column?.key === 'status')

        const { container: activeContainer } = render(
          <>{statusColumn?.content(buildContract({ status: ContractStatusEnum.Active }))}</>,
        )
        const { container: terminatedContainer } = render(
          <>{statusColumn?.content(buildContract({ status: ContractStatusEnum.Terminated }))}</>,
        )

        expect(activeContainer.querySelector('[data-test="status"]')).toHaveClass('bg-green-100')
        expect(terminatedContainer.querySelector('[data-test="status"]')).toHaveClass('bg-red-100')
      })
    })

    describe('WHEN the start date column content renders', () => {
      it('THEN shows the formatted date', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const startedAtColumn = getTableProps().columns.find(
          (column) => column?.key === 'startedAt',
        )

        render(
          <>{startedAtColumn?.content(buildContract({ startedAt: '2026-06-11T00:00:00Z' }))}</>,
        )

        expect(screen.getByText('Jun 11, 2026')).toBeInTheDocument()
      })

      it('THEN renders a dash when absent', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const startedAtColumn = getTableProps().columns.find(
          (column) => column?.key === 'startedAt',
        )

        render(<>{startedAtColumn?.content(buildContract({ startedAt: null }))}</>)

        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })

    describe('WHEN the end date column content renders', () => {
      it('THEN shows the formatted date', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const endedAtColumn = getTableProps().columns.find((column) => column?.key === 'endedAt')

        render(<>{endedAtColumn?.content(buildContract({ endedAt: '2026-07-01T00:00:00Z' }))}</>)

        expect(screen.getByText('Jul 1, 2026')).toBeInTheDocument()
      })

      it('THEN renders a dash when absent', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        const endedAtColumn = getTableProps().columns.find((column) => column?.key === 'endedAt')

        render(<>{endedAtColumn?.content(buildContract({ endedAt: null }))}</>)

        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the table placeholder', () => {
    describe('WHEN the tab renders', () => {
      it('THEN the placeholder carries the empty-state copy', () => {
        render(<CatalogPlanContracts planCode="premium" />)

        expect(getTableProps().placeholder?.emptyState?.title).toBe('text_1789030049530zaego9s9413')
        expect(getTableProps().placeholder?.emptyState?.subtitle).toBe(
          'text_1789030049530fpa31j8cd53',
        )
      })
    })
  })

  describe('GIVEN the query errors', () => {
    describe('WHEN the tab renders', () => {
      it('THEN flags the table as errored and offers the generic error copy', () => {
        mockUseGetCatalogPlanContractsQuery.mockReturnValue({
          ...defaultQueryState,
          error: new Error('boom'),
        })

        render(<CatalogPlanContracts planCode="premium" />)

        expect(getTableProps().hasError).toBe(true)
        expect(getTableProps().placeholder?.errorState).toEqual(
          expect.objectContaining({
            title: 'text_629728388c4d2300e2d380d5',
            subtitle: 'text_629728388c4d2300e2d380eb',
            buttonTitle: 'text_629728388c4d2300e2d38110',
            buttonVariant: 'primary',
          }),
        )
      })
    })
  })
})
