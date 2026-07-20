import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletRecurringSlice } from '../walletFormSchema'
import {
  WALLET_RECURRING_EXPIRATION_ADD_BUTTON_TEST_ID,
  WALLET_RECURRING_EXPIRATION_DELETE_BUTTON_TEST_ID,
  WALLET_RECURRING_EXPIRATION_SECTION_TEST_ID,
  WALLET_RECURRING_INTERVAL_COMBOBOX_TEST_ID,
  WALLET_RECURRING_METHOD_COMBOBOX_TEST_ID,
  WALLET_RECURRING_TRIGGER_COMBOBOX_TEST_ID,
  WalletRecurringTopUpFields,
} from '../WalletRecurringTopUpFields'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const baseSlice: WalletRecurringSlice = {
  enabled: false,
  method: RecurringTransactionMethodEnum.Fixed,
  transactionName: '',
  paidCredits: '',
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  targetOngoingBalance: '',
  trigger: RecurringTransactionTriggerEnum.Threshold,
  interval: RecurringTransactionIntervalEnum.Monthly,
  thresholdCredits: '',
  startedAt: null,
  expirationAt: null,
}

const TestWrapper = ({ initialValues = baseSlice }: { initialValues?: WalletRecurringSlice }) => {
  const form = useAppForm({ defaultValues: initialValues })

  return <WalletRecurringTopUpFields form={form} currency={CurrencyEnum.Eur} rateAmount="1" />
}

// The "all selected"/creation-summary info alert uses the design-system default.
const INFO_ALERT_TEST_ID = 'alert-type-info'

describe('WalletRecurringTopUpFields', () => {
  describe('GIVEN the default recurring slice', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show method and trigger comboboxes and the expiration add button', () => {
        render(<TestWrapper />)

        expect(screen.getByTestId(WALLET_RECURRING_METHOD_COMBOBOX_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(WALLET_RECURRING_TRIGGER_COMBOBOX_TEST_ID)).toBeInTheDocument()
        expect(
          screen.getByTestId(WALLET_RECURRING_EXPIRATION_ADD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should not show the interval combobox nor the summary alert (threshold empty)', () => {
        render(<TestWrapper />)

        expect(
          screen.queryByTestId(WALLET_RECURRING_INTERVAL_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(INFO_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the trigger is Interval', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show the interval combobox and the summary alert', () => {
        render(
          <TestWrapper
            initialValues={{
              ...baseSlice,
              trigger: RecurringTransactionTriggerEnum.Interval,
              interval: RecurringTransactionIntervalEnum.Monthly,
            }}
          />,
        )

        expect(screen.getByTestId(WALLET_RECURRING_INTERVAL_COMBOBOX_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(INFO_ALERT_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the trigger is Threshold with a threshold value', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show the summary alert and no interval combobox', () => {
        render(
          <TestWrapper
            initialValues={{
              ...baseSlice,
              trigger: RecurringTransactionTriggerEnum.Threshold,
              thresholdCredits: '10',
            }}
          />,
        )

        expect(screen.getByTestId(INFO_ALERT_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(WALLET_RECURRING_INTERVAL_COMBOBOX_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the expiration toggle', () => {
    describe('WHEN clicking the add button', () => {
      it('THEN should reveal the expiration section', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_RECURRING_EXPIRATION_ADD_BUTTON_TEST_ID))

        expect(screen.getByTestId(WALLET_RECURRING_EXPIRATION_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the delete button on an open section', () => {
      it('THEN should collapse back to the add button', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_RECURRING_EXPIRATION_ADD_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(WALLET_RECURRING_EXPIRATION_DELETE_BUTTON_TEST_ID))

        expect(
          screen.queryByTestId(WALLET_RECURRING_EXPIRATION_SECTION_TEST_ID),
        ).not.toBeInTheDocument()
        expect(
          screen.getByTestId(WALLET_RECURRING_EXPIRATION_ADD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })
})
