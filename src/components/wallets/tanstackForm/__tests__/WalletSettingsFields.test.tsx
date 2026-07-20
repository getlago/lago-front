import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletSettingsSlice } from '../walletFormSchema'
import {
  WALLET_SETTINGS_EXPIRATION_ADD_BUTTON_TEST_ID,
  WALLET_SETTINGS_EXPIRATION_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID,
  WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID,
  WALLET_SETTINGS_MIN_MAX_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_MIN_MAX_SECTION_TEST_ID,
  WALLET_SETTINGS_PO_ADD_BUTTON_TEST_ID,
  WALLET_SETTINGS_PO_DELETE_BUTTON_TEST_ID,
  WALLET_SETTINGS_PO_SECTION_TEST_ID,
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
  priority: 50,
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
        ['min/max', WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID],
        ['purchase order', WALLET_SETTINGS_PO_ADD_BUTTON_TEST_ID],
      ])('THEN should show the collapsed add button for %s', (_, testId) => {
        render(<TestWrapper />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['expiration', WALLET_SETTINGS_EXPIRATION_SECTION_TEST_ID],
        ['min/max', WALLET_SETTINGS_MIN_MAX_SECTION_TEST_ID],
        ['purchase order', WALLET_SETTINGS_PO_SECTION_TEST_ID],
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

  describe('GIVEN the min/max toggle', () => {
    describe('WHEN clicking the add button then the delete button', () => {
      it('THEN should open and then collapse the section', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_ADD_BUTTON_TEST_ID))
        expect(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_SECTION_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_DELETE_BUTTON_TEST_ID))
        expect(
          screen.queryByTestId(WALLET_SETTINGS_MIN_MAX_SECTION_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the purchase order toggle', () => {
    describe('WHEN clicking the add button then the delete button', () => {
      it('THEN should open and then collapse the section', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SETTINGS_PO_ADD_BUTTON_TEST_ID))
        expect(screen.getByTestId(WALLET_SETTINGS_PO_SECTION_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(WALLET_SETTINGS_PO_DELETE_BUTTON_TEST_ID))
        expect(screen.queryByTestId(WALLET_SETTINGS_PO_SECTION_TEST_ID)).not.toBeInTheDocument()
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
      it('THEN should open the min/max section on mount', () => {
        render(<TestWrapper initialValues={{ ...emptySettings, paidTopUpMinAmountCents: '10' }} />)

        expect(screen.getByTestId(WALLET_SETTINGS_MIN_MAX_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a purchase order number is set', () => {
      it('THEN should open the purchase order section on mount', () => {
        render(<TestWrapper initialValues={{ ...emptySettings, purchaseOrderNumber: 'PO-1' }} />)

        expect(screen.getByTestId(WALLET_SETTINGS_PO_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
