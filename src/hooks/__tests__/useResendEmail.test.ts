import { renderHook } from '@testing-library/react'

import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'
import { useResendEmail } from '~/hooks/useResendEmail'
import { AllTheProviders } from '~/test-utils'

const mockResendCreditNoteEmail = jest.fn()
const mockResendInvoiceEmail = jest.fn()
const mockResendPaymentReceiptEmail = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useResendCreditNoteEmailMutation: () => [mockResendCreditNoteEmail],
  useResendInvoiceEmailMutation: () => [mockResendInvoiceEmail],
  useResendPaymentReceiptEmailMutation: () => [mockResendPaymentReceiptEmail],
}))

describe('useResendEmail', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return a resendEmail function', () => {
        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.resendEmail).toBe('function')
      })
    })
  })

  describe('GIVEN the type is CreditNoteCreated', () => {
    describe('WHEN resendEmail is called successfully', () => {
      it('THEN should call resendCreditNoteEmail mutation with correct variables', async () => {
        mockResendCreditNoteEmail.mockResolvedValue({
          data: { resendCreditNoteEmail: { id: 'cn-1' } },
        })

        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        const response = await result.current.resendEmail({
          type: BillingEntityEmailSettingsEnum.CreditNoteCreated,
          documentId: 'cn-1',
          to: ['test@example.com'],
        })

        expect(mockResendCreditNoteEmail).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'cn-1',
              to: ['test@example.com'],
            },
          },
        })
        expect(response).toEqual({
          success: true,
          response: { resendCreditNoteEmail: { id: 'cn-1' } },
        })
      })
    })
  })

  describe('GIVEN the type is InvoiceFinalized', () => {
    describe('WHEN resendEmail is called successfully', () => {
      it('THEN should call resendInvoiceEmail mutation with correct variables', async () => {
        mockResendInvoiceEmail.mockResolvedValue({
          data: { resendInvoiceEmail: { id: 'inv-1' } },
        })

        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        const response = await result.current.resendEmail({
          type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
          documentId: 'inv-1',
          to: ['to@example.com'],
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
        })

        expect(mockResendInvoiceEmail).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'inv-1',
              to: ['to@example.com'],
              cc: ['cc@example.com'],
              bcc: ['bcc@example.com'],
            },
          },
        })
        expect(response).toEqual({
          success: true,
          response: { resendInvoiceEmail: { id: 'inv-1' } },
        })
      })
    })
  })

  describe('GIVEN the type is PaymentReceiptCreated', () => {
    describe('WHEN resendEmail is called successfully', () => {
      it('THEN should call resendPaymentReceiptEmail mutation with correct variables', async () => {
        mockResendPaymentReceiptEmail.mockResolvedValue({
          data: { resendPaymentReceiptEmail: { id: 'pr-1' } },
        })

        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        const response = await result.current.resendEmail({
          type: BillingEntityEmailSettingsEnum.PaymentReceiptCreated,
          documentId: 'pr-1',
        })

        expect(mockResendPaymentReceiptEmail).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'pr-1',
            },
          },
        })
        expect(response).toEqual({
          success: true,
          response: { resendPaymentReceiptEmail: { id: 'pr-1' } },
        })
      })
    })
  })

  describe('GIVEN empty recipient arrays are provided', () => {
    describe('WHEN resendEmail is called', () => {
      it('THEN should omit empty recipient arrays from the input', async () => {
        mockResendInvoiceEmail.mockResolvedValue({
          data: { resendInvoiceEmail: { id: 'inv-1' } },
        })

        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        await result.current.resendEmail({
          type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
          documentId: 'inv-1',
          to: [],
          cc: [],
          bcc: [],
        })

        expect(mockResendInvoiceEmail).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'inv-1',
            },
          },
        })
      })
    })
  })

  describe('GIVEN the mutation fails', () => {
    describe('WHEN resendEmail is called', () => {
      it('THEN should return error result', async () => {
        const mockError = new Error('Network error')

        mockResendInvoiceEmail.mockRejectedValue(mockError)

        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        const response = await result.current.resendEmail({
          type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
          documentId: 'inv-1',
        })

        expect(response).toEqual({
          success: false,
          error: mockError,
        })
      })
    })
  })

  describe('GIVEN an unsupported type', () => {
    describe('WHEN resendEmail is called', () => {
      it('THEN should return error result for missing type', async () => {
        const { result } = renderHook(() => useResendEmail(), {
          wrapper: customWrapper,
        })

        const response = await result.current.resendEmail({
          type: 'unsupported_type' as BillingEntityEmailSettingsEnum,
          documentId: 'doc-1',
        })

        expect(response).toEqual({
          success: false,
          error: expect.any(Error),
        })
      })
    })
  })
})
