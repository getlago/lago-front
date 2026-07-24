import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddConnectionMenu } from '~/components/customerConnections/AddConnectionMenu'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { render } from '~/test-utils'

const OPENER_LABEL = /add a connection/i

const CATEGORY_LABELS: Array<[ConnectionCategory, RegExp]> = [
  [ConnectionCategory.Payment, /payment provider/i],
  [ConnectionCategory.Accounting, /accounting provider/i],
  [ConnectionCategory.Tax, /tax provider/i],
  [ConnectionCategory.Crm, /crm connection/i],
]

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: OPENER_LABEL }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /payment provider/i })).toBeVisible()
  })
}

describe('AddConnectionMenu', () => {
  describe('GIVEN the menu is rendered with default props', () => {
    describe('WHEN in initial state', () => {
      it('THEN should display the opener button', async () => {
        await act(() => render(<AddConnectionMenu onSelect={jest.fn()} />))

        expect(screen.getByRole('button', { name: OPENER_LABEL })).toBeInTheDocument()
      })

      it('THEN should not render category entries before the opener is clicked', async () => {
        await act(() => render(<AddConnectionMenu onSelect={jest.fn()} />))

        expect(screen.queryByRole('button', { name: /payment provider/i })).not.toBeInTheDocument()
      })
    })

    describe('WHEN the opener is clicked', () => {
      it.each(CATEGORY_LABELS)('THEN should show the %s category button', async (_, label) => {
        await act(() => render(<AddConnectionMenu onSelect={jest.fn()} />))

        await openMenu()

        expect(screen.getByRole('button', { name: label })).toBeVisible()
      })

      it('THEN should list the four categories in MENU_ORDER (payment → accounting → tax → CRM)', async () => {
        await act(() => render(<AddConnectionMenu onSelect={jest.fn()} />))

        await openMenu()

        const categoryButtons = screen
          .getAllByRole('button')
          .filter((btn) => btn.textContent && !OPENER_LABEL.test(btn.textContent))
          .map((btn) => btn.textContent)

        expect(categoryButtons).toEqual([
          'Payment provider',
          'Accounting provider',
          'Tax provider',
          'CRM connection',
        ])
      })
    })
  })

  describe('GIVEN a user selects a category', () => {
    it.each(CATEGORY_LABELS)(
      'WHEN clicking the %s entry THEN onSelect is called with the matching enum value and a closePopper util',
      async (category, label) => {
        const onSelect = jest.fn()

        await act(() => render(<AddConnectionMenu onSelect={onSelect} />))
        await openMenu()

        await userEvent.click(screen.getByRole('button', { name: label }))

        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith(
          category,
          expect.objectContaining({ closePopper: expect.any(Function) }),
        )
      },
    )

    describe('WHEN the consumer invokes the provided closePopper util', () => {
      it('THEN should close the popper', async () => {
        const onSelect = jest.fn<void, [ConnectionCategory, { closePopper: () => void }]>(
          (_, { closePopper }) => closePopper(),
        )

        await act(() => render(<AddConnectionMenu onSelect={onSelect} />))
        await openMenu()

        await userEvent.click(screen.getByRole('button', { name: /payment provider/i }))

        await waitFor(() => {
          expect(
            screen.queryByRole('button', { name: /payment provider/i }),
          ).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the whole menu is disabled', () => {
    describe('WHEN the disabled prop is true', () => {
      it('THEN should disable the opener button', async () => {
        await act(() => render(<AddConnectionMenu disabled onSelect={jest.fn()} />))

        expect(screen.getByRole('button', { name: OPENER_LABEL })).toBeDisabled()
      })
    })
  })

  describe('GIVEN some categories are already used', () => {
    describe('WHEN disabledCategories lists a subset of the categories', () => {
      it('THEN should disable only the listed entries and keep the rest enabled', async () => {
        await act(() =>
          render(
            <AddConnectionMenu
              disabledCategories={[ConnectionCategory.Payment, ConnectionCategory.Tax]}
              onSelect={jest.fn()}
            />,
          ),
        )
        await openMenu()

        expect(screen.getByRole('button', { name: /payment provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /tax provider/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /accounting provider/i })).toBeEnabled()
        expect(screen.getByRole('button', { name: /crm connection/i })).toBeEnabled()
      })

      it('THEN should not invoke onSelect when a disabled entry is clicked', async () => {
        const onSelect = jest.fn()

        await act(() =>
          render(
            <AddConnectionMenu
              disabledCategories={[ConnectionCategory.Payment]}
              onSelect={onSelect}
            />,
          ),
        )
        await openMenu()

        // fireEvent bypasses user-event's pointer-events check; the point of
        // the assertion is that the disabled attribute itself blocks onSelect.
        fireEvent.click(screen.getByRole('button', { name: /payment provider/i }))

        expect(onSelect).not.toHaveBeenCalled()
      })
    })

    describe('WHEN disabledCategories is undefined', () => {
      it('THEN should render all category entries as enabled', async () => {
        await act(() => render(<AddConnectionMenu onSelect={jest.fn()} />))
        await openMenu()

        CATEGORY_LABELS.forEach(([, label]) => {
          expect(screen.getByRole('button', { name: label })).toBeEnabled()
        })
      })
    })
  })
})
