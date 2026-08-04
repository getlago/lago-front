import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  PURCHASE_ORDER_ADD_BUTTON_TEST_ID,
  PURCHASE_ORDER_TRASH_BUTTON_TEST_ID,
} from '~/components/purchaseOrder/PurchaseOrderButtons'
import { PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID } from '~/components/purchaseOrder/PurchaseOrderFormBlock'
import { PURCHASE_ORDER_TITLE_TEST_ID } from '~/components/purchaseOrder/PurchaseOrderTitle'
import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletSettingsSlice } from '../walletFormSchema'
import {
  WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID,
  WALLET_SETTINGS_EXPIRATION_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID,
  WALLET_SETTINGS_MAX_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_MAX_OPTION_TEST_ID,
  WALLET_SETTINGS_MAX_SECTION_TEST_ID,
  WALLET_SETTINGS_MIN_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID,
  WALLET_SETTINGS_MIN_OPTION_TEST_ID,
  WALLET_SETTINGS_MIN_SECTION_TEST_ID,
  WalletSettingsFields,
} from '../WalletSettingsFields'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const emptySettings: WalletSettingsSlice = {
  name: '',
  rateAmount: '1',
  priority: '50',
  expirationAt: null,
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
  purchaseOrderNumber: null,
}

const TestWrapper = ({
  initialValues = emptySettings,
}: {
  initialValues?: WalletSettingsSlice
}) => {
  const form = useAppForm({ defaultValues: initialValues })

  return (
    <WalletSettingsFields
      form={form}
      lockedCurrency={CurrencyEnum.Eur}
      initialValues={initialValues}
    />
  )
}

describe('WalletSettingsFields', () => {
  describe('GIVEN the settings slice is empty', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['expiration', WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID],
        ['purchase order', PURCHASE_ORDER_ADD_BUTTON_TEST_ID],
      ])('THEN should show the collapsed add button for %s', (_, testId) => {
        render(<TestWrapper />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['expiration', WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID],
        ['purchase order', PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID],
      ])('THEN should not show the %s section', (_, testId) => {
        render(<TestWrapper />)

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the expiration toggle', () => {
    describe('WHEN clicking the add button', () => {
      it('THEN should reveal the expiration section and hide the add button', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID))

        expect(screen.getByTestId(WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking the delete button on an open section', () => {
      it('THEN should collapse the section back to the add button', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(WALLET_SETTINGS_EXPIRATION_DELETE_BUTTON_TEST_ID))

        expect(
          screen.queryByTestId(WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.getByTestId(WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the purchase order toggle', () => {
    describe('WHEN clicking the add button then the delete button', () => {
      it('THEN should open and then collapse the shared purchase order block', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID))

        const poInput = screen.getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)

        expect(poInput).toBeInTheDocument()
        // The shared block renders `value || ''`, so the input mounts controlled
        // even though the slice value is still null.
        expect(within(poInput).getByRole('textbox')).toHaveValue('')

        await user.click(screen.getByTestId(PURCHASE_ORDER_TRASH_BUTTON_TEST_ID))
        expect(
          screen.queryByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN typing in the revealed input', () => {
      it('THEN should write the value into the form field', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(PURCHASE_ORDER_ADD_BUTTON_TEST_ID))

        const input = within(screen.getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)).getByRole(
          'textbox',
        )

        await user.type(input, 'PO-42')

        // The block is uncontrolled by itself: the value only survives keystrokes
        // because `onChange` writes it back into the `purchaseOrderNumber` field.
        expect(input).toHaveValue('PO-42')
      })
    })
  })

  describe('GIVEN initialValues carry optional fields', () => {
    describe('WHEN expirationAt is set', () => {
      it('THEN should open the expiration section on mount', () => {
        render(<TestWrapper initialValues={{ ...emptySettings, expirationAt: '2027-01-01' }} />)

        expect(screen.getByTestId(WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a min amount is set', () => {
      it('THEN should open the min section on mount', () => {
        render(<TestWrapper initialValues={{ ...emptySettings, paidTopUpMinAmountCents: '10' }} />)

        expect(screen.getByTestId(WALLET_SETTINGS_MIN_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a purchase order number is set', () => {
      it('THEN should open the purchase order block on mount', () => {
        render(<TestWrapper initialValues={{ ...emptySettings, purchaseOrderNumber: 'PO-1' }} />)

        expect(
          within(screen.getByTestId(PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID)).getByRole('textbox'),
        ).toHaveValue('PO-1')
      })
    })
  })

  describe('section headers', () => {
    it('renders persistent expiration/top-up/PO section titles even when collapsed', () => {
      render(<TestWrapper />)
      expect(screen.getByText('text_1748422458559n8iqcz37i2z')).toBeInTheDocument()
      expect(screen.getByText('text_1758285686646sieyihhzwak')).toBeInTheDocument()
      expect(screen.getByTestId(PURCHASE_ORDER_TITLE_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('min/max dropdown menu', () => {
    it('opens the menu and adds only the minimum field', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_OPTION_TEST_ID))

      const minSection = screen.getByTestId(WALLET_SETTINGS_MIN_SECTION_TEST_ID)

      expect(minSection).toBeInTheDocument()
      expect(screen.queryByTestId(WALLET_SETTINGS_MAX_SECTION_TEST_ID)).not.toBeInTheDocument()
      // Seeded to an empty string (not null) so the input mounts controlled from the start.
      expect(within(minSection).getByRole('textbox')).toHaveValue('')
    })

    it('removes the minimum field via its delete button', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_OPTION_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_DELETE_BUTTON_TEST_ID))

      expect(screen.queryByTestId(WALLET_SETTINGS_MIN_SECTION_TEST_ID)).not.toBeInTheDocument()
    })

    it('opens the menu and adds only the maximum field', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MAX_OPTION_TEST_ID))

      const maxSection = screen.getByTestId(WALLET_SETTINGS_MAX_SECTION_TEST_ID)

      expect(maxSection).toBeInTheDocument()
      expect(screen.queryByTestId(WALLET_SETTINGS_MIN_SECTION_TEST_ID)).not.toBeInTheDocument()
      // Seeded to an empty string (not null) so the input mounts controlled from the start.
      expect(within(maxSection).getByRole('textbox')).toHaveValue('')
    })

    it('removes the maximum field via its delete button', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MAX_OPTION_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MAX_DELETE_BUTTON_TEST_ID))

      expect(screen.queryByTestId(WALLET_SETTINGS_MAX_SECTION_TEST_ID)).not.toBeInTheDocument()
    })

    it('disables the opener button once both the minimum and maximum fields are shown', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_OPTION_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MAX_OPTION_TEST_ID))

      expect(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID)).toBeDisabled()
    })

    it('disables the option for a field that is already shown while leaving the other enabled', async () => {
      const user = userEvent.setup()

      render(<TestWrapper />)
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_OPTION_TEST_ID))
      await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))

      expect(screen.getByTestId(WALLET_SETTINGS_MIN_OPTION_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(WALLET_SETTINGS_MAX_OPTION_TEST_ID)).not.toBeDisabled()
    })
  })
})
