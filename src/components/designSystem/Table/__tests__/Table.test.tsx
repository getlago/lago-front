import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Table } from '~/components/designSystem/Table/Table'
import { render, testMockNavigateFn } from '~/test-utils'

interface Row {
  id: string
  label: string
}

const data: Array<Row> = [
  { id: 'clickable', label: 'Clickable row' },
  { id: 'blocked', label: 'Blocked row' },
]

const columns = [{ key: 'label' as const, title: 'Label', content: (row: Row) => row.label }]

describe('Table per-row clickability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN onRowActionLink with no isRowClickable predicate', () => {
    describe('WHEN a row is clicked', () => {
      it('THEN should navigate to the link', async () => {
        const user = userEvent.setup()

        render(
          <Table
            name="test"
            data={data}
            containerSize={0}
            columns={columns}
            onRowActionLink={(row) => `/target/${row.id}`}
          />,
        )

        await user.click(screen.getByTestId('table-row-0'))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/target/clickable')
      })
    })
  })

  describe('GIVEN an isRowClickable predicate that blocks one row', () => {
    const renderTable = () =>
      render(
        <Table
          name="test"
          data={data}
          containerSize={0}
          columns={columns}
          onRowActionLink={(row) => `/target/${row.id}`}
          isRowClickable={(row) => row.id === 'clickable'}
        />,
      )

    describe('WHEN the allowed row is clicked', () => {
      it('THEN should navigate', async () => {
        const user = userEvent.setup()

        renderTable()

        await user.click(screen.getByTestId('table-row-0'))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/target/clickable')
      })
    })

    describe('WHEN the blocked row is clicked', () => {
      it('THEN should not navigate', async () => {
        const user = userEvent.setup()

        renderTable()

        await user.click(screen.getByTestId('table-row-1'))

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN onRowActionLink that returns an empty string', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should not navigate (falsy-link guard)', async () => {
        const user = userEvent.setup()

        render(
          <Table
            name="test"
            data={[{ id: 'a', label: 'A' }]}
            containerSize={0}
            columns={columns}
            onRowActionLink={() => ''}
          />,
        )

        await user.click(screen.getByTestId('table-row-0'))

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
