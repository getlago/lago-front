import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeeTypesEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import type { WalletScopeSlice } from '../walletFormSchema'
import {
  WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID,
  WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID,
  WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID,
  WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID,
  WalletScopeFields,
} from '../WalletScopeFields'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const emptyScope: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

const TestWrapper = ({ initialValues = emptyScope }: { initialValues?: WalletScopeSlice }) => {
  const form = useAppForm({ defaultValues: initialValues })

  return <WalletScopeFields form={form} />
}

// The fee-type "all selected" info alert renders with the design-system default.
const FEE_TYPE_ALERT_TEST_ID = 'alert-type-info'

describe('WalletScopeFields', () => {
  describe('GIVEN the scope slice is empty', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show both add buttons and no chips', () => {
        render(<TestWrapper />)

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID),
        ).toBeInTheDocument()
        expect(screen.queryByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should not show the all-selected alert and the fee-type add button is enabled', () => {
        render(<TestWrapper />)

        expect(screen.queryByTestId(FEE_TYPE_ALERT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN some fee types are already selected', () => {
    describe('WHEN one fee type is selected', () => {
      it('THEN should render one chip and keep the add button enabled', () => {
        render(<TestWrapper initialValues={{ ...emptyScope, feeTypes: [FeeTypesEnum.Charge] }} />)

        const chips = screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(1)
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).not.toBeDisabled()
        expect(screen.queryByTestId(FEE_TYPE_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN all fee types are selected', () => {
      it('THEN should show the all-selected alert and disable the add button', () => {
        render(
          <TestWrapper
            initialValues={{
              ...emptyScope,
              feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment, FeeTypesEnum.Subscription],
            }}
          />,
        )

        expect(screen.getByTestId(FEE_TYPE_ALERT_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN deleting a selected fee-type chip', () => {
      it('THEN should remove that chip', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initialValues={{
              ...emptyScope,
              feeTypes: [FeeTypesEnum.Charge, FeeTypesEnum.Commitment],
            }}
          />,
        )

        const chips = screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID)

        expect(chips.children).toHaveLength(2)

        // Chip root carries role="button"; its delete control is the nested
        // <button data-test="button">, so target that rather than the chip itself.
        const [firstDeleteButton] = within(chips).getAllByTestId('button')

        await user.click(firstDeleteButton)

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CHIPS_TEST_ID).children).toHaveLength(1)
      })
    })
  })

  describe('GIVEN the fee-type combobox toggle', () => {
    describe('WHEN clicking the add button', () => {
      it('THEN should reveal the combobox', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID))

        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN cancelling the combobox', () => {
      it('THEN should hide the combobox and restore the add button', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_CANCEL_BUTTON_TEST_ID))

        expect(screen.queryByTestId(WALLET_SCOPE_FEE_TYPE_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(WALLET_SCOPE_FEE_TYPE_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN some billable metrics are already selected', () => {
    describe('WHEN codes are present without loaded metric data', () => {
      it('THEN should render one chip per code', () => {
        render(
          <TestWrapper
            initialValues={{ ...emptyScope, billableMetricCodes: ['cpu', 'storage'] }}
          />,
        )

        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_CHIPS_TEST_ID).children,
        ).toHaveLength(2)
      })
    })

    describe('WHEN clicking the billable-metric add button', () => {
      it('THEN should reveal the billable-metric combobox', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_ADD_BUTTON_TEST_ID))

        expect(
          screen.getByTestId(WALLET_SCOPE_BILLABLE_METRIC_COMBOBOX_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })
})
