import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  CustomerConnectionRow,
  CustomerConnectionsList,
  getCustomerConnectionGroupTestId,
  getCustomerConnectionMenuTestId,
  getCustomerConnectionRowTestId,
} from '../CustomerConnectionsList'
import { ConnectionCategory } from '../types'

const ROWS: CustomerConnectionRow[] = [
  {
    id: 'payment-1',
    category: ConnectionCategory.Payment,
    name: 'Stripe',
    code: 'stripe-1',
    icon: null,
  },
  {
    id: 'accounting-1',
    category: ConnectionCategory.Accounting,
    name: 'NetSuite',
    code: 'ns-1',
    icon: null,
  },
]

/** Master-detail rows: categories deliberately scrambled */
const GROUPED_ROWS: CustomerConnectionRow[] = [
  {
    id: 'tax-1',
    category: ConnectionCategory.Tax,
    name: 'Anrok',
    code: 'anrok-1',
    icon: null,
  },
  {
    id: 'payment-1',
    category: ConnectionCategory.Payment,
    name: 'Stripe',
    code: 'stripe-1',
    icon: null,
  },
]

const openRowMenu = async (rowId: string) => {
  await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId(rowId)))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /edit connection/i })).toBeVisible()
  })
}

describe('CustomerConnectionsList', () => {
  describe('GIVEN there are no rows', () => {
    describe('WHEN the list renders', () => {
      it('THEN should render nothing', () => {
        const { container } = render(<CustomerConnectionsList rows={[]} />)

        expect(container).toBeEmptyDOMElement()
        expect(
          screen.queryByTestId(getCustomerConnectionRowTestId('payment-1')),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are rows', () => {
    describe('WHEN the list renders', () => {
      it.each([
        ['payment row', 'payment-1'],
        ['accounting row', 'accounting-1'],
      ])('THEN should render the %s', (_, rowId) => {
        render(<CustomerConnectionsList rows={ROWS} />)

        expect(screen.getByTestId(getCustomerConnectionRowTestId(rowId))).toBeInTheDocument()
      })

      it('THEN should display the connection name and code', () => {
        render(<CustomerConnectionsList rows={ROWS} />)

        expect(screen.getByText('Stripe')).toBeInTheDocument()
        expect(screen.getByText('stripe-1')).toBeInTheDocument()
        expect(screen.getByText('NetSuite')).toBeInTheDocument()
        expect(screen.getByText('ns-1')).toBeInTheDocument()
      })
    })

    describe('WHEN showTypeColumn is true (default)', () => {
      it('THEN should display the Type header', () => {
        render(<CustomerConnectionsList rows={ROWS} />)

        expect(screen.getByText('Type')).toBeInTheDocument()
      })
    })

    describe('WHEN showTypeColumn is false', () => {
      it('THEN should not display the Type header', () => {
        render(<CustomerConnectionsList rows={ROWS} showTypeColumn={false} />)

        expect(screen.queryByText('Type')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an onRowClick handler', () => {
    describe('WHEN the row is clicked', () => {
      it('THEN should call onRowClick with the clicked row', async () => {
        const onRowClick = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onRowClick={onRowClick} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))
        const [contentButton] = within(row).getAllByRole('button')

        await userEvent.click(contentButton)

        expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
      })
    })

    describe('WHEN Enter is pressed on the focused row', () => {
      it('THEN should call onRowClick with the row', async () => {
        const onRowClick = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onRowClick={onRowClick} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))
        const [contentButton] = within(row).getAllByRole('button')

        contentButton.focus()
        await userEvent.keyboard('{Enter}')

        expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
      })
    })

    describe('WHEN Space is pressed on the focused row', () => {
      it('THEN should call onRowClick with the row', async () => {
        const onRowClick = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onRowClick={onRowClick} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))
        const [contentButton] = within(row).getAllByRole('button')

        contentButton.focus()
        await userEvent.keyboard(' ')

        expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
      })
    })

    describe('WHEN the row is not interactive (no onRowClick)', () => {
      it('THEN should not expose the button role on the row', () => {
        render(<CustomerConnectionsList rows={ROWS} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))

        expect(row).not.toHaveAttribute('role', 'button')
      })
    })
  })

  describe('GIVEN edit and delete handlers', () => {
    describe('WHEN the Edit entry is clicked', () => {
      it('THEN should call onEdit with the row', async () => {
        const onEdit = jest.fn()
        const onDelete = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onEdit={onEdit} onDelete={onDelete} />)

        await openRowMenu('payment-1')
        await userEvent.click(screen.getByRole('button', { name: /edit connection/i }))

        expect(onEdit).toHaveBeenCalledWith(ROWS[0])
        expect(onDelete).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the Delete entry is clicked', () => {
      it('THEN should call onDelete with the row', async () => {
        const onEdit = jest.fn()
        const onDelete = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onEdit={onEdit} onDelete={onDelete} />)

        await openRowMenu('payment-1')
        await userEvent.click(screen.getByRole('button', { name: /delete connection/i }))

        expect(onDelete).toHaveBeenCalledWith(ROWS[0])
        expect(onEdit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the menu opener is clicked on a row with onRowClick', () => {
      it('THEN should not propagate the click to onRowClick', async () => {
        const onRowClick = jest.fn()

        render(
          <CustomerConnectionsList
            rows={ROWS}
            onRowClick={onRowClick}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
          />,
        )

        await openRowMenu('payment-1')

        expect(onRowClick).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no edit handler', () => {
    describe('WHEN the menu is opened', () => {
      it('THEN should not render the Edit entry', async () => {
        render(<CustomerConnectionsList rows={ROWS} onDelete={jest.fn()} />)

        await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId('payment-1')))
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete connection/i })).toBeVisible()
        })

        expect(screen.queryByRole('button', { name: /edit connection/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the grouped master-detail configuration', () => {
    describe('WHEN the list renders', () => {
      it.each([
        ['payment group', ConnectionCategory.Payment],
        ['tax group', ConnectionCategory.Tax],
      ])('THEN should render the %s header', (_, category) => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped />)

        expect(screen.getByTestId(getCustomerConnectionGroupTestId(category))).toBeInTheDocument()
      })

      it.each([
        ['accounting', ConnectionCategory.Accounting],
        ['crm', ConnectionCategory.Crm],
      ])('THEN should not render the empty %s group header', (_, category) => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped />)

        expect(
          screen.queryByTestId(getCustomerConnectionGroupTestId(category)),
        ).not.toBeInTheDocument()
      })

      it('THEN should render the groups in the fixed Payment → Tax order', () => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped />)

        const paymentGroup = screen.getByTestId(
          getCustomerConnectionGroupTestId(ConnectionCategory.Payment),
        )
        const taxGroup = screen.getByTestId(
          getCustomerConnectionGroupTestId(ConnectionCategory.Tax),
        )

        expect(
          paymentGroup.compareDocumentPosition(taxGroup) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      })

      it('THEN should render the rows under their group', () => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped />)

        const paymentRow = screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))
        const taxGroup = screen.getByTestId(
          getCustomerConnectionGroupTestId(ConnectionCategory.Tax),
        )

        // The payment row renders before the tax group header
        expect(
          paymentRow.compareDocumentPosition(taxGroup) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      })
    })

    describe('WHEN showStatusColumn is set', () => {
      it('THEN should display the Status header', () => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped showStatusColumn />)

        expect(screen.getByText('Status')).toBeInTheDocument()
      })
    })

    describe('WHEN a row is selected', () => {
      it('THEN should mark only that row as selected', () => {
        render(<CustomerConnectionsList rows={GROUPED_ROWS} grouped selectedRowId="tax-1" />)

        expect(screen.getByTestId(getCustomerConnectionRowTestId('tax-1'))).toHaveAttribute(
          'data-state',
          'selected',
        )
        expect(screen.getByTestId(getCustomerConnectionRowTestId('payment-1'))).not.toHaveAttribute(
          'data-state',
        )
      })
    })
  })
})
