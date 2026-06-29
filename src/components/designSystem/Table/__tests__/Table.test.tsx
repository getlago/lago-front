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

const renderTable = () =>
  render(
    <Table
      name="test"
      data={data}
      containerSize={0}
      columns={[{ key: 'label', title: 'Label', content: (row) => row.label }]}
      onRowActionLink={(row) => (row.id === 'clickable' ? '/clickable-target' : '')}
    />,
  )

describe('Table onRowActionLink per-row clickability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a row whose link is truthy', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should navigate to the link', async () => {
        const user = userEvent.setup()

        renderTable()

        await user.click(screen.getByTestId('table-row-0'))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/clickable-target')
      })
    })
  })

  describe('GIVEN a row whose link is falsy', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should not navigate', async () => {
        const user = userEvent.setup()

        renderTable()

        await user.click(screen.getByTestId('table-row-1'))

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
