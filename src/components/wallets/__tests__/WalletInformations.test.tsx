import { screen } from '@testing-library/react'

import { WalletDetailsFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import WalletInformations, {
  WALLET_INFORMATIONS_CONTAINER_TEST_ID,
  WALLET_INFORMATIONS_NO_RECURRING_TEST_ID,
} from '../WalletInformations'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))
jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
  }),
}))
jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

const createMockWallet = (overrides = {}) =>
  ({
    id: 'wallet-1',
    code: 'wallet-code',
    name: 'Test Wallet',
    currency: 'USD',
    rateAmount: 1,
    priority: 1,
    expirationAt: null,
    paidTopUpMinAmountCents: null,
    paidTopUpMaxAmountCents: null,
    appliesTo: null,
    paymentMethod: null,
    selectedInvoiceCustomSections: [],
    recurringTransactionRules: [],
    balanceCents: '10000',
    consumedAmountCents: '5000',
    consumedCredits: '50',
    createdAt: '2024-01-01T00:00:00Z',
    creditsBalance: 100,
    lastBalanceSyncAt: '2024-01-01T00:00:00Z',
    lastConsumedCreditAt: '2024-01-01T00:00:00Z',
    lastOngoingBalanceSyncAt: '2024-01-01T00:00:00Z',
    status: 'active',
    terminatedAt: null,
    ongoingBalanceCents: '8000',
    creditsOngoingBalance: '80',
    ongoingUsageBalanceCents: '0',
    creditsOngoingUsageBalance: 0,
    traceable: true,
    ...overrides,
  }) as unknown as WalletDetailsFragment

describe('WalletInformations', () => {
  it('GIVEN no wallet WHEN rendered THEN should render nothing', () => {
    const { container } = render(<WalletInformations />)

    expect(container.innerHTML).toBe('')
  })

  it('GIVEN wallet data WHEN rendered THEN should show wallet informations container', () => {
    render(<WalletInformations wallet={createMockWallet()} />)

    expect(screen.getByTestId(WALLET_INFORMATIONS_CONTAINER_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN wallet with no recurring rules WHEN isPremium THEN should show no recurring message', () => {
    render(<WalletInformations wallet={createMockWallet()} />)

    expect(screen.getByTestId(WALLET_INFORMATIONS_NO_RECURRING_TEST_ID)).toBeInTheDocument()
  })
})
