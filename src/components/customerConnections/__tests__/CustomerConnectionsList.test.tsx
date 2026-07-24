import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  CustomerConnectionRow,
  CustomerConnectionsList,
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

const openRowMenu = async (category: ConnectionCategory) => {
  await userEvent.click(screen.getByTestId(getCustomerConnectionMenuTestId(category)))
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
          screen.queryByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment)),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are rows', () => {
    describe('WHEN the list renders', () => {
      it.each([
        ['payment row', ConnectionCategory.Payment],
        ['accounting row', ConnectionCategory.Accounting],
      ])('THEN should render the %s', (_, category) => {
        render(<CustomerConnectionsList rows={ROWS} />)

        expect(screen.getByTestId(getCustomerConnectionRowTestId(category))).toBeInTheDocument()
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

        const row = screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment))
        const [contentButton] = within(row).getAllByRole('button')

        await userEvent.click(contentButton)

        expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
      })
    })

    describe('WHEN Enter is pressed on the focused row', () => {
      it('THEN should call onRowClick with the row', async () => {
        const onRowClick = jest.fn()

        render(<CustomerConnectionsList rows={ROWS} onRowClick={onRowClick} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment))
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

        const row = screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment))
        const [contentButton] = within(row).getAllByRole('button')

        contentButton.focus()
        await userEvent.keyboard(' ')

        expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
      })
    })

    describe('WHEN the row is not interactive (no onRowClick)', () => {
      it('THEN should not expose the button role on the row', () => {
        render(<CustomerConnectionsList rows={ROWS} />)

        const row = screen.getByTestId(getCustomerConnectionRowTestId(ConnectionCategory.Payment))

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

        await openRowMenu(ConnectionCategory.Payment)
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

        await openRowMenu(ConnectionCategory.Payment)
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

        await openRowMenu(ConnectionCategory.Payment)

        expect(onRowClick).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN no edit handler', () => {
    describe('WHEN the menu is opened', () => {
      it('THEN should not render the Edit entry', async () => {
        render(<CustomerConnectionsList rows={ROWS} onDelete={jest.fn()} />)

        await userEvent.click(
          screen.getByTestId(getCustomerConnectionMenuTestId(ConnectionCategory.Payment)),
        )
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete connection/i })).toBeVisible()
        })

        expect(screen.queryByRole('button', { name: /edit connection/i })).not.toBeInTheDocument()
      })
    })
  })
})
