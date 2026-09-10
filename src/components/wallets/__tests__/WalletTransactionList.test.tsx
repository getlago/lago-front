import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams } from 'react-router-dom'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import {
  CurrencyEnum,
  WalletInfosForTransactionsFragment,
  WalletStatusEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { WalletTransactionList } from '../WalletTransactionList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/wallets/WalletDetailsDrawer', () => {
  const { forwardRef } = jest.requireActual<typeof import('react')>('react')

  return { WalletDetailsDrawer: forwardRef(() => null) }
})

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetWalletTransactionsLazyQuery: () => [
    jest.fn(),
    {
      data: { walletTransactions: { collection: [] } },
      loading: false,
    },
  ],
}))

const wallet: WalletInfosForTransactionsFragment = {
  id: 'wallet-1',
  currency: CurrencyEnum.Usd,
  status: WalletStatusEnum.Active,
  ongoingUsageBalanceCents: '0',
  creditsOngoingUsageBalance: 0,
  rateAmount: 1,
  traceable: true,
}

describe('WalletTransactionList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useParams).mockReturnValue({ customerId: 'customer-1' })
  })

  it.each([undefined, ''])(
    'GIVEN customer ID is %p THEN keeps the empty state without the top-up action',
    (customerId) => {
      jest.mocked(useParams).mockReturnValue({ customerId })

      render(<WalletTransactionList isOpen wallet={wallet} footer={null} />)

      expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
    },
  )

  it('GIVEN a customer ID THEN the empty state can navigate to top-up', async () => {
    const user = userEvent.setup()
    const navigate = jest.requireMock('react-router-dom').useNavigate()

    render(<WalletTransactionList isOpen wallet={wallet} footer={null} />)
    await user.click(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID))

    expect(navigate).toHaveBeenCalledWith('/customer/customer-1/wallet/wallet-1/top-up')
  })
})
