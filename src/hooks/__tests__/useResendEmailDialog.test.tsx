import { act, renderHook, screen } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { BillingEntityEmailSettingsEnum, LagoApiError } from '~/generated/graphql'
import { useResendEmailDialog } from '~/hooks/useResendEmailDialog'
import { AllTheProviders, render } from '~/test-utils'

const mockFormDialogOpen = jest.fn()
const mockResendEmail = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/useResendEmail', () => ({
  useResendEmail: () => ({
    resendEmail: mockResendEmail,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

describe('useResendEmailDialog', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
    })

  const defaultParams = {
    subject: 'Test Subject',
    documentId: 'doc-123',
    type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
    billingEntity: undefined,
    customerEmail: 'customer@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({})
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return showResendEmailDialog function', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.showResendEmailDialog).toBe('function')
      })
    })
  })

  describe('GIVEN showResendEmailDialog is called', () => {
    describe('WHEN documentId is provided', () => {
      it('THEN should open the form dialog', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN documentId is undefined', () => {
      it('THEN should not open the dialog', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog({
            ...defaultParams,
            documentId: undefined,
          })
        })

        expect(mockFormDialogOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN customerEmail is provided', () => {
      it('THEN should pre-fill the to field in headerContent', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        render(callArgs.headerContent)

        expect(screen.getByText('customer@example.com')).toBeInTheDocument()
      })
    })

    describe('WHEN customerEmail is undefined', () => {
      it('THEN should not pre-fill the to field', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog({
            ...defaultParams,
            customerEmail: undefined,
          })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        render(callArgs.headerContent)

        expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument()
      })
    })

    describe('WHEN customerEmail is null', () => {
      it('THEN should not pre-fill the to field', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog({
            ...defaultParams,
            customerEmail: null,
          })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        render(callArgs.headerContent)

        expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the dialog config', () => {
    describe('WHEN dialog opens', () => {
      it('THEN should include closeOnError false', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.closeOnError).toBe(false)
      })

      it('THEN should include onError callback', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(typeof callArgs.onError).toBe('function')
      })

      it.each([
        ['title', 'string'],
        ['headerContent', 'object'],
        ['children', 'object'],
        ['mainAction', 'object'],
      ])('THEN should include %s', (prop, expectedType) => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs[prop]).toBeDefined()
        expect(typeof callArgs[prop]).toBe(expectedType)
      })

      it('THEN should include form with id and submit', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.form).toBeDefined()
        expect(callArgs.form.id).toBeDefined()
        expect(typeof callArgs.form.submit).toBe('function')
      })
    })
  })

  describe('GIVEN the same hook instance opens the dialog twice', () => {
    const openTwiceAndRenderLastHeader = (secondCustomerEmail: string | null | undefined): void => {
      const { result } = renderHook(() => useResendEmailDialog(), {
        wrapper: customWrapper,
      })

      act(() => {
        result.current.showResendEmailDialog({
          ...defaultParams,
          documentId: 'doc-first',
          customerEmail: 'first@example.com',
        })
      })

      act(() => {
        result.current.showResendEmailDialog({
          ...defaultParams,
          documentId: 'doc-second',
          customerEmail: secondCustomerEmail,
        })
      })

      render(mockFormDialogOpen.mock.calls[1][0].headerContent)
    }

    describe('WHEN the second document has no customer email', () => {
      it('THEN should not keep the first document recipients', () => {
        openTwiceAndRenderLastHeader(undefined)

        expect(screen.queryByText('first@example.com')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the second document has a different customer email', () => {
      it('THEN should replace the first document recipients', () => {
        openTwiceAndRenderLastHeader('second@example.com')

        expect(screen.getByText('second@example.com')).toBeInTheDocument()
        expect(screen.queryByText('first@example.com')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the dialog is shared across document types', () => {
    const openWithTypeAndGetTitle = (type: BillingEntityEmailSettingsEnum): string => {
      const { result } = renderHook(() => useResendEmailDialog(), {
        wrapper: customWrapper,
      })

      act(() => {
        result.current.showResendEmailDialog({ ...defaultParams, type })
      })

      return mockFormDialogOpen.mock.calls.at(-1)?.[0].title
    }

    describe('WHEN the document is an invoice', () => {
      it('THEN should title the dialog with the send email copy', () => {
        expect(openWithTypeAndGetTitle(BillingEntityEmailSettingsEnum.InvoiceFinalized)).toBe(
          'Send email',
        )
      })
    })

    describe('WHEN the document is a credit note or a payment receipt', () => {
      it.each([
        BillingEntityEmailSettingsEnum.CreditNoteCreated,
        BillingEntityEmailSettingsEnum.PaymentReceiptCreated,
      ])('THEN should keep the resend email copy for %s', (type) => {
        expect(openWithTypeAndGetTitle(type)).toBe('Resend email')
      })
    })
  })

  describe('GIVEN the dialog resolves with success', () => {
    describe('WHEN result reason is success', () => {
      it('THEN should show success toast', async () => {
        mockFormDialogOpen.mockResolvedValue({ reason: 'success' })

        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.showResendEmailDialog(defaultParams)
        })

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN result reason is not success', () => {
      it('THEN should not show success toast', async () => {
        mockFormDialogOpen.mockResolvedValue({ reason: 'close' })

        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.showResendEmailDialog(defaultParams)
        })

        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the onError callback', () => {
    describe('WHEN error is UnprocessableEntity', () => {
      it('THEN should show danger toast', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]
        const { onError } = callArgs

        onError(new Error(LagoApiError.UnprocessableEntity))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })

    describe('WHEN error is form validation', () => {
      it('THEN should not show any toast', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]
        const { onError } = callArgs

        onError(new Error('form.invalid'))

        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN error is a generic error', () => {
      it('THEN should not show local toast (global errorLink handles it)', () => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog(defaultParams)
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]
        const { onError } = callArgs

        onError(new Error())

        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN different email types', () => {
    describe('WHEN called with each type', () => {
      it.each([
        BillingEntityEmailSettingsEnum.InvoiceFinalized,
        BillingEntityEmailSettingsEnum.CreditNoteCreated,
        BillingEntityEmailSettingsEnum.PaymentReceiptCreated,
      ])('THEN should open dialog for type %s', (type) => {
        const { result } = renderHook(() => useResendEmailDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.showResendEmailDialog({
            ...defaultParams,
            type,
          })
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })
    })
  })
})
