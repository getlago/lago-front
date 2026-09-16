import { screen } from '@testing-library/react'

import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  ConnectionResolvedBehaviorEnum,
  IntegrationTypeEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  CONNECTION_ROUTING_CHIP_TEST_ID,
  CONNECTION_ROUTING_INHERITED_TEST_ID,
  CONNECTION_ROUTING_SKIPPED_TEST_ID,
  CONNECTION_ROUTING_UNRESOLVED_TEST_ID,
  ConnectionRoutingValue,
} from '../ConnectionRoutingValue'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockUseCustomerPaymentConnections = jest.fn()
const mockUseCustomerIntegrationConnections = jest.fn()

jest.mock('~/hooks/customer/useCustomerPaymentConnections', () => ({
  useCustomerPaymentConnections: (args: Record<string, unknown>) =>
    mockUseCustomerPaymentConnections(args),
}))

jest.mock('~/hooks/customer/useCustomerIntegrationConnections', () => ({
  useCustomerIntegrationConnections: (args: Record<string, unknown>) =>
    mockUseCustomerIntegrationConnections(args),
}))

describe('ConnectionRoutingValue', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseCustomerPaymentConnections.mockReturnValue({
      connections: [
        { id: 'pc-1', code: 'stripe-eu', name: 'Stripe EU', provider: ProviderTypeEnum.Stripe },
      ],
      options: [],
      defaultConnection: undefined,
      isDefaultManual: false,
      loading: false,
    })

    mockUseCustomerIntegrationConnections.mockReturnValue({
      connections: [
        {
          id: 'ic-1',
          code: 'anrok-eu',
          name: 'Anrok EU',
          group: '',
          integrationType: IntegrationTypeEnum.Anrok,
          isDefault: false,
        },
      ],
      options: [],
      defaultConnection: undefined,
      loading: false,
    })
  })

  describe('GIVEN a routing explicitly set on the billing object', () => {
    describe('WHEN the behavior is specific', () => {
      it('THEN should show the connection code without the inherited suffix', () => {
        render(
          <ConnectionRoutingValue
            category={ConnectionCategory.Payment}
            customerId="customer-1"
            routing={{ behavior: ConnectionResolvedBehaviorEnum.Specific, code: 'stripe-eu' }}
          />,
        )

        expect(screen.getByTestId(CONNECTION_ROUTING_CHIP_TEST_ID)).toHaveTextContent('stripe-eu')
        expect(screen.queryByTestId(CONNECTION_ROUTING_INHERITED_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the behavior is skip', () => {
      it('THEN should show the skipped state instead of a chip', () => {
        render(
          <ConnectionRoutingValue
            category={ConnectionCategory.Tax}
            customerId="customer-1"
            routing={{ behavior: ConnectionResolvedBehaviorEnum.Skip, code: null }}
          />,
        )

        expect(screen.getByTestId(CONNECTION_ROUTING_SKIPPED_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_ROUTING_CHIP_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a routing inherited from the customer', () => {
    describe('WHEN the customer default resolves to a code', () => {
      it('THEN should show the code with the inherited suffix', () => {
        render(
          <ConnectionRoutingValue
            category={ConnectionCategory.Accounting}
            customerId="customer-1"
            routing={{ behavior: ConnectionResolvedBehaviorEnum.Inherit, code: 'anrok-eu' }}
          />,
        )

        expect(screen.getByTestId(CONNECTION_ROUTING_CHIP_TEST_ID)).toHaveTextContent('anrok-eu')
        expect(screen.getByTestId(CONNECTION_ROUTING_INHERITED_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the customer has no default', () => {
      it('THEN should show the unresolved state', () => {
        render(
          <ConnectionRoutingValue
            category={ConnectionCategory.Crm}
            customerId="customer-1"
            routing={{ behavior: ConnectionResolvedBehaviorEnum.Inherit, code: null }}
          />,
        )

        expect(screen.getByTestId(CONNECTION_ROUTING_UNRESOLVED_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the category has no routing at all', () => {
    describe('WHEN nothing resolves', () => {
      it('THEN should show the unresolved state', () => {
        render(
          <ConnectionRoutingValue category={ConnectionCategory.Payment} customerId="customer-1" />,
        )

        expect(screen.getByTestId(CONNECTION_ROUTING_UNRESOLVED_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CONNECTION_ROUTING_CHIP_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the connection list is only needed to resolve a provider avatar', () => {
    describe('WHEN the routing carries no code', () => {
      it.each([
        ['payment', ConnectionCategory.Payment, () => mockUseCustomerPaymentConnections],
        ['integration', ConnectionCategory.Tax, () => mockUseCustomerIntegrationConnections],
      ])('THEN should skip the %s connections query', (_, category, getMock) => {
        render(<ConnectionRoutingValue category={category} customerId="customer-1" />)

        expect(getMock()).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
      })
    })
  })

  describe('GIVEN an integration category', () => {
    describe('WHEN the value renders', () => {
      it('THEN should query the customer connections of that category', () => {
        render(
          <ConnectionRoutingValue
            category={ConnectionCategory.Tax}
            customerId="customer-1"
            routing={{ behavior: ConnectionResolvedBehaviorEnum.Specific, code: 'anrok-eu' }}
          />,
        )

        expect(mockUseCustomerIntegrationConnections).toHaveBeenCalledWith({
          customerId: 'customer-1',
          category: ConnectionCategory.Tax,
          skip: false,
        })
      })
    })
  })
})
