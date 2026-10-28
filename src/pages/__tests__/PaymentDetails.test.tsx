import { screen, within } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  PayablePaymentStatusEnum,
  PaymentTypeEnum,
  ProviderTypeEnum,
  X402AssetEnum,
  X402SettlementKindEnum,
  X402SettlementStatusEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import PaymentDetails, {
  PAYMENT_METHOD_TEST_ID,
  X402_SETTLEMENT_CREDIT_GRANTED_TEST_ID,
  X402_SETTLEMENT_KIND_TEST_ID,
  X402_SETTLEMENT_SECTION_TEST_ID,
  X402_SETTLEMENT_STATUS_TEST_ID,
} from '../PaymentDetails'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    timezone: 'UTC',
  }),
}))

const mockHasPermissions = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/useResendEmailDialog', () => ({
  useResendEmailDialog: () => ({
    showResendEmailDialog: jest.fn(),
  }),
}))

const mockDownloadPaymentReceipts = jest.fn()
const mockDownloadPaymentXmlReceipts = jest.fn()

jest.mock('~/hooks/paymentReceipts/useDownloadPaymentReceipts', () => ({
  __esModule: true,
  default: () => ({
    canDownloadPaymentReceipts: true,
    downloadPaymentReceipts: mockDownloadPaymentReceipts,
    downloadPaymentXmlReceipts: mockDownloadPaymentXmlReceipts,
  }),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockPaymentData = {
  payment: {
    id: 'payment-123',
    amountCents: '5000',
    amountCurrency: CurrencyEnum.Usd,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    reference: 'REF-001',
    paymentType: PaymentTypeEnum.Manual,
    paymentProviderType: null,
    payablePaymentStatus: PayablePaymentStatusEnum.Succeeded,
    providerPaymentId: null,
    customer: {
      deletedAt: null,
      id: 'customer-123',
      name: 'Test Customer',
      email: 'test@example.com',
      displayName: 'Test Customer',
      applicableTimezone: 'UTC',
      billingEntity: {
        id: 'billing-entity-1',
        name: 'Billing Co',
        email: 'billing@example.com',
        einvoicing: false,
        emailSettings: [],
        logoUrl: null,
      },
    },
    payable: {
      __typename: 'Invoice' as const,
      id: 'invoice-123',
      payableType: 'Invoice',
      status: 'finalized',
      paymentStatus: 'succeeded',
      number: 'INV-001',
      totalAmountCents: '10000',
      totalDueAmountCents: '0',
      issuingDate: '2024-01-10',
      currency: CurrencyEnum.Usd,
      paymentOverdue: false,
      totalPaidAmountCents: '10000',
      paymentDisputeLostAt: null,
    },
    paymentReceipt: {
      id: 'receipt-123',
      xmlUrl: null,
      number: 'REC-001',
    },
  },
}

const mockUseGetPaymentDetailsQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPaymentDetailsQuery: () => mockUseGetPaymentDetailsQuery(),
}))

describe('PaymentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    mockHasPermissions.mockReturnValue(true)

    const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      customerId: 'customer-123',
      paymentId: 'payment-123',
    })

    mockUseGetPaymentDetailsQuery.mockReturnValue({
      data: mockPaymentData,
      loading: false,
    })
  })

  describe('GIVEN the page is rendered with data', () => {
    describe('WHEN in default state', () => {
      it('THEN should configure MainHeader with breadcrumb', () => {
        render(<PaymentDetails />)

        expect(capturedConfig?.breadcrumb).toHaveLength(1)
        expect(capturedConfig?.breadcrumb?.[0].label).toBe('text_6672ebb8b1b50be550eccbed')
      })

      it('THEN should configure MainHeader with entity containing formatted amount', () => {
        render(<PaymentDetails />)

        expect(capturedConfig?.entity?.viewName).toBeDefined()
        expect(capturedConfig?.entity?.metadata).toBe('payment-123')
      })

      it('THEN should configure MainHeader with a dropdown action', () => {
        render(<PaymentDetails />)

        expect(capturedConfig?.actions?.items).toHaveLength(1)
        expect(capturedConfig?.actions?.items[0].type).toBe('dropdown')
      })

      it('THEN should configure MainHeader with entity badges', () => {
        render(<PaymentDetails />)

        expect(capturedConfig?.entity?.badges?.length).toBeGreaterThan(0)
      })

      it('THEN should display the customer name', () => {
        render(<PaymentDetails />)

        expect(screen.getByText('Test Customer')).toBeInTheDocument()
      })

      it('THEN should display the invoice number', () => {
        render(<PaymentDetails />)

        expect(screen.getByText('INV-001')).toBeInTheDocument()
      })

      it('THEN should display the provider payment ID and external-link icon inline', () => {
        mockUseGetPaymentDetailsQuery.mockReturnValue({
          data: {
            payment: {
              ...mockPaymentData.payment,
              paymentType: PaymentTypeEnum.Provider,
              paymentProviderType: ProviderTypeEnum.Stripe,
              providerPaymentId: 'provider-payment-123',
            },
          },
          loading: false,
        })

        render(<PaymentDetails />)

        const providerPaymentId = screen.getByText('provider-payment-123')

        expect(providerPaymentId).toHaveClass('flex', 'items-center', 'gap-1')
        expect(within(providerPaymentId).getByTestId('outside/medium')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an x402 payment', () => {
    const x402Payment = (settlement: Record<string, unknown>) => ({
      data: {
        payment: {
          ...mockPaymentData.payment,
          amountCents: '1000',
          paymentType: PaymentTypeEnum.X402,
          x402Settlement: {
            id: 'settlement-1',
            kind: X402SettlementKindEnum.CreditPurchase,
            status: X402SettlementStatusEnum.Settled,
            network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            asset: X402AssetEnum.Usdc,
            payerAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            payeeAddress: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
            settledAmountCents: '1000',
            creditAmount: '10.0',
            ...settlement,
          },
        },
      },
      loading: false,
    })

    it('THEN shows the method and the settlement section from the API', () => {
      mockUseGetPaymentDetailsQuery.mockReturnValue(x402Payment({}))

      render(<PaymentDetails />)

      const section = screen.getByTestId(X402_SETTLEMENT_SECTION_TEST_ID)

      expect(screen.getByTestId(PAYMENT_METHOD_TEST_ID)).toHaveTextContent(
        'text_1793137178564a1ls2ponepm',
      )
      expect(screen.getByTestId(X402_SETTLEMENT_KIND_TEST_ID)).toHaveTextContent(
        'text_1793137178565p638pj01m11',
      )
      expect(
        within(section).getByText('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'),
      ).toBeInTheDocument()
      expect(
        within(section).getByText('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'),
      ).toBeInTheDocument()
      expect(within(section).getByText('Solana')).toBeInTheDocument()
      expect(within(section).getByText('USDC')).toBeInTheDocument()
      expect(screen.getByTestId(X402_SETTLEMENT_STATUS_TEST_ID)).toHaveTextContent(
        'text_17419455271371fw602t6rhg',
      )
      expect(screen.getByTestId(X402_SETTLEMENT_CREDIT_GRANTED_TEST_ID)).toHaveTextContent('10')
    })

    it('WHEN it paid an invoice THEN shows no credit granted and a pending status', () => {
      mockUseGetPaymentDetailsQuery.mockReturnValue(
        x402Payment({
          kind: X402SettlementKindEnum.InvoicePayment,
          status: X402SettlementStatusEnum.Pending,
          creditAmount: null,
        }),
      )

      render(<PaymentDetails />)

      expect(screen.getByTestId(X402_SETTLEMENT_KIND_TEST_ID)).toHaveTextContent(
        'text_1793137178565lnwwik8dvve',
      )
      expect(screen.getByTestId(X402_SETTLEMENT_CREDIT_GRANTED_TEST_ID)).toHaveTextContent('-')
      expect(screen.getByTestId(X402_SETTLEMENT_STATUS_TEST_ID)).not.toHaveTextContent(
        'text_17419455271371fw602t6rhg',
      )
    })

    it('WHEN the cached payment refreshes THEN keeps the settlement section', () => {
      mockUseGetPaymentDetailsQuery.mockReturnValue({ ...x402Payment({}), loading: true })

      render(<PaymentDetails />)

      expect(screen.getByTestId(X402_SETTLEMENT_SECTION_TEST_ID)).toBeInTheDocument()
    })

    it('WHEN the payment has no settlement THEN shows no settlement section', () => {
      render(<PaymentDetails />)

      expect(screen.queryByTestId(X402_SETTLEMENT_SECTION_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the page is loading', () => {
    beforeEach(() => {
      mockUseGetPaymentDetailsQuery.mockReturnValue({
        data: {},
        loading: true,
      })
    })

    describe('WHEN the component renders', () => {
      it('THEN should set actionsLoading on MainHeader config', () => {
        render(<PaymentDetails />)

        expect(capturedConfig?.actions?.loading).toBe(true)
      })
    })
  })

  describe('GIVEN the dropdown items', () => {
    describe('WHEN the copy ID item is clicked', () => {
      it('THEN should copy the payment ID to clipboard', () => {
        render(<PaymentDetails />)

        const dropdownAction = capturedConfig?.actions?.items[0]

        if (dropdownAction?.type === 'dropdown') {
          const copyItem = dropdownAction.items[0]

          copyItem.onClick(jest.fn())

          expect(copyToClipboard).toHaveBeenCalledWith('payment-123')
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
        }
      })
    })
  })
})
