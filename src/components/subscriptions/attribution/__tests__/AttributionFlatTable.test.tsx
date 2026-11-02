import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  ChargeModelEnum,
  CurrencyEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID,
  ATTRIBUTION_LOADING_CELL_TEST_ID,
  ATTRIBUTION_SHOW_MORE_TEST_ID,
  ATTRIBUTION_TABLE_FOOTER_TEST_ID,
  ATTRIBUTION_TABLE_ROW_TEST_ID,
  AttributionFlatTable,
  AttributionTableRow,
} from '../AttributionFlatTable'
import { AttributionColumn } from '../buildAttributionColumns'

const mockTranslate = (key: string): string => key

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
}))

const charge: AttributionChargeUsageFragment['charge'] = {
  id: 'charge-tokens',
  code: 'tokens',
  invoiceDisplayName: null,
  chargeModel: ChargeModelEnum.Standard,
  billableMetric: { id: 'bm-tokens', name: 'Tokens' },
  filters: [{ id: 'filter-opus' }],
}

const opusUsage = (units: number, amountCents: string | null): AttributionChargeUsageFragment => ({
  charge,
  chargeFilter: { id: 'filter-opus', invoiceDisplayName: null, values: { model: ['opus'] } },
  units,
  amountCents,
})

const defaultUsage = (units: number): AttributionChargeUsageFragment => ({
  charge,
  chargeFilter: null,
  units,
  amountCents: null,
})

const splitColumns: AttributionColumn[] = [
  { key: 'opus', chargeId: charge.id, chargeFilterId: 'filter-opus', label: 'opus', filterPage: 0 },
  { key: 'default', chargeId: charge.id, chargeFilterId: null, label: null, filterPage: 0 },
]

const sonnetUsage = (units: number): AttributionChargeUsageFragment => ({
  charge,
  chargeFilter: { id: 'filter-sonnet', invoiceDisplayName: null, values: { model: ['sonnet'] } },
  units,
  amountCents: null,
})

const secondPageColumn: AttributionColumn = {
  key: 'sonnet',
  chargeId: charge.id,
  chargeFilterId: 'filter-sonnet',
  label: 'sonnet',
  filterPage: 1,
}

const rows: AttributionTableRow[] = [
  {
    id: 'value-k_live_ab12',
    typeLabel: 'API Key',
    label: 'k_live_ab12',
    isUnattributed: false,
    amountCents: '1500',
    chargesUsageByFilterPage: [[opusUsage(12, '1500'), defaultUsage(0)]],
  },
  {
    id: 'unattributed',
    typeLabel: 'Unattributed',
    label: 'No API Key',
    isUnattributed: true,
    amountCents: null,
    chargesUsageByFilterPage: [[]],
  },
]

type TableProps = Parameters<typeof AttributionFlatTable>[0]

const buildTable = (overrides: Partial<TableProps> = {}): JSX.Element => (
  <AttributionFlatTable
    rows={rows}
    totals={{
      amountCents: '2500',
      chargesUsageByFilterPage: [[opusUsage(20, '2500'), defaultUsage(3)]],
    }}
    columns={[]}
    chargeLabel={null}
    basis={AttributedUsageBasisEnum.Units}
    currency={CurrencyEnum.Usd}
    isLoading={false}
    {...overrides}
  />
)

const renderTable = (overrides: Partial<TableProps> = {}): ReturnType<typeof render> =>
  render(buildTable(overrides))

describe('AttributionFlatTable', () => {
  describe('GIVEN all charges are displayed', () => {
    describe('WHEN the table renders with units', () => {
      it('THEN should render one row per entity with its entity cell and total cell only', () => {
        renderTable()

        const tableRows = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)

        expect(tableRows).toHaveLength(2)
        expect(tableRows[0].querySelectorAll('td')).toHaveLength(2)
        expect(tableRows[0]).toHaveTextContent('k_live_ab12')
        expect(tableRows[0]).toHaveTextContent('12')
      })

      it('THEN should display a dash for an entity without usage', () => {
        renderTable()

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[1]).toHaveTextContent('-')
      })

      it('THEN should render the footer from the totals', () => {
        renderTable()

        expect(screen.getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)).toHaveTextContent('23')
      })
    })

    describe('WHEN the table renders with amounts', () => {
      it('THEN should format the totals in the currency', () => {
        renderTable({ basis: AttributedUsageBasisEnum.Amount })

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0]).toHaveTextContent('$15.00')
        expect(screen.getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)).toHaveTextContent('$25.00')
      })
    })
  })

  describe('GIVEN one split charge is displayed', () => {
    describe('WHEN the table renders', () => {
      it('THEN should render one cell per sub-column plus the entity and total cells', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        const firstRow = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0]

        expect(firstRow.querySelectorAll('td')).toHaveLength(4)
        expect(screen.getByText('Tokens')).toBeInTheDocument()
        expect(screen.getByText('opus')).toBeInTheDocument()
      })

      it('THEN should span the entities and total headers over both header rows', () => {
        const { container } = renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        const [chargeRow, subColumnRow] = Array.from(container.querySelectorAll('thead tr'))
        const chargeRowHeaders = Array.from(chargeRow.querySelectorAll('th'))
        const entitiesHeader = chargeRowHeaders[0]
        const totalHeader = chargeRowHeaders[chargeRowHeaders.length - 1]

        expect(entitiesHeader).toHaveAttribute('rowspan', '2')
        expect(entitiesHeader).toHaveTextContent(/\S/)
        expect(totalHeader).toHaveAttribute('rowspan', '2')
        expect(totalHeader).toHaveTextContent(/\S/)
        expect(subColumnRow.querySelectorAll('th')).toHaveLength(splitColumns.length)
      })

      it('THEN should render the footer sub-column totals from the totals', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        const footerCells = screen
          .getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)
          .querySelectorAll('td')

        expect(footerCells[1]).toHaveTextContent('20')
        expect(footerCells[2]).toHaveTextContent('3')
        expect(footerCells[3]).toHaveTextContent('23')
      })

      // Guards the function cells whose plain string the kit's text wrapper never styles.
      it.each([
        ['row value', () => screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0], 1, '12'],
        ['row total', () => screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0], 3, '12'],
        ['footer value', () => screen.getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID), 2, '3'],
        ['footer total', () => screen.getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID), 3, '23'],
      ])('THEN should render the %s as body text', (_, getRow, cellIndex, value) => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        const cell = getRow().querySelectorAll('td')[cellIndex]

        expect(cell.querySelector('[data-test="body"]')).toHaveTextContent(value)
      })
    })

    describe('WHEN there is no show more for the columns', () => {
      it('THEN should not display it', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        expect(screen.queryByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN show more is available', () => {
      it('THEN should call it when clicked', async () => {
        const user = userEvent.setup()
        const onClick = jest.fn()

        renderTable({
          columns: splitColumns,
          chargeLabel: 'Tokens',
          showMoreColumns: { isExpanded: false, onClick },
        })

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(onClick).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['loading', { isExpanded: true as const, isLoading: true, isDisabled: false }],
        ['disabled', { isExpanded: true as const, isLoading: false, isDisabled: true }],
      ])('THEN should disable it while %s', (_, state) => {
        renderTable({
          columns: splitColumns,
          chargeLabel: 'Tokens',
          showMoreColumns: { ...state, onClick: jest.fn() },
        })

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toBeDisabled()
      })

      it('THEN should not show a loading spinner while the tree is busy', () => {
        renderTable({
          columns: splitColumns,
          chargeLabel: 'Tokens',
          showMoreColumns: {
            isExpanded: true,
            isLoading: false,
            isDisabled: true,
            onClick: jest.fn(),
          },
        })

        expect(
          screen
            .getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)
            .querySelector('[data-test^="processing/"]'),
        ).not.toBeInTheDocument()
      })

      // Guards the header remount that drops the focused show more button on rerender.
      it('THEN should keep the focus on show more once the columns are expanded', async () => {
        const user = userEvent.setup()
        const onClick = jest.fn()
        const tableProps = { columns: splitColumns, chargeLabel: 'Tokens' }

        const { rerender } = renderTable({
          ...tableProps,
          showMoreColumns: { isExpanded: false, onClick },
        })

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        rerender(
          buildTable({
            ...tableProps,
            showMoreColumns: { isExpanded: true, isLoading: false, isDisabled: false, onClick },
          }),
        )

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toHaveFocus()
      })
    })

    describe('WHEN a column belongs to a filter page a row has not received yet', () => {
      const columns = [splitColumns[0], secondPageColumn, splitColumns[1]]

      it('THEN should render a loading cell for that column only', () => {
        renderTable({ columns, chargeLabel: 'Tokens' })

        const [firstRow] = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)
        const cells = firstRow.querySelectorAll('td')

        expect(
          cells[2].querySelector(`[data-test="${ATTRIBUTION_LOADING_CELL_TEST_ID}"]`),
        ).toBeInTheDocument()
        expect(cells[2]).not.toHaveTextContent('-')
        expect(cells[1]).toHaveTextContent('12')
      })

      it('THEN should render the value once the row has the filter page', () => {
        renderTable({
          columns,
          chargeLabel: 'Tokens',
          rows: [
            {
              ...rows[0],
              chargesUsageByFilterPage: [
                [opusUsage(12, '1500'), defaultUsage(0)],
                [sonnetUsage(5), defaultUsage(0)],
              ],
            },
          ],
        })

        const cells = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0].querySelectorAll('td')

        expect(
          cells[2].querySelector(`[data-test="${ATTRIBUTION_LOADING_CELL_TEST_ID}"]`),
        ).not.toBeInTheDocument()
        expect(cells[2]).toHaveTextContent('5')
      })

      it('THEN should show the split charge units of the API as the total', () => {
        renderTable({
          columns,
          chargeLabel: 'Tokens',
          rows: [
            {
              ...rows[0],
              splitChargeUnits: 40,
              chargesUsageByFilterPage: [
                [opusUsage(12, '1500'), defaultUsage(1)],
                [sonnetUsage(5), defaultUsage(1)],
              ],
            },
          ],
        })

        const cells = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0].querySelectorAll('td')

        expect(cells[cells.length - 1]).toHaveTextContent('40')
      })
    })
  })

  describe('GIVEN more rows can be loaded', () => {
    describe('WHEN the table renders', () => {
      it('THEN should place the show more row right before the unattributed row', () => {
        renderTable({ loadMore: { isLoading: false, onLoadMore: jest.fn() } })

        const loadMoreRow = screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID).closest('tr')
        const [valueRow, unattributedRow] = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)

        expect(valueRow.nextElementSibling).toBe(loadMoreRow)
        expect(loadMoreRow?.nextElementSibling).toBe(unattributedRow)
      })
    })

    describe('WHEN clicking show more', () => {
      it('THEN should request the next rows', async () => {
        const user = userEvent.setup()
        const onLoadMore = jest.fn()

        renderTable({ loadMore: { isLoading: false, onLoadMore } })

        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        expect(onLoadMore).toHaveBeenCalledTimes(1)
      })

      // Guards the entity cell remount that drops the focused show more button on rerender.
      it('THEN should keep the focus on show more once more rows are loaded', async () => {
        const user = userEvent.setup()
        const loadMore = { isLoading: false, onLoadMore: jest.fn() }

        const { rerender } = renderTable({ loadMore })

        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        rerender(
          buildTable({
            loadMore,
            rows: [{ ...rows[0], id: 'value-k_live_cd34', label: 'k_live_cd34' }, ...rows],
          }),
        )

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)).toHaveLength(3)
        expect(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).toHaveFocus()
      })
    })

    describe('WHEN the next rows are loading', () => {
      it('THEN should disable show more', () => {
        renderTable({ loadMore: { isLoading: true, onLoadMore: jest.fn() } })

        expect(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN no more rows can be loaded', () => {
    it('THEN should not render the show more row', () => {
      renderTable()

      expect(screen.queryByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the usage is loading', () => {
    describe('WHEN the table renders', () => {
      it('THEN should not render entity rows nor the footer', () => {
        renderTable({ isLoading: true })

        expect(screen.queryByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
