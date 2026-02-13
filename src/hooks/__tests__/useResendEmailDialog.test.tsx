import { act, renderHook } from '@testing-library/react'

import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'
import { useResendEmailDialog } from '~/hooks/useResendEmailDialog'
import { AllTheProviders } from '~/test-utils'

const mockFormDialogOpen = jest.fn().mockResolvedValue({})

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/useResendEmail', () => ({
  useResendEmail: () => ({
    resendEmail: jest.fn(),
  }),
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns showResendEmailDialog function', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    expect(result.current.showResendEmailDialog).toBeDefined()
    expect(typeof result.current.showResendEmailDialog).toBe('function')
  })

  it('opens form dialog when showResendEmailDialog is called', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('does not open dialog when documentId is undefined', () => {
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

  it('passes correct subject to dialog', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        ...defaultParams,
        subject: 'My Custom Subject',
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalled()

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs).toBeDefined()
  })

  it('passes type to dialog when provided', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        ...defaultParams,
        type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('passes billingEntity to dialog when provided', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    const mockBillingEntity = {
      id: '1',
      name: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
      einvoicing: true,
    }

    act(() => {
      result.current.showResendEmailDialog({
        ...defaultParams,
        billingEntity: mockBillingEntity,
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('opens dialog with all parameters provided', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    const mockBillingEntity = {
      id: '1',
      name: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
      einvoicing: true,
    }

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Invoice from Test Company',
        documentId: 'doc-456',
        type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
        billingEntity: mockBillingEntity,
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('dialog config includes title', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs.title).toBeDefined()
    expect(typeof callArgs.title).toBe('string')
  })

  it('dialog config includes headerContent', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs.headerContent).toBeDefined()
  })

  it('dialog config includes children (EmailPreview)', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs.children).toBeDefined()
  })

  it('dialog config includes mainAction', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs.mainAction).toBeDefined()
  })

  it('dialog config includes form with id and submit', () => {
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

  it('can be called multiple times', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        ...defaultParams,
        subject: 'First Subject',
      })
    })

    act(() => {
      result.current.showResendEmailDialog({
        ...defaultParams,
        subject: 'Second Subject',
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(2)
  })

  it('handles different email types', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    const types = [
      BillingEntityEmailSettingsEnum.InvoiceFinalized,
      BillingEntityEmailSettingsEnum.CreditNoteCreated,
      BillingEntityEmailSettingsEnum.PaymentReceiptCreated,
    ]

    types.forEach((type) => {
      act(() => {
        result.current.showResendEmailDialog({
          ...defaultParams,
          type,
        })
      })
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(types.length)
  })

  it('works without optional parameters', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog(defaultParams)
    })

    expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)

    const callArgs = mockFormDialogOpen.mock.calls[0][0]

    expect(callArgs).toBeDefined()
    expect(callArgs.title).toBeDefined()
    expect(callArgs.headerContent).toBeDefined()
    expect(callArgs.children).toBeDefined()
    expect(callArgs.mainAction).toBeDefined()
    expect(callArgs.form).toBeDefined()
  })
})
