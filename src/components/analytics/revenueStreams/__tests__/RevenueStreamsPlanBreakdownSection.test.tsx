import { screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { RevenueStreamsPlanBreakdownSection } from '../RevenueStreamsPlanBreakdownSection'

const mockPlan = {
  amountCurrency: CurrencyEnum.Eur,
  customersCount: 1,
  customersShare: 0.5,
  netRevenueAmountCents: '120000',
  netRevenueShare: 0.5,
  planDeletedAt: null,
}

jest.mock('~/hooks/useOrganizationInfos', () => ({
  ...jest.requireActual('~/hooks/useOrganizationInfos'),
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'EUR' },
    hasOrganizationPremiumAddon: () => true,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetRevenueStreamsPlanBreakdownQuery: () => ({
    data: {
      dataApiRevenueStreamsPlans: {
        collection: [
          {
            ...mockPlan,
            planCode: 'pro',
            planId: 'plan-pro',
            planInterval: 'monthly',
            planName: 'Pro',
          },
          // Product catalog plans and contracts without a plan have no interval
          {
            ...mockPlan,
            planCode: 'custom_contract',
            planId: 'plan-custom',
            planInterval: null,
            planName: 'Custom contract',
          },
        ],
        metadata: { currentPage: 1, totalPages: 1, totalCount: 2 },
      },
    },
    loading: false,
    error: undefined,
    fetchMore: jest.fn(),
    variables: {},
  }),
}))

describe('RevenueStreamsPlanBreakdownSection', () => {
  describe('GIVEN a plan without interval', () => {
    it('THEN shows its row with a dash for the interval', () => {
      render(<RevenueStreamsPlanBreakdownSection />)

      expect(screen.getByText('Custom contract')).toBeInTheDocument()
      expect(screen.getByText('Pro')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })
})
