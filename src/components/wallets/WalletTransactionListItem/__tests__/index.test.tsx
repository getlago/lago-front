import { act, cleanup, screen } from '@testing-library/react'
import { DateTime } from 'luxon'

import {
  WalletTransactionListItem,
  WalletTransactionListItemProps,
} from '~/components/wallets/WalletTransactionListItem'
import {
  GetOrganizationInfosDocument,
  TimezoneEnum,
  WalletTransactionSourceEnum,
  WalletTransactionStatusEnum,
  WalletTransactionTransactionStatusEnum,
  WalletTransactionTransactionTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

const CREDITS = '10'

const AMOUNT = '100'

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
    loading: false,
    currentUser: {
      id: '1',
      email: 'currentUser@mail.com',
      premium: true,
    },
  }),
}))

async function prepare(
  overriddenTransaction?: Partial<WalletTransactionListItemProps['transaction']>,
  isRealTimeTransaction?: boolean,
) {
  const mocks = [
    {
      request: {
        query: GetOrganizationInfosDocument,
      },
      result: {
        data: {
          organization: {
            id: '1234',
            name: 'Organization Name',
          },
        },
      },
    },
  ]

  const transaction = {
    id: '1',
    status: WalletTransactionStatusEnum.Settled,
    transactionStatus: WalletTransactionTransactionStatusEnum.Purchased,
    transactionType: WalletTransactionTransactionTypeEnum.Inbound,
    amount: AMOUNT,
    creditAmount: CREDITS,
    settledAt: DateTime.local(2022, 2, 2).toISO(),
    createdAt: DateTime.local(2022, 1, 1).toISO(),
    source: WalletTransactionSourceEnum.Manual,
    ...overriddenTransaction,
  }

  await act(() =>
    render(
      <WalletTransactionListItem
        customerTimezone={TimezoneEnum.TzEuropeParis}
        isRealTimeTransaction={isRealTimeTransaction ?? false}
        isWalletActive={true}
        transaction={transaction}
      />,
      {
        mocks,
      },
    ),
  )
}

describe('WalletTransactionListItem', () => {
  afterEach(cleanup)

  it('should render purchased item with pending status', async () => {
    await prepare({
      status: WalletTransactionStatusEnum.Pending,
      transactionType: WalletTransactionTransactionTypeEnum.Inbound,
    })

    expect(screen.getByTitle('sync/xsmall')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
    expect(screen.getByTestId('credits')).toHaveTextContent(`+ ${CREDITS}`)
    expect(screen.getByTestId('amount')).toHaveTextContent(AMOUNT)
  })

  it('should render invoiced item with pending status', async () => {
    await prepare({
      status: WalletTransactionStatusEnum.Pending,
      transactionType: WalletTransactionTransactionTypeEnum.Outbound,
    })

    expect(screen.getByTitle('sync/xsmall')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
    expect(screen.getByTestId('credits')).toHaveTextContent(`- ${CREDITS}`)
    expect(screen.getByTestId('amount')).toHaveTextContent(AMOUNT)
  })

  it('should render purchased item with paid status', async () => {
    await prepare({
      status: WalletTransactionStatusEnum.Settled,
      transactionType: WalletTransactionTransactionTypeEnum.Inbound,
    })

    expect(screen.getByTitle('plus/medium')).toBeInTheDocument()
    expect(screen.queryByTestId('caption-pending')).not.toBeInTheDocument()
  })

  it('should render invoiced item with paid status', async () => {
    await prepare({
      status: WalletTransactionStatusEnum.Settled,
      transactionType: WalletTransactionTransactionTypeEnum.Outbound,
    })

    expect(screen.getByTitle('minus/medium')).toBeInTheDocument()
    expect(screen.queryByTestId('caption-pending')).not.toBeInTheDocument()
  })

  it('should render granted item properly', async () => {
    await prepare({
      transactionType: WalletTransactionTransactionTypeEnum.Inbound,
      transactionStatus: WalletTransactionTransactionStatusEnum.Granted,
    })

    expect(screen.getByTitle('plus/medium')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
  })

  it('should render voided item properly', async () => {
    await prepare({
      transactionType: WalletTransactionTransactionTypeEnum.Outbound,
      transactionStatus: WalletTransactionTransactionStatusEnum.Voided,
    })

    expect(screen.getByTitle('minus/medium')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
  })

  it('should render real time transaction', async () => {
    await prepare(undefined, true)

    expect(screen.getByTitle('pulse/medium')).toBeInTheDocument()
    expect(screen.queryByTestId('caption-pending')).not.toBeInTheDocument()
    expect(screen.getByTestId('credits')).toHaveTextContent(CREDITS)
    expect(screen.getByTestId('amount')).toHaveTextContent(AMOUNT)
  })

  it('should render automatic credits purchased for interval source', async () => {
    await prepare({
      source: WalletTransactionSourceEnum.Interval,
      transactionStatus: WalletTransactionTransactionStatusEnum.Purchased,
      transactionType: WalletTransactionTransactionTypeEnum.Inbound,
    })

    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
  })

  it('should render automatic credits purchased for threshold source', async () => {
    await prepare({
      source: WalletTransactionSourceEnum.Threshold,
      transactionStatus: WalletTransactionTransactionStatusEnum.Purchased,
      transactionType: WalletTransactionTransactionTypeEnum.Inbound,
    })

    expect(screen.getByTestId('transaction-label')).toBeInTheDocument()
  })

  it('should render real time transaction with zero amount for non premium user', async () => {
    jest.mock('~/hooks/useCurrentUser', () => ({
      useCurrentUser: () => ({
        isPremium: false,
        loading: false,
        currentUser: {
          id: '1',
          email: 'currentUser@mail.com',
          premium: false,
        },
      }),
    }))

    await prepare(undefined, true)

    expect(screen.getByTitle('pulse/medium')).toBeInTheDocument()
    expect(screen.queryByTestId('caption-pending')).not.toBeInTheDocument()
    expect(screen.getByTestId('credits')).toHaveTextContent('0')
    expect(screen.getByTestId('amount')).toHaveTextContent('0')
  })
})
