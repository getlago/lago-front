import { act, fireEvent, screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { GetPaymentsListDocument } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'
import { getOperationVariableTypeName } from '~/test-utils/graphqlDocument'

import PaymentsPage from '../PaymentsPage'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return <>{props.filtersSection}</>
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  DEBOUNCE_SEARCH_MS: 500,
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { defaultCurrency: 'USD' }, loading: false }),
}))

const mockIsPremium = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: mockIsPremium(),
  }),
}))

const mockGetPayments = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPaymentsListLazyQuery: () => [
    mockGetPayments,
    {
      data: {
        payments: {
          metadata: { currentPage: 1, totalPages: 1, totalCount: 5 },
          collection: [],
        },
      },
      loading: false,
      error: null,
      fetchMore: jest.fn(),
      variables: {},
    },
  ],
}))

jest.mock('~/components/invoices/PaymentsList', () => ({
  PaymentsList: () => <div data-test="payments-list-mock">PaymentsList</div>,
}))

const mockOpenPremiumWarningDialog = jest.fn()

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({
    open: mockOpenPremiumWarningDialog,
    close: jest.fn(),
  }),
}))

describe('PaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    mockIsPremium.mockReturnValue(true)
    mockOpenPremiumWarningDialog.mockClear()
    window.history.replaceState({}, '', '/payments')
  })

  afterEach(() => {
    jest.useRealTimers()
    window.history.replaceState({}, '', '/')
  })

  it('declares both amount variables as BigInt', () => {
    expect(getOperationVariableTypeName(GetPaymentsListDocument, 'amountFrom')).toBe('BigInt')
    expect(getOperationVariableTypeName(GetPaymentsListDocument, 'amountTo')).toBe('BigInt')
  })

  it('loads URL filters once and renders their chips', () => {
    window.history.replaceState(
      {},
      '',
      '/payments?pa_paymentStatus=processing&pa_amount=isEqualTo,90071992547409.93,&pa_receiptNumber=rcpt-2026-0001',
    )
    const { rerender } = render(<PaymentsPage />)

    expect(mockGetPayments).toHaveBeenCalledTimes(1)
    expect(mockGetPayments).toHaveBeenCalledWith({
      variables: expect.objectContaining({
        paymentStatus: ['processing'],
        receiptNumber: 'rcpt-2026-0001',
        amountFrom: '9007199254740993',
        amountTo: '9007199254740993',
        page: 1,
      }),
    })
    expect(screen.getAllByTestId('active-filter-item')).toHaveLength(3)
    expect(screen.getByText(/rcpt-2026-0001/)).toBeInTheDocument()
    expect(screen.getByText(/90071992547409.93/)).toBeInTheDocument()

    rerender(<PaymentsPage />)
    expect(mockGetPayments).toHaveBeenCalledTimes(1)
  })

  it('debounces search into one request while retaining filters and resetting the page', () => {
    jest.useFakeTimers()
    window.history.replaceState({}, '', '/payments?pa_currency=EUR')
    render(<PaymentsPage />)
    const search = screen.getByPlaceholderText('text_17370296250897aidak5kjcg')

    fireEvent.change(search, { target: { value: 'pi_' } })
    fireEvent.change(search, { target: { value: 'pi_3' } })
    expect(mockGetPayments).toHaveBeenCalledTimes(1)

    act(() => jest.advanceTimersByTime(500))
    expect(mockGetPayments).toHaveBeenCalledTimes(2)
    expect(mockGetPayments).toHaveBeenLastCalledWith({
      variables: expect.objectContaining({
        currency: 'EUR',
        searchTerm: 'pi_3',
        page: 1,
      }),
    })
    expect(testMockNavigateFn).toHaveBeenCalledWith(
      { search: 'pa_currency=EUR' },
      { replace: true },
    )
  })

  it('does not expose an export action', () => {
    render(<PaymentsPage />)
    expect(capturedConfig?.actions?.items).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument()
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the PaymentsList component', () => {
        render(<PaymentsPage />)

        expect(screen.getByTestId('payments-list-mock')).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<PaymentsPage />)

        expect(capturedConfig?.entity?.viewName).toBe('text_6672ebb8b1b50be550eccbed')
      })

      it('THEN should configure MainHeader with one action', () => {
        render(<PaymentsPage />)

        expect(capturedConfig?.actions?.items).toHaveLength(1)
        expect(capturedConfig?.actions?.items[0].type).toBe('action')
      })

      it('THEN should configure MainHeader with a filtersSection', () => {
        render(<PaymentsPage />)

        expect(capturedConfig?.filtersSection).toBeDefined()
      })
    })
  })

  describe('GIVEN the user is premium', () => {
    describe('WHEN the action is configured', () => {
      it('THEN the action should not have endIcon sparkles', () => {
        render(<PaymentsPage />)

        const action = capturedConfig?.actions?.items[0]

        expect(action?.type === 'action' && action.endIcon).toBeUndefined()
      })

      it('THEN clicking the action should navigate', () => {
        render(<PaymentsPage />)

        const action = capturedConfig?.actions?.items[0]

        if (action?.type === 'action') {
          action.onClick()
        }

        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the user is not premium', () => {
    beforeEach(() => {
      mockIsPremium.mockReturnValue(false)
    })

    describe('WHEN the action is configured', () => {
      it('THEN the action should have endIcon sparkles', () => {
        render(<PaymentsPage />)

        const action = capturedConfig?.actions?.items[0]

        expect(action?.type === 'action' && action.endIcon).toBe('sparkles')
      })

      it('THEN clicking the action should open the premium warning dialog', () => {
        render(<PaymentsPage />)

        const action = capturedConfig?.actions?.items[0]

        if (action?.type === 'action') {
          action.onClick()
        }

        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
      })
    })
  })
})
