import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import { FiltersItemPurchaseOrderNumber } from '../FiltersItemPurchaseOrderNumber'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemPurchaseOrderNumber value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemPurchaseOrderNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays an empty text input', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })
  })

  describe('GIVEN an initial value', () => {
    it('THEN displays the value in the text input', async () => {
      renderComponent('PO-1234')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('PO-1234')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'PO-1234' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('PO-1234')
      })
    })
  })

  it('THEN caps the input at 255 characters', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '255')
    })
  })
})
