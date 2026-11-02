import { screen, within } from '@testing-library/react'

import { render } from '~/test-utils'

import { ComposableTableView, ComposableTableViewProps } from '../ComposableTableView'
import { createComposableTableColumnHelper, useComposableTable } from '../useComposableTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

type Usage = { id: string; team: string; tokens: number; seats: number }

const USAGES: Usage[] = [
  { id: 'rnd', team: 'R&D', tokens: 120, seats: 4 },
  { id: 'sales', team: 'Sales', tokens: 30, seats: 2 },
]

const TABLE_TEST_ID = 'usage-table'
const FOOTER_TEST_ID = 'usage-table-footer'

const columnHelper = createComposableTableColumnHelper<Usage>()

const COLUMNS = columnHelper.columns([
  columnHelper.accessor('team', { header: 'Team', footer: 'Total' }),
  columnHelper.group({
    id: 'metrics',
    header: 'Billable metrics',
    columns: columnHelper.columns([
      columnHelper.accessor('tokens', {
        header: 'Tokens',
        footer: '150',
        meta: { align: 'right', shrink: true, className: 'min-w-24' },
      }),
      columnHelper.accessor('seats', {
        header: 'Seats',
        footer: () => <span>6 seats</span>,
        meta: { align: 'right' },
        cell: ({ getValue }) => <span>{getValue()} seats</span>,
      }),
    ]),
  }),
  columnHelper.display({ id: 'total', header: 'Total', cell: () => 'n/a', footer: 'n/a' }),
])

type TestTableProps = Omit<ComposableTableViewProps<Usage>, 'table'> & {
  data?: Usage[]
}

const TestTable = ({ data = USAGES, ...props }: TestTableProps): JSX.Element => {
  const table = useComposableTable({
    data,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    initialState: { columnPinning: { start: ['team'], end: ['total'] } },
  })

  return <ComposableTableView table={table} data-test={TABLE_TEST_ID} {...props} />
}

const getBodyRows = (): HTMLElement[] =>
  within(screen.getAllByRole('rowgroup')[1]).queryAllByRole('row')

describe('ComposableTableView', () => {
  describe('GIVEN a table with a column group', () => {
    describe('WHEN it renders', () => {
      it('THEN spans the group over its columns and merges the other headers over both header rows', () => {
        render(<TestTable />)

        expect(screen.getByRole('columnheader', { name: 'Billable metrics' })).toHaveAttribute(
          'colspan',
          '2',
        )
        expect(screen.getByRole('columnheader', { name: 'Team' })).toHaveAttribute('rowspan', '2')
        expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('rowspan', '2')
        expect(screen.getAllByRole('columnheader')).toHaveLength(5)
      })

      it('THEN aligns the group header left and leaf headers from their column meta', () => {
        render(<TestTable />)

        expect(screen.getByRole('columnheader', { name: 'Billable metrics' })).toHaveClass(
          'text-left',
        )
        expect(screen.getByRole('columnheader', { name: 'Tokens' })).toHaveClass(
          'text-right',
          'w-px',
          'min-w-24',
        )
      })

      it('THEN makes pinned columns sticky on their side', () => {
        render(<TestTable />)

        expect(screen.getByRole('columnheader', { name: 'Team' })).toHaveClass('sticky', 'left-0')
        expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveClass('sticky', 'right-0')
      })
    })
  })

  describe('GIVEN rows of data', () => {
    describe('WHEN it renders', () => {
      it('THEN renders one row per item with plain and custom cell values', () => {
        render(<TestTable getRowDataTest={(row) => `usage-row-${row.id}`} />)

        expect(getBodyRows()).toHaveLength(2)
        expect(screen.getByTestId('usage-row-rnd')).toHaveTextContent('R&D')
        expect(screen.getByTestId('usage-row-rnd')).toHaveTextContent('120')
        expect(screen.getByText('4 seats')).toBeInTheDocument()
      })

      it('THEN renders no footer unless asked', () => {
        render(<TestTable />)

        expect(screen.getByTestId(TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.getAllByRole('rowgroup')).toHaveLength(2)
      })
    })

    describe('WHEN the footer is enabled', () => {
      it('THEN renders one footer row from the column footers', () => {
        render(<TestTable hasFooter footerDataTest={FOOTER_TEST_ID} />)

        const footer = screen.getByTestId(FOOTER_TEST_ID)

        expect(within(footer).getAllByRole('cell')).toHaveLength(4)
        expect(footer).toHaveTextContent('Total')
        expect(footer).toHaveTextContent('150')
        expect(footer).toHaveTextContent('6 seats')
      })
    })
  })

  describe('GIVEN a loading table', () => {
    describe('WHEN it renders', () => {
      it('THEN renders skeleton rows instead of data and hides the footer', () => {
        render(
          <TestTable isLoading loadingRowCount={4} hasFooter footerDataTest={FOOTER_TEST_ID} />,
        )

        expect(getBodyRows()).toHaveLength(4)
        expect(screen.queryByText('R&D')).not.toBeInTheDocument()
        expect(screen.queryByTestId(FOOTER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN defaults to three skeleton rows', () => {
        render(<TestTable isLoading />)

        expect(getBodyRows()).toHaveLength(3)
      })
    })
  })

  describe('GIVEN a table without rows', () => {
    describe('WHEN it renders', () => {
      it('THEN shows the empty placeholder across every column', () => {
        render(<TestTable data={[]} hasFooter footerDataTest={FOOTER_TEST_ID} />)

        const [placeholderCell] = within(getBodyRows()[0]).getAllByRole('cell')

        expect(placeholderCell).toHaveAttribute('colspan', '4')
        expect(screen.getByText('text_62b31e1f6a5b8b1b745ece48')).toBeInTheDocument()
        expect(screen.queryByTestId(FOOTER_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN uses the empty state overrides', () => {
        render(
          <TestTable
            data={[]}
            placeholder={{ emptyState: { title: 'No usage', subtitle: 'Nothing billed yet' } }}
          />,
        )

        expect(screen.getByText('No usage')).toBeInTheDocument()
        expect(screen.getByText('Nothing billed yet')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a table in error', () => {
    describe('WHEN it renders', () => {
      it('THEN shows the error placeholder instead of the rows', () => {
        render(
          <TestTable
            hasError
            placeholder={{ errorState: { title: 'Usage failed', subtitle: 'Try again later' } }}
          />,
        )

        expect(screen.getByText('Usage failed')).toBeInTheDocument()
        expect(screen.queryByText('R&D')).not.toBeInTheDocument()
      })
    })
  })
})
