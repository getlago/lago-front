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
  ATTRIBUTION_SHOW_MORE_TEST_ID,
  ATTRIBUTION_TABLE_FOOTER_TEST_ID,
  ATTRIBUTION_TABLE_ROW_TEST_ID,
  AttributionFlatTable,
  AttributionTableRow,
} from '../AttributionFlatTable'
import { AttributionColumn } from '../buildAttributionColumns'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
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
  { key: 'opus', chargeId: charge.id, chargeFilterId: 'filter-opus', label: 'opus' },
  { key: 'default', chargeId: charge.id, chargeFilterId: null, label: null },
]

const rows: AttributionTableRow[] = [
  {
    id: 'value-k_live_ab12',
    typeLabel: 'API Key',
    label: 'k_live_ab12',
    isUnattributed: false,
    amountCents: '1500',
    chargesUsage: [opusUsage(12, '1500'), defaultUsage(0)],
  },
  {
    id: 'unattributed',
    typeLabel: 'Unattributed',
    label: 'No API Key',
    isUnattributed: true,
    amountCents: null,
    chargesUsage: [],
  },
]

type TableProps = Parameters<typeof AttributionFlatTable>[0]

const renderTable = (overrides: Partial<TableProps> = {}): ReturnType<typeof render> =>
  render(
    <AttributionFlatTable
      rows={rows}
      totals={{ amountCents: '2500', chargesUsage: [opusUsage(20, '2500'), defaultUsage(3)] }}
      columns={[]}
      chargeLabel={null}
      hiddenColumnsCount={0}
      isExpanded={false}
      basis={AttributedUsageBasisEnum.Units}
      currency={CurrencyEnum.Usd}
      isLoading={false}
      onToggleExpanded={jest.fn()}
      {...overrides}
    />,
  )

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

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[1]).toHaveTextContent('—')
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

      it('THEN should render the footer sub-column totals from the totals', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        const footerCells = screen
          .getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)
          .querySelectorAll('td')

        expect(footerCells[1]).toHaveTextContent('20')
        expect(footerCells[2]).toHaveTextContent('3')
        expect(footerCells[3]).toHaveTextContent('23')
      })
    })

    describe('WHEN no sub-column is hidden and the table is collapsed', () => {
      it('THEN should not display the show more button', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens' })

        expect(screen.queryByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN some sub-columns are hidden', () => {
      it('THEN should toggle the expansion when clicking show more', async () => {
        const user = userEvent.setup()
        const onToggleExpanded = jest.fn()

        renderTable({
          columns: splitColumns,
          chargeLabel: 'Tokens',
          hiddenColumnsCount: 2,
          onToggleExpanded,
        })

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(onToggleExpanded).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the table is expanded', () => {
      it('THEN should still display the toggle to collapse it', () => {
        renderTable({ columns: splitColumns, chargeLabel: 'Tokens', isExpanded: true })

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toBeInTheDocument()
      })
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
