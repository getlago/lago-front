import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import {
  EDIT_PM_DIALOG_MANUAL_RADIO_TEST_ID,
  EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID,
  EDIT_PM_DIALOG_SPECIFIC_RADIO_TEST_ID,
  EditPaymentMethodDialog,
} from '../EditPaymentMethodDialog'
import { SelectedPaymentMethod } from '../types'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

jest.mock('~/components/paymentMethodSelection/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: jest.fn(() => <div data-testid="payment-method-combobox" />),
}))

const mockSetSelectedPaymentMethod = jest.fn()
const mockOnClose = jest.fn()

const paymentMethod1 = createMockPaymentMethod({
  id: 'pm_001',
  isDefault: true,
  details: {
    __typename: 'PaymentMethodDetails',
    brand: 'visa',
    last4: '4242',
    type: 'card',
    expirationMonth: '12',
    expirationYear: '2025',
  },
})

const paymentMethodsList: PaymentMethodList = [paymentMethod1]

type PrepareType = {
  open?: boolean
  selectedPaymentMethod?: SelectedPaymentMethod
  paymentMethodsList?: PaymentMethodList
  viewType?: string
}

function prepare({
  open = true,
  selectedPaymentMethod,
  paymentMethodsList: list = paymentMethodsList,
  viewType = 'subscription',
}: PrepareType = {}) {
  return render(
    <EditPaymentMethodDialog
      open={open}
      onClose={mockOnClose}
      selectedPaymentMethod={selectedPaymentMethod}
      setSelectedPaymentMethod={mockSetSelectedPaymentMethod}
      paymentMethodsList={list}
      viewType={viewType}
    />,
  )
}

describe('EditPaymentMethodDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN saving with FALLBACK behavior', () => {
    it('THEN calls setSelectedPaymentMethod with fallback values and closes dialog', async () => {
      prepare()

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      // Find and click the save button
      const saveButton = screen.getByTestId(EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID)

      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith({
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        })
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN saving with MANUAL behavior', () => {
    it('THEN calls setSelectedPaymentMethod with manual values and closes dialog', async () => {
      prepare()

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      // Find the MANUAL radio button container and click the radio input inside
      const manualRadioContainer = screen.getByTestId(EDIT_PM_DIALOG_MANUAL_RADIO_TEST_ID)
      const manualRadioInput = manualRadioContainer.querySelector(
        'input[type="radio"]',
      ) as HTMLElement

      await userEvent.click(manualRadioInput)

      // Click save button
      const saveButton = screen.getByTestId(EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID)

      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith({
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Manual,
        })
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN behavior is SPECIFIC and paymentMethodId is empty', () => {
    it('THEN disables save button', async () => {
      prepare()

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      // Initially save button should be enabled (FALLBACK behavior)
      let saveButton = screen.getByTestId(EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID)

      expect(saveButton).not.toBeDisabled()

      // Find the SPECIFIC radio button container and click the radio input inside
      const specificRadioContainer = screen.getByTestId(EDIT_PM_DIALOG_SPECIFIC_RADIO_TEST_ID)
      const specificRadioInput = specificRadioContainer.querySelector(
        'input[type="radio"]',
      ) as HTMLElement

      await userEvent.click(specificRadioInput)

      // Wait for the component to update
      await waitFor(() => {
        saveButton = screen.getByTestId(EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID)
        // Save button should be disabled when SPECIFIC is selected but no payment method is chosen
        expect(saveButton).toBeDisabled()
      })
    })
  })
})
