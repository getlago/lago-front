import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { CustomerPaymentConnection } from '~/hooks/customer/useCustomerPaymentConnections'
import { render } from '~/test-utils'

import {
  CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID,
  ConnectionPaymentSettingsSelector,
} from '../ConnectionPaymentSettingsSelector'

const mockOpen = jest.fn()
const mockClose = jest.fn()

const PAYMENT_METHOD_COMBOBOX_TEST_ID = 'pm-combobox'
const CONNECTION_COMBOBOX_TEST_ID = 'connection-combobox'

const DEFAULT_CONNECTION: CustomerPaymentConnection = {
  id: 'conn-a',
  code: 'adyen_global',
  name: 'Adyen Global',
  provider: null,
  isDefault: true,
}

const OTHER_CONNECTION: CustomerPaymentConnection = {
  id: 'conn-b',
  code: 'stripe_eu',
  name: 'Stripe EU',
  provider: null,
  isDefault: false,
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

jest.mock('~/hooks/customer/useCustomerPaymentConnections', () => ({
  useCustomerPaymentConnections: () => ({
    connections: [DEFAULT_CONNECTION, OTHER_CONNECTION],
    options: [],
    defaultConnection: DEFAULT_CONNECTION,
    loading: false,
  }),
}))

jest.mock('~/hooks/customer/useConnectionPaymentMethodsList', () => ({
  useConnectionPaymentMethodsList: () => ({
    data: [],
    loading: false,
    error: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('~/components/paymentMethodSelection/PaymentMethodComboBox', () => ({
  PaymentMethodComboBox: () => <div data-test="pm-combobox" />,
}))

jest.mock('~/components/connectionSelection/CustomerPaymentConnectionComboBox', () => ({
  CustomerPaymentConnectionComboBox: ({ onChange }: { onChange: (code: string) => void }) => (
    <button
      data-test="connection-combobox"
      onClick={() => onChange('adyen_global')}
      type="button"
    />
  ),
}))

describe('ConnectionPaymentSettings method control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a specific connection routed to a specific payment method', () => {
    describe('WHEN the user swaps it for another specific connection', () => {
      it('THEN should reset the displayed method branch alongside the stored value', async () => {
        const user = userEvent.setup()
        const onChange = jest.fn()

        render(
          <ConnectionPaymentSettingsSelector
            viewType={ViewTypeEnum.WalletTopUp}
            customerId="customer-1"
            connection={{ code: OTHER_CONNECTION.code }}
            paymentMethod={{
              paymentMethodId: 'pm_1',
              paymentMethodType: PaymentMethodTypeEnum.Provider,
            }}
            onChange={onChange}
          />,
        )

        await user.click(screen.getByTestId(CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID))

        const opened = mockOpen.mock.calls.at(-1)?.[0] as {
          form: { submit: () => Promise<void> }
          children: ReactNode
        }

        render(<>{opened.children}</>)

        expect(screen.getByTestId(PAYMENT_METHOD_COMBOBOX_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(CONNECTION_COMBOBOX_TEST_ID))

        expect(screen.queryByTestId(PAYMENT_METHOD_COMBOBOX_TEST_ID)).not.toBeInTheDocument()

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: {
              paymentMethodId: null,
              paymentMethodType: PaymentMethodTypeEnum.Provider,
            },
          }),
        )
      })
    })
  })
})
