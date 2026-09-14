import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PM_FIELDS_MANUAL_RADIO_TEST_ID } from '~/components/paymentMethodSelection/PaymentMethodFields'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { PaymentMethodItem, PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import {
  CONNECTION_METHOD_DEFAULT_RADIO_TEST_ID,
  CONNECTION_METHOD_NO_DEFAULT_CHIP_TEST_ID,
  CONNECTION_METHOD_SPECIFIC_RADIO_TEST_ID,
  ConnectionPaymentMethodFields,
} from '../ConnectionPaymentMethodFields'

const PAYMENT_METHOD_COMBOBOX_TEST_ID = 'pm-combobox'

const DEFAULT_PAYMENT_METHOD = {
  id: 'pm_1',
  isDefault: true,
  details: { type: 'card', brand: 'visa', last4: '4242' },
} as PaymentMethodItem

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/paymentMethodSelection/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: () => <div data-test="pm-combobox" />,
}))

const renderFields = (
  props: Partial<React.ComponentProps<typeof ConnectionPaymentMethodFields>> = {},
) => {
  const onChange = jest.fn()

  render(
    <ConnectionPaymentMethodFields
      viewType={ViewTypeEnum.WalletTopUp}
      paymentMethodsList={[] as PaymentMethodList}
      defaultPaymentMethod={DEFAULT_PAYMENT_METHOD}
      value={undefined}
      onChange={onChange}
      {...props}
    />,
  )

  return { onChange }
}

const radioOf = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

describe('ConnectionPaymentMethodFields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the method sub-choice of a resolved connection', () => {
    describe('WHEN it renders', () => {
      it.each([
        ['default branch', CONNECTION_METHOD_DEFAULT_RADIO_TEST_ID],
        ['specific branch', CONNECTION_METHOD_SPECIFIC_RADIO_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderFields()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      // Manual lives at the connection level, so a manual method under a resolved connection is a
      // combination the payload cannot express.
      it('THEN should never offer the manual branch', () => {
        renderFields()

        expect(screen.queryByTestId(PM_FIELDS_MANUAL_RADIO_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should keep the combobox hidden until the specific branch is picked', () => {
        renderFields()

        expect(screen.queryByTestId(PAYMENT_METHOD_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the connection exposes no default payment method', () => {
      it('THEN should flag it under the default branch', () => {
        renderFields({ defaultPaymentMethod: undefined })

        expect(screen.getByTestId(CONNECTION_METHOD_NO_DEFAULT_CHIP_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the connection exposes a default payment method', () => {
      it('THEN should not flag it', () => {
        renderFields()

        expect(
          screen.queryByTestId(CONNECTION_METHOD_NO_DEFAULT_CHIP_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user picks the specific branch', () => {
      it('THEN should reveal the combobox and publish a provider-typed value', async () => {
        const user = userEvent.setup()
        const { onChange } = renderFields()

        await user.click(radioOf(CONNECTION_METHOD_SPECIFIC_RADIO_TEST_ID))

        expect(screen.getByTestId(PAYMENT_METHOD_COMBOBOX_TEST_ID)).toBeInTheDocument()
        expect(onChange).toHaveBeenCalledWith({
          paymentMethodId: undefined,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        })
      })
    })

    describe('WHEN the user goes back to the default branch', () => {
      it('THEN should publish the null method the backend reads as "customer default"', async () => {
        const user = userEvent.setup()
        const { onChange } = renderFields({
          value: {
            paymentMethodId: 'pm_1',
            paymentMethodType: PaymentMethodTypeEnum.Provider,
          },
        })

        await user.click(radioOf(CONNECTION_METHOD_DEFAULT_RADIO_TEST_ID))

        expect(onChange).toHaveBeenCalledWith({
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        })
      })
    })
  })
})
