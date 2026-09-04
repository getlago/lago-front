import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { addToast } from '~/core/apolloClient'
import {
  CurrencyEnum,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import CustomerInvoiceVoid, {
  CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID,
} from '../CustomerInvoiceVoid'

const mockUseGetInvoiceDetailsQuery = jest.fn()
const mockVoidInvoice = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: jest.fn() }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => {
  const { TimezoneEnum } = jest.requireActual('~/generated/graphql')

  return { useOrganizationInfos: () => ({ timezone: TimezoneEnum.TzUtc }) }
})

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: false }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetInvoiceDetailsQuery: () => mockUseGetInvoiceDetailsQuery(),
    useVoidInvoiceMutation: () => [mockVoidInvoice],
    useGetCustomerWalletListQuery: () => ({ data: undefined }),
  }
})

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const customerId = 'customer-1'
const invoiceId = 'invoice-1'

const buildInvoice = (status: InvoiceStatusTypeEnum) => ({
  id: invoiceId,
  number: 'INV-2026-0001',
  status,
  invoiceType: InvoiceTypeEnum.Subscription,
  paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
  currency: CurrencyEnum.Usd,
  totalAmountCents: 10000,
  totalPaidAmountCents: 0,
  totalDueAmountCents: 10000,
  issuingDate: '2026-09-01',
  customer: { id: customerId, deletedAt: null },
})

const mockQueryResult = ({
  status,
  loading = false,
}: {
  status?: InvoiceStatusTypeEnum
  loading?: boolean
}) => {
  mockUseGetInvoiceDetailsQuery.mockReturnValue({
    data: status ? { invoice: buildInvoice(status) } : undefined,
    loading,
    error: undefined,
  })
}

const renderPage = () => render(<CustomerInvoiceVoid />, { useParams: { customerId, invoiceId } })

describe('CustomerInvoiceVoid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN an invoice the API would refuse to void', () => {
    describe.each([
      ['voided', InvoiceStatusTypeEnum.Voided],
      ['draft', InvoiceStatusTypeEnum.Draft],
      ['pending', InvoiceStatusTypeEnum.Pending],
      ['failed', InvoiceStatusTypeEnum.Failed],
    ])('WHEN the invoice is %s', (_, status) => {
      it('THEN should display the placeholder instead of the void form', () => {
        mockQueryResult({ status })

        renderPage()

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the submit button', () => {
        mockQueryResult({ status })

        renderPage()

        expect(
          screen.queryByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user lacks the void permission', () => {
    describe('WHEN the invoice is finalized', () => {
      it('THEN should display the placeholder instead of the void form', () => {
        mockHasPermissions.mockReturnValue(false)
        mockQueryResult({ status: InvoiceStatusTypeEnum.Finalized })

        renderPage()

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a finalized invoice', () => {
    describe('WHEN the page renders', () => {
      it('THEN should display the submit button', () => {
        mockQueryResult({ status: InvoiceStatusTypeEnum.Finalized })

        renderPage()

        expect(screen.getByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the placeholder', () => {
        mockQueryResult({ status: InvoiceStatusTypeEnum.Finalized })

        renderPage()

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the invoice query has not settled', () => {
    describe('WHEN the page renders', () => {
      it('THEN should display neither the submit button nor the placeholder', () => {
        mockQueryResult({ loading: true })

        renderPage()

        expect(
          screen.queryByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a finalized invoice and the void action', () => {
    beforeEach(() => {
      mockQueryResult({ status: InvoiceStatusTypeEnum.Finalized })
    })

    describe('WHEN the mutation succeeds', () => {
      it('THEN should toast the success and navigate to the invoice overview', async () => {
        mockVoidInvoice.mockResolvedValueOnce({
          data: { voidInvoice: { id: invoiceId, status: InvoiceStatusTypeEnum.Voided } },
        })

        const user = userEvent.setup()

        renderPage()

        await user.click(screen.getByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          `/customer/${customerId}/invoice/${invoiceId}/overview`,
        )
      })
    })

    describe('WHEN the mutation is rejected with not_voidable', () => {
      it('THEN should toast the dedicated error and stay on the page', async () => {
        mockVoidInvoice.mockResolvedValueOnce({
          data: null,
          errors: [
            {
              message: 'Method Not Allowed',
              extensions: { code: 'not_voidable', status: 405 },
            },
          ],
        })

        const user = userEvent.setup()

        renderPage()

        await user.click(screen.getByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        })

        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation is rejected with any other code', () => {
      it('THEN should not toast, leaving the global error link to report it', async () => {
        mockVoidInvoice.mockResolvedValueOnce({
          data: null,
          errors: [{ message: 'Internal Error', extensions: { code: 'internal_error' } }],
        })

        const user = userEvent.setup()

        renderPage()

        await user.click(screen.getByTestId(CUSTOMER_INVOICE_VOID_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockVoidInvoice).toHaveBeenCalled()
        })

        expect(addToast).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
