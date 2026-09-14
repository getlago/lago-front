import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  CONNECTION_FIELDS_SKIP_RADIO_TEST_ID,
  CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID,
} from '~/components/connectionSelection/ConnectionBehaviorFields'
import { ConnectionBehavior } from '~/components/connectionSelection/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { ConnectionBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'
import { CustomerPaymentConnection } from '~/hooks/customer/useCustomerPaymentConnections'
import { render } from '~/test-utils'

import {
  CONNECTION_DEFAULT_CHIP_TEST_ID,
  CONNECTION_MANUAL_DEFAULT_CHIP_TEST_ID,
  CONNECTION_NO_DEFAULT_CHIP_TEST_ID,
} from '../ConnectionPaymentSettingsDrawerContent'
import {
  CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID,
  CONNECTION_SUMMARY_KEY_BY_BEHAVIOR,
  ConnectionPaymentSettingsSelector,
} from '../ConnectionPaymentSettingsSelector'

const mockOpen = jest.fn()
const mockClose = jest.fn()

const PAYMENT_METHOD_FIELDS_TEST_ID = 'payment-method-fields'

const STRIPE_CONNECTION: CustomerPaymentConnection = {
  id: 'conn-1',
  code: 'stripe_eu',
  name: 'Stripe EU',
  provider: null,
  isDefault: true,
}

const mockConnections = { current: [STRIPE_CONNECTION] as CustomerPaymentConnection[] }
const mockIsDefaultManual = { current: false }
const mockPaymentMethods = {
  current: [] as Array<{ id: string; isDefault: boolean; paymentProviderCustomerId: string }>,
}
const mockPaymentMethodFieldsProps: { current: Record<string, unknown> | null } = { current: null }

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
    connections: mockConnections.current,
    options: [],
    defaultConnection: mockConnections.current.find((connection) => connection.isDefault),
    isDefaultManual: mockIsDefaultManual.current,
    loading: false,
  }),
}))

jest.mock('~/hooks/customer/usePaymentMethodsList', () => ({
  usePaymentMethodsList: () => ({
    data: mockPaymentMethods.current,
    loading: false,
    error: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('../ConnectionPaymentMethodFields', () => ({
  ConnectionPaymentMethodFields: (props: Record<string, unknown>) => {
    mockPaymentMethodFieldsProps.current = props

    return <div data-test="payment-method-fields" />
  },
}))

type OpenedDrawer = {
  form: { submit: () => Promise<void> }
  children: ReactNode
}

const openDrawerFromSelector = async (
  props: Partial<React.ComponentProps<typeof ConnectionPaymentSettingsSelector>> = {},
) => {
  const user = userEvent.setup()
  const onChange = jest.fn()

  render(
    <ConnectionPaymentSettingsSelector
      viewType={ViewTypeEnum.WalletTopUp}
      customerId="customer-1"
      externalCustomerId="ext-customer-1"
      connection={undefined}
      paymentMethod={undefined}
      onChange={onChange}
      {...props}
    />,
  )

  await user.click(screen.getByTestId(CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID))

  const opened = mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawer

  return { user, onChange, opened }
}

describe('ConnectionPaymentSettingsSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnections.current = [STRIPE_CONNECTION]
    mockIsDefaultManual.current = false
    mockPaymentMethods.current = []
    mockPaymentMethodFieldsProps.current = null
  })

  describe('GIVEN the selector is mounted', () => {
    describe('WHEN it renders', () => {
      it('THEN should display the entry card without opening the drawer', () => {
        render(
          <ConnectionPaymentSettingsSelector
            viewType={ViewTypeEnum.WalletTopUp}
            customerId="customer-1"
            externalCustomerId="ext-customer-1"
            connection={undefined}
            paymentMethod={undefined}
            onChange={jest.fn()}
          />,
        )

        expect(screen.getByTestId(CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID)).toBeInTheDocument()
        expect(mockOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the card is clicked', () => {
      it('THEN should open the drawer seeded with the current values', async () => {
        const seededConnection = { code: 'stripe_eu' }
        const seededPaymentMethod = {
          paymentMethodId: 'pm_1',
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        }

        const { onChange, opened } = await openDrawerFromSelector({
          connection: seededConnection,
          paymentMethod: seededPaymentMethod,
        })

        expect(mockOpen).toHaveBeenCalledTimes(1)

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith({
          connection: seededConnection,
          paymentMethod: seededPaymentMethod,
        })
      })
    })
  })

  describe('GIVEN the drawer is open', () => {
    describe('WHEN the user saves an untouched choice', () => {
      it('THEN should commit the inherit-shaped seed and close', async () => {
        const { onChange, opened } = await openDrawerFromSelector({
          connection: { behavior: ConnectionBehaviorEnum.Inherit },
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith({
          connection: { behavior: ConnectionBehaviorEnum.Inherit },
          paymentMethod: undefined,
        })
        expect(mockClose).toHaveBeenCalled()
      })
    })

    describe('WHEN the customer has a default connection', () => {
      it('THEN should display the payment method sub-choice', async () => {
        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.getByTestId(PAYMENT_METHOD_FIELDS_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should name the resolved connection on the option', async () => {
        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.getByTestId(CONNECTION_DEFAULT_CHIP_TEST_ID)).toHaveTextContent(
          STRIPE_CONNECTION.code,
        )
      })
    })

    describe('WHEN the customer has no connection at all', () => {
      it('THEN should hide the payment method sub-choice', async () => {
        mockConnections.current = []

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.queryByTestId(PAYMENT_METHOD_FIELDS_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user picks the skip branch', () => {
      it('THEN should hide the payment method sub-choice and commit a manual payment method', async () => {
        const { user, onChange, opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        await user.click(
          screen
            .getByTestId(CONNECTION_FIELDS_SKIP_RADIO_TEST_ID)
            .querySelector('input') as HTMLInputElement,
        )

        expect(screen.queryByTestId(PAYMENT_METHOD_FIELDS_TEST_ID)).not.toBeInTheDocument()

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith({
          connection: { behavior: ConnectionBehaviorEnum.Skip },
          paymentMethod: {
            paymentMethodId: null,
            paymentMethodType: PaymentMethodTypeEnum.Manual,
          },
        })
      })
    })

    describe('WHEN the user picks the specific branch without choosing a connection', () => {
      it('THEN should block the submit', async () => {
        const { user, onChange, opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        await user.click(
          screen
            .getByTestId(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID)
            .querySelector('input') as HTMLInputElement,
        )

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a stored choice', () => {
    describe('WHEN summarising it on the card', () => {
      it.each([
        ['the customer default', undefined, ConnectionBehavior.INHERIT],
        ['a specific connection', { code: 'stripe_eu' }, ConnectionBehavior.SPECIFIC],
        ['the skip branch', { behavior: ConnectionBehaviorEnum.Skip }, ConnectionBehavior.SKIP],
      ])('THEN should show the %s summary', (_, connection, behavior) => {
        render(
          <ConnectionPaymentSettingsSelector
            viewType={ViewTypeEnum.WalletTopUp}
            customerId="customer-1"
            externalCustomerId="ext-customer-1"
            connection={connection}
            paymentMethod={undefined}
            onChange={jest.fn()}
          />,
        )

        expect(screen.getByText(CONNECTION_SUMMARY_KEY_BY_BEHAVIOR[behavior])).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a wallet routed to manual payments before the flag existed', () => {
    const MANUAL_PAYMENT_METHOD = {
      paymentMethodId: undefined,
      paymentMethodType: PaymentMethodTypeEnum.Manual,
    }

    describe('WHEN the card renders', () => {
      it('THEN should summarise it as the skip branch instead of the customer default', () => {
        render(
          <ConnectionPaymentSettingsSelector
            viewType={ViewTypeEnum.WalletTopUp}
            customerId="customer-1"
            externalCustomerId="ext-customer-1"
            connection={undefined}
            paymentMethod={MANUAL_PAYMENT_METHOD}
            onChange={jest.fn()}
          />,
        )

        expect(
          screen.getByText(CONNECTION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.SKIP]),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the drawer opens', () => {
      it('THEN should preselect the skip branch rather than leaving no branch checked', async () => {
        const { onChange, opened } = await openDrawerFromSelector({
          paymentMethod: MANUAL_PAYMENT_METHOD,
        })

        render(<>{opened.children}</>)

        expect(screen.queryByTestId(PAYMENT_METHOD_FIELDS_TEST_ID)).not.toBeInTheDocument()

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ connection: { behavior: ConnectionBehaviorEnum.Skip } }),
        )
      })
    })
  })

  describe('GIVEN a customer with no default connection', () => {
    describe('WHEN the drawer content mounts', () => {
      it('THEN should flag the option instead of naming a connection', async () => {
        mockConnections.current = []

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.getByTestId(CONNECTION_NO_DEFAULT_CHIP_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_DEFAULT_CHIP_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a customer whose default routing is manual payments', () => {
    describe('WHEN the drawer content mounts', () => {
      it('THEN should say so on the option instead of naming a connection', async () => {
        mockConnections.current = []
        mockIsDefaultManual.current = true

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.getByTestId(CONNECTION_MANUAL_DEFAULT_CHIP_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_NO_DEFAULT_CHIP_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_DEFAULT_CHIP_TEST_ID)).not.toBeInTheDocument()
      })

      // Manual resolves to no connection, so there is no method to choose under it.
      it('THEN should not offer the payment method sub-choice', async () => {
        mockConnections.current = []
        mockIsDefaultManual.current = true

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(screen.queryByTestId('payment-method-fields')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN payment methods spread across several connections', () => {
    describe('WHEN a connection resolves', () => {
      it('THEN should offer only the methods belonging to it', async () => {
        mockPaymentMethods.current = [
          { id: 'pm-own', isDefault: true, paymentProviderCustomerId: STRIPE_CONNECTION.id },
          { id: 'pm-other', isDefault: true, paymentProviderCustomerId: 'conn-other' },
        ]

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(mockPaymentMethodFieldsProps.current?.paymentMethodsList).toEqual([
          { id: 'pm-own', isDefault: true, paymentProviderCustomerId: STRIPE_CONNECTION.id },
        ])
      })
    })
  })

  describe('GIVEN a stored method belonging to another connection', () => {
    describe('WHEN the drawer content mounts', () => {
      // The customer default can change after the wallet was saved, leaving a method the resolved
      // connection cannot honour.
      it('THEN should drop it rather than submit it', async () => {
        mockPaymentMethods.current = [
          { id: 'pm-own', isDefault: true, paymentProviderCustomerId: STRIPE_CONNECTION.id },
        ]

        const { opened } = await openDrawerFromSelector({
          paymentMethod: {
            paymentMethodId: 'pm-other',
            paymentMethodType: PaymentMethodTypeEnum.Provider,
          },
        })

        render(<>{opened.children}</>)

        await waitFor(() =>
          expect(mockPaymentMethodFieldsProps.current?.value).toEqual({
            paymentMethodId: null,
            paymentMethodType: PaymentMethodTypeEnum.Provider,
          }),
        )
      })
    })
  })
})
