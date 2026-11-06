import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '~/components/designSystem/Button'
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
        meta: { variant: 'numeric' },
      }),
      columnHelper.accessor('seats', {
        header: 'Seats',
        footer: () => <span>6 seats</span>,
        meta: { variant: 'numeric' },
        cell: ({ getValue }) => <span>{getValue()} seats</span>,
      }),
    ]),
  }),
  columnHelper.display({
    id: 'total',
    header: 'Total',
    cell: () => 'n/a',
    footer: 'n/a',
    meta: { variant: 'numeric' },
  }),
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

const FocusTable = ({ header }: { header: string }): JSX.Element => {
  const table = useComposableTable({
    data: USAGES,
    columns: [
      columnHelper.display({
        id: 'action',
        header,
        cell: ({ row }) => <Button variant="inline">{`Open ${row.original.team}`}</Button>,
      }),
    ],
    getRowId: (row) => row.id,
  })

  return <ComposableTableView table={table} />
}

const getBodyRows = (): HTMLElement[] =>
  within(screen.getAllByRole('rowgroup')[1]).queryAllByRole('row')

describe('ComposableTableView', () => {
  describe('GIVEN a table with a column group', () => {
    describe('WHEN it renders', () => {
      it('THEN spans the group over its columns and keeps the other headers on the first header row', () => {
        render(<TestTable />)

        const [groupRow, leafRow] = within(screen.getAllByRole('rowgroup')[0]).getAllByRole('row')
        const leafHeaders = within(leafRow).getAllByRole('columnheader')

        expect(screen.getByRole('columnheader', { name: 'Billable metrics' })).toHaveAttribute(
          'colspan',
          '2',
        )
        expect(within(groupRow).getByRole('columnheader', { name: 'Team' })).toBeInTheDocument()
        expect(within(groupRow).getByRole('columnheader', { name: 'Total' })).toBeInTheDocument()
        expect(screen.queryAllByRole('columnheader', { name: '' })).toHaveLength(2)
        expect(leafHeaders).toHaveLength(4)
        expect(leafHeaders[0]).toBeEmptyDOMElement()
        expect(leafHeaders[3]).toBeEmptyDOMElement()
        expect(document.querySelectorAll('thead th[rowspan]')).toHaveLength(0)
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

      it('THEN keeps the column meta on the header of a column beside the group', () => {
        render(<TestTable />)

        expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveClass(
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

      // Guards the plain values that `flexRender` would mount as a component, past the text styling.
      it('THEN renders the plain values of function cells as body text', () => {
        render(<TestTable getRowDataTest={(row) => `usage-row-${row.id}`} />)

        const cells = within(screen.getByTestId('usage-row-rnd')).getAllByRole('cell')

        expect(cells[0].querySelector('[data-test="body"]')).toHaveTextContent('R&D')
        expect(cells[3].querySelector('[data-test="body"]')).toHaveTextContent('n/a')
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

  describe('GIVEN a focused control inside a cell', () => {
    describe('WHEN the table rerenders with new column definitions', () => {
      // Guards the remount `flexRender` does on every new renderer identity.
      it('THEN keeps the focus on the control', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<FocusTable header="Actions" />)

        await user.click(screen.getByRole('button', { name: 'Open R&D' }))

        rerender(<FocusTable header="Row actions" />)

        expect(screen.getByRole('button', { name: 'Open R&D' })).toHaveFocus()
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

  describe('GIVEN a table with a row click handler', () => {
    const getRowDataTest = (row: { id: string }): string => `usage-row-${row.id}`

    describe('WHEN a clickable row is clicked', () => {
      it('THEN calls onRowClick with that row', async () => {
        const user = userEvent.setup()
        const onRowClick = jest.fn()

        render(
          <TestTable
            getRowDataTest={getRowDataTest}
            onRowClick={onRowClick}
            getRowIsClickable={(row) => row.id === 'rnd'}
          />,
        )

        await user.click(screen.getByTestId('usage-row-rnd'))

        expect(onRowClick).toHaveBeenCalledTimes(1)
        expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'rnd' }))
        expect(screen.getByTestId('usage-row-rnd')).toHaveClass('cursor-pointer')
      })
    })

    describe('WHEN a row excluded by getRowIsClickable is clicked', () => {
      it('THEN does not call onRowClick and the row is not styled as clickable', async () => {
        const user = userEvent.setup()
        const onRowClick = jest.fn()

        render(
          <TestTable
            getRowDataTest={getRowDataTest}
            onRowClick={onRowClick}
            getRowIsClickable={(row) => row.id === 'rnd'}
          />,
        )

        await user.click(screen.getByTestId('usage-row-sales'))

        expect(onRowClick).not.toHaveBeenCalled()
        expect(screen.getByTestId('usage-row-sales')).not.toHaveClass('cursor-pointer')
      })
    })

    describe('WHEN getRowIsClickable is omitted', () => {
      it('THEN every row is clickable', async () => {
        const user = userEvent.setup()
        const onRowClick = jest.fn()

        render(<TestTable getRowDataTest={getRowDataTest} onRowClick={onRowClick} />)

        await user.click(screen.getByTestId('usage-row-sales'))

        expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'sales' }))
      })
    })
  })

  describe('GIVEN a table without a row click handler', () => {
    describe('WHEN it renders', () => {
      it('THEN no row is styled as clickable', () => {
        render(<TestTable getRowDataTest={(row) => `usage-row-${row.id}`} />)

        expect(screen.getByTestId('usage-row-rnd')).not.toHaveClass('cursor-pointer')
      })
    })
  })
})
