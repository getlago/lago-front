import { screen } from '@testing-library/react'

import { ButtonLinkBaseProps } from '~/components/designSystem/ButtonLink'
import {
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
  PaymentMethodTypeEnum,
  WalletDetailsFragment,
} from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'
import { render } from '~/test-utils'

import WalletExternalApps, {
  WALLET_EXTERNAL_APPS_CONTAINER_TEST_ID,
  WALLET_EXTERNAL_APPS_EDIT_ADDITIONAL_TEST_ID,
  WALLET_EXTERNAL_APPS_EDIT_PAYMENT_TEST_ID,
} from '../WalletExternalApps'

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

const PAYMENT_CONNECTION = {
  id: 'pc-1',
  code: 'stripe-eu',
  name: 'Stripe EU',
  provider: null,
  isDefault: true,
}

jest.mock('~/hooks/customer/useCustomerPaymentConnections', () => ({
  useCustomerPaymentConnections: () => ({
    connections: [PAYMENT_CONNECTION],
    options: [],
    defaultConnection: PAYMENT_CONNECTION,
    isDefaultManual: false,
    loading: false,
  }),
}))

jest.mock('~/hooks/customer/useCustomerConnectionPaymentMethods', () => ({
  useCustomerConnectionPaymentMethods: () => ({
    data: mockPaymentMethodsList,
    loading: false,
    error: false,
    isComplete: true,
  }),
}))

const mockConnectionRoutingValue = jest.fn()

jest.mock('~/components/connectionSelection/ConnectionRoutingValue', () => ({
  ConnectionRoutingValue: (props: Record<string, unknown>) => {
    mockConnectionRoutingValue(props)

    return null
  },
}))

// routerState (the drawer auto-open intent) never reaches the DOM, so the Edit
// links can only be asserted through the props they receive.
const mockButtonLink = jest.fn()

jest.mock('~/components/designSystem/ButtonLink', () => ({
  ButtonLink: (props: ButtonLinkBaseProps & { 'data-test'?: string }) => {
    mockButtonLink(props)

    return <button data-test={props['data-test']} type="button" />
  },
}))

const createMockWallet = (overrides = {}) =>
  ({
    id: 'wallet-1',
    code: 'wallet-code',
    name: 'Test Wallet',
    currency: 'USD',
    rateAmount: 1,
    paymentMethodType: null,
    paymentMethod: null,
    customer: { id: 'customer-1', externalId: 'external-customer-1' },
    connections: [
      {
        category: ConnectionCategoryEnum.Payment,
        behavior: ConnectionResolvedBehaviorEnum.Specific,
        code: 'stripe-eu',
      },
      {
        category: ConnectionCategoryEnum.Tax,
        behavior: ConnectionResolvedBehaviorEnum.Inherit,
        code: 'anrok-eu',
      },
    ],
    ...overrides,
  }) as unknown as WalletDetailsFragment

const renderComponent = ({
  wallet = createMockWallet(),
  canEditWallet = true,
}: {
  wallet?: WalletDetailsFragment | null
  canEditWallet?: boolean
} = {}) => render(<WalletExternalApps wallet={wallet} canEditWallet={canEditWallet} />)

describe('WalletExternalApps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPaymentMethodsList = []
  })

  describe('GIVEN no wallet', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should render nothing', () => {
        const { container } = renderComponent({ wallet: null })

        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('GIVEN a wallet with connections', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should display the container', () => {
        renderComponent()

        expect(screen.getByTestId(WALLET_EXTERNAL_APPS_CONTAINER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render one connection value per category', () => {
        renderComponent()

        expect(mockConnectionRoutingValue).toHaveBeenCalledTimes(4)
      })

      it('THEN should hand the wallet routing of each category to its value', () => {
        renderComponent()

        expect(mockConnectionRoutingValue).toHaveBeenCalledWith(
          expect.objectContaining({
            routing: expect.objectContaining({
              category: ConnectionCategoryEnum.Payment,
              code: 'stripe-eu',
            }),
          }),
        )
        expect(mockConnectionRoutingValue).toHaveBeenCalledWith(
          expect.objectContaining({
            routing: expect.objectContaining({
              category: ConnectionCategoryEnum.Tax,
              code: 'anrok-eu',
            }),
          }),
        )
      })

      it('THEN should resolve the connections against the wallet customer', () => {
        renderComponent()

        expect(mockConnectionRoutingValue).toHaveBeenCalledWith(
          expect.objectContaining({ customerId: 'customer-1' }),
        )
      })
    })

    describe('WHEN the wallet pays through a specific payment method', () => {
      it('THEN should display the resolved payment method', () => {
        const paymentMethod = createMockPaymentMethod({
          paymentProviderCustomerId: PAYMENT_CONNECTION.id,
        })

        mockPaymentMethodsList = [paymentMethod]

        renderComponent({
          wallet: createMockWallet({
            paymentMethodType: PaymentMethodTypeEnum.Provider,
            paymentMethod: { id: paymentMethod.id },
          }),
        })

        expect(screen.getByTestId(WALLET_EXTERNAL_APPS_CONTAINER_TEST_ID)).toHaveTextContent('4242')
      })
    })
  })

  describe('GIVEN the wallet can be edited', () => {
    describe('WHEN the tab renders', () => {
      it.each([
        ['payment', WALLET_EXTERNAL_APPS_EDIT_PAYMENT_TEST_ID, 'openConnectionPaymentDrawer'],
        [
          'additional apps',
          WALLET_EXTERNAL_APPS_EDIT_ADDITIONAL_TEST_ID,
          'openAdditionalIntegrationDrawer',
        ],
      ])(
        'THEN its %s Edit link should carry the matching auto-open drawer intent flag',
        (_, dataTest, routerStateKey) => {
          renderComponent()

          expect(screen.getByTestId(dataTest)).toBeInTheDocument()
          expect(mockButtonLink).toHaveBeenCalledWith(
            expect.objectContaining({
              'data-test': dataTest,
              to: '/customer/customer-1/wallet/wallet-1',
              routerState: { [routerStateKey]: true },
            }),
          )
        },
      )
    })
  })

  describe('GIVEN the wallet cannot be edited', () => {
    describe('WHEN the tab renders', () => {
      it.each([
        ['payment', WALLET_EXTERNAL_APPS_EDIT_PAYMENT_TEST_ID],
        ['additional apps', WALLET_EXTERNAL_APPS_EDIT_ADDITIONAL_TEST_ID],
      ])('THEN it should not render the %s Edit link', (_, dataTest) => {
        renderComponent({ canEditWallet: false })

        expect(screen.queryByTestId(dataTest)).not.toBeInTheDocument()
      })
    })
  })
})
