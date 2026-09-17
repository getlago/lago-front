import { screen } from '@testing-library/react'

import { ConnectionResolvedBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import {
  PAYMENT_METHOD_VALUE_CHIP_TEST_ID,
  PAYMENT_METHOD_VALUE_INHERITED_TEST_ID,
  PaymentMethodValue,
} from '../PaymentMethodValue'

let mockPaymentMethodsList: PaymentMethodItem[] = []

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
    hasFeatureFlag: () => true,
  }),
}))

const CONNECTION_A = {
  id: 'pc-a',
  code: 'stripe-a',
  name: 'Stripe A',
  provider: null,
  isDefault: true,
}
const CONNECTION_B = {
  id: 'pc-b',
  code: 'stripe-b',
  name: 'Stripe B',
  provider: null,
  isDefault: false,
}

jest.mock('~/hooks/customer/useCustomerPaymentConnections', () => ({
  useCustomerPaymentConnections: () => ({
    connections: [CONNECTION_A, CONNECTION_B],
    options: [],
    defaultConnection: CONNECTION_A,
    isDefaultManual: false,
    loading: false,
  }),
}))

// The real hook is scoped by the backend, so the mock answers per connection too: returning the
// whole list here would hide exactly the mix-up these cases guard.
jest.mock('~/hooks/customer/useCustomerConnectionPaymentMethods', () => ({
  useCustomerConnectionPaymentMethods: ({ connectionId }: { connectionId?: string }) => ({
    data: mockPaymentMethodsList.filter(
      (method: { paymentProviderCustomerId?: string | null }) =>
        !method.paymentProviderCustomerId || method.paymentProviderCustomerId === connectionId,
    ),
    loading: false,
    error: false,
    isComplete: true,
  }),
}))

describe('PaymentMethodValue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPaymentMethodsList = []
  })

  describe('GIVEN the object selects a specific provider method', () => {
    describe('WHEN it renders', () => {
      it('THEN should show the formatted method as a chip without the customer-default label', () => {
        const paymentMethod = createMockPaymentMethod({
          paymentProviderCustomerId: CONNECTION_A.id,
        })

        mockPaymentMethodsList = [paymentMethod]

        render(
          <PaymentMethodValue
            selectedPaymentMethod={{
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethodId: paymentMethod.id,
            }}
            customerId="customer-1"
          />,
        )

        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).toHaveTextContent('4242')
        expect(screen.queryByTestId(PAYMENT_METHOD_VALUE_INHERITED_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the object falls back to the customer default', () => {
    describe('WHEN it renders', () => {
      it('THEN should show the customer-default label next to the chip', () => {
        mockPaymentMethodsList = [
          createMockPaymentMethod({ isDefault: true, paymentProviderCustomerId: CONNECTION_A.id }),
        ]

        render(<PaymentMethodValue selectedPaymentMethod={undefined} customerId="customer-1" />)

        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_INHERITED_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the object is paid manually', () => {
    describe('WHEN it renders', () => {
      it('THEN should show the manual label as a chip', () => {
        render(
          <PaymentMethodValue
            selectedPaymentMethod={{ paymentMethodType: PaymentMethodTypeEnum.Manual }}
          />,
        )

        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(PAYMENT_METHOD_VALUE_INHERITED_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the customer has several payment connections', () => {
    describe('WHEN the object routes to a connection that owns no method', () => {
      it("THEN should not show another connection's default card", () => {
        mockPaymentMethodsList = [
          createMockPaymentMethod({
            id: 'pm_connection_a',
            isDefault: true,
            paymentProviderCustomerId: CONNECTION_A.id,
          }),
        ]

        render(
          <PaymentMethodValue
            selectedPaymentMethod={undefined}
            customerId="customer-1"
            paymentRouting={{
              behavior: ConnectionResolvedBehaviorEnum.Specific,
              code: CONNECTION_B.code,
            }}
          />,
        )

        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).not.toHaveTextContent('4242')
      })
    })

    describe('WHEN the object routes to the connection that owns the method', () => {
      it('THEN should show that card', () => {
        mockPaymentMethodsList = [
          createMockPaymentMethod({
            id: 'pm_connection_b',
            isDefault: true,
            paymentProviderCustomerId: CONNECTION_B.id,
          }),
        ]

        render(
          <PaymentMethodValue
            selectedPaymentMethod={undefined}
            customerId="customer-1"
            paymentRouting={{
              behavior: ConnectionResolvedBehaviorEnum.Specific,
              code: CONNECTION_B.code,
            }}
          />,
        )

        expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).toHaveTextContent('4242')
      })
    })

    describe('WHEN the object skips the payment connection', () => {
      it('THEN should show the manual label without the customer-default suffix', () => {
        mockPaymentMethodsList = [
          createMockPaymentMethod({ isDefault: true, paymentProviderCustomerId: CONNECTION_A.id }),
        ]

        render(
          <PaymentMethodValue
            selectedPaymentMethod={undefined}
            customerId="customer-1"
            paymentRouting={{ behavior: ConnectionResolvedBehaviorEnum.Skip, code: null }}
          />,
        )

        expect(screen.queryByTestId(PAYMENT_METHOD_VALUE_INHERITED_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a connection that resolves but owns no payment method', () => {
    // `useResolvedPaymentMethodDisplay` reports manual whenever nothing resolves. The routing
    // decides that here, so an empty connection must not read as a manual payment.
    it('THEN should not claim the object is paid manually', () => {
      mockPaymentMethodsList = []

      render(
        <PaymentMethodValue
          selectedPaymentMethod={undefined}
          customerId="customer-1"
          paymentRouting={{
            behavior: ConnectionResolvedBehaviorEnum.Specific,
            code: CONNECTION_A.code,
          }}
        />,
      )

      expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).not.toHaveTextContent(
        'text_173799550683709p2rqkoqd5',
      )
    })
  })

  describe('GIVEN the routing itself skips the payment category', () => {
    it('THEN should still say the object is paid manually', () => {
      mockPaymentMethodsList = []

      render(
        <PaymentMethodValue
          selectedPaymentMethod={undefined}
          customerId="customer-1"
          paymentRouting={{ behavior: ConnectionResolvedBehaviorEnum.Skip }}
        />,
      )

      expect(screen.getByTestId(PAYMENT_METHOD_VALUE_CHIP_TEST_ID)).toHaveTextContent(
        'text_173799550683709p2rqkoqd5',
      )
    })
  })
})
