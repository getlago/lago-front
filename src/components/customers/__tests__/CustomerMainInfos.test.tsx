import { screen, within } from '@testing-library/react'

import { CustomerDetailsFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CUSTOMER_X402_SECTION_TEST_ID, CustomerMainInfos } from '../CustomerMainInfos'

jest.mock('~/components/customers/connectionsSection/CustomerConnectionsSection', () => ({
  CustomerConnectionsSection: () => null,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const customer = {
  __typename: 'Customer',
  id: 'customer-1',
  name: '0xfB69…d359',
  externalId: 'x402:0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  metadata: [],
} as unknown as CustomerDetailsFragment

describe('CustomerMainInfos', () => {
  describe('GIVEN a customer created by an x402 agent', () => {
    it('THEN shows its agent wallet address with a copy button', () => {
      render(
        <CustomerMainInfos
          customer={{ ...customer, x402AgentAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359' }}
        />,
      )

      expect(
        within(screen.getByTestId(CUSTOMER_X402_SECTION_TEST_ID)).getByText(
          '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('GIVEN a customer without an agent address', () => {
    it('THEN shows no x402 section', () => {
      render(<CustomerMainInfos customer={{ ...customer, x402AgentAddress: null }} />)

      expect(screen.queryByTestId(CUSTOMER_X402_SECTION_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
