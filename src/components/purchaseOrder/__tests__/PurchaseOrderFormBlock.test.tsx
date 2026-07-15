import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  PURCHASE_ORDER_ADD_BUTTON_TEST_ID,
  PURCHASE_ORDER_TRASH_BUTTON_TEST_ID,
} from '../PurchaseOrderButtons'
import {
  PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID,
  PurchaseOrderFormBlock,
} from '../PurchaseOrderFormBlock'

const onChange = jest.fn()

describe('PurchaseOrderFormBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no value is set', () => {
    it('THEN should render the add button and no input', () => {
      render(<PurchaseOrderFormBlock value={undefined} onChange={onChange} />)

      expect(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)).not.toBeInTheDocument()
    })

    describe('WHEN the add button is clicked', () => {
      it('THEN should reveal a focused inline input instead of opening a dialog', async () => {
        const user = userEvent.setup()

        render(<PurchaseOrderFormBlock value={undefined} onChange={onChange} />)

        await user.click(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID))

        const input = screen
          .getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)
          .querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
        expect(input).toHaveFocus()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.queryByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the input is revealed', () => {
    it('THEN typing should propagate the value through onChange', async () => {
      const user = userEvent.setup()

      render(<PurchaseOrderFormBlock value={undefined} onChange={onChange} />)

      await user.click(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID))
      await user.type(
        screen
          .getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)
          .querySelector('input') as HTMLInputElement,
        'P',
      )

      expect(onChange).toHaveBeenCalledWith('P')
    })

    describe('WHEN the trash button is clicked', () => {
      it('THEN should clear the value and collapse back to the add button', async () => {
        const user = userEvent.setup()

        render(<PurchaseOrderFormBlock value={undefined} onChange={onChange} />)

        await user.click(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(PURCHASE_ORDER_TRASH_BUTTON_TEST_ID))

        expect(onChange).toHaveBeenCalledWith(null)
        expect(
          screen.queryByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a value is already set (e.g. edit form prefill)', () => {
    it('THEN should show the input with the value and no add button', () => {
      render(<PurchaseOrderFormBlock value="PO-1234567890" onChange={onChange} />)

      const input = screen
        .getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)
        .querySelector('input') as HTMLInputElement

      expect(input).toHaveValue('PO-1234567890')
      expect(input).not.toHaveFocus()
      expect(screen.queryByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the value exceeds the max length', () => {
    it('THEN should display the max length error', () => {
      render(<PurchaseOrderFormBlock value={'a'.repeat(256)} onChange={onChange} />)

      expect(
        screen.getByText('Purchase order number must be 255 characters or fewer.'),
      ).toBeInTheDocument()
    })
  })
})
