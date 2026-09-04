import { screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import WalletPage from '../WalletPage'

const mockUseCustomerPortalWalletQuery = jest.fn()
const mockTopUpPortalWallet = jest.fn()
const mockUseCustomerPortalNavigation = jest.fn()
const mockUseCustomerPortalTranslate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ walletId: 'wallet-1' }),
}))

jest.mock('~/components/customerPortal/common/hooks/useCustomerPortalNavigation', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalNavigation(),
}))

jest.mock('~/components/customerPortal/common/useCustomerPortalTranslate', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalTranslate(),
}))

jest.mock('~/components/customerPortal/common/PageTitle', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-test="page-title">{title}</div>,
}))

jest.mock('~/components/customerPortal/common/SectionError', () => ({
  __esModule: true,
  default: () => <div data-test="section-error">Error</div>,
}))

jest.mock('~/components/customerPortal/common/SectionLoading', () => ({
  LoaderWalletPage: () => <div data-test="loading-skeleton">Loading</div>,
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCustomerPortalWalletQuery: (...args: unknown[]) => mockUseCustomerPortalWalletQuery(...args),
  useTopUpPortalWalletMutation: (...args: unknown[]) => [
    mockTopUpPortalWallet,
    { loading: false, error: undefined },
    args,
  ],
}))

let mockFormAmountValue: number | '' = ''

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: ({ onSubmit }: { onSubmit: (arg: { value: { amount: number | '' } }) => void }) => ({
    store: {
      subscribe: jest.fn(() => jest.fn()),
      state: { values: { amount: mockFormAmountValue } },
      getState: () => ({ values: { amount: mockFormAmountValue }, canSubmit: true }),
    },
    reset: jest.fn(),
    handleSubmit: () => onSubmit({ value: { amount: mockFormAmountValue } }),
    AppField: ({
      name,
      children,
    }: {
      name: string
      children: (field: unknown) => React.ReactNode
    }) => {
      const fieldProps = {
        AmountInputField: ({
          label,
          errorOverride,
        }: {
          label?: string
          errorOverride?: string | boolean
        }) => (
          <div data-test={`field-${name}`}>
            {label && <label>{label}</label>}
            <input data-test={`input-${name}`} readOnly value={mockFormAmountValue} />
            {errorOverride && <span data-test="bounds-error">{errorOverride}</span>}
          </div>
        ),
      }

      return <>{children(fieldProps)}</>
    },
    AppForm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SubmitButton: ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
      <button type="submit" data-test="submit" disabled={disabled}>
        {children}
      </button>
    ),
  }),
}))

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: jest.fn(() => ({})),
  useStore: (
    store: { getState: () => { values: { amount: number | '' } } },
    selector: (state: { values: { amount: number | '' } }) => unknown,
  ) => selector(store.getState()),
}))

const wallet = {
  id: 'wallet-1',
  currency: CurrencyEnum.Usd,
  name: 'Test wallet',
  rateAmount: '1',
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
}

const setupDefaultMocks = () => {
  mockFormAmountValue = ''

  mockUseCustomerPortalTranslate.mockReturnValue({
    translate: (key: string) => key,
    documentLocale: 'en',
  })

  mockUseCustomerPortalNavigation.mockReturnValue({
    goHome: jest.fn(),
  })

  mockUseCustomerPortalWalletQuery.mockReturnValue({
    data: { customerPortalWallet: wallet },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  })
}

describe('WalletPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultMocks()
  })

  describe('GIVEN the wallet is loading', () => {
    it('THEN should render the loading skeleton', () => {
      mockUseCustomerPortalWalletQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<WalletPage />)

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('field-amount')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN there is an error', () => {
    it('THEN should render the error state', () => {
      mockUseCustomerPortalWalletQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(<WalletPage />)

      expect(screen.getByTestId('section-error')).toBeInTheDocument()
      expect(screen.queryByTestId('field-amount')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the wallet is loaded', () => {
    it('THEN should render the page title, amount field and submit button', () => {
      render(<WalletPage />)

      expect(screen.getByTestId('page-title')).toBeInTheDocument()
      expect(screen.getByTestId('field-amount')).toBeInTheDocument()
      expect(screen.getByTestId('submit')).toBeInTheDocument()
    })

    it('THEN should submit the top-up amount', () => {
      mockFormAmountValue = 10

      render(<WalletPage />)

      screen.getByTestId('submit').click()

      expect(mockTopUpPortalWallet).toHaveBeenCalledWith({
        variables: {
          input: {
            walletId: wallet.id,
            paidCredits: '10',
          },
        },
      })
    })
  })

  describe('GIVEN the entered amount is above the wallet paid top-up max', () => {
    it('THEN should render the bounds error and disable the submit button', () => {
      mockFormAmountValue = 10

      mockUseCustomerPortalWalletQuery.mockReturnValue({
        data: {
          customerPortalWallet: {
            ...wallet,
            paidTopUpMaxAmountCents: '100',
          },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<WalletPage />)

      expect(screen.getByTestId('bounds-error')).toBeInTheDocument()
      expect(screen.getByTestId('submit')).toBeDisabled()
    })
  })
})
