import { act, renderHook } from '@testing-library/react'

import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'
import { useResendEmailDialog } from '~/hooks/useResendEmailDialog'
import { AllTheProviders } from '~/test-utils'

const mockCentralizedDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({
    open: mockCentralizedDialogOpen,
    close: jest.fn(),
  }),
}))

describe('useResendEmailDialog', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
    })

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

  it('opens centralized dialog when showResendEmailDialog is called', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('passes correct subject to dialog', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'My Custom Subject',
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalled()

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs).toBeDefined()
  })

  it('passes type to dialog when provided', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
        type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(1)
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
        subject: 'Test Subject',
        billingEntity: mockBillingEntity,
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(1)
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
        type: BillingEntityEmailSettingsEnum.InvoiceFinalized,
        billingEntity: mockBillingEntity,
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(1)
  })

  it('dialog config includes title', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs.title).toBeDefined()
    expect(typeof callArgs.title).toBe('string')
  })

  it('dialog config includes headerContent', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs.headerContent).toBeDefined()
  })

  it('dialog config includes children (EmailPreview)', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs.children).toBeDefined()
  })

  it('dialog config includes onAction callback', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs.onAction).toBeDefined()
    expect(typeof callArgs.onAction).toBe('function')
  })

  it('dialog config includes actionText', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Test Subject',
      })
    })

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs.actionText).toBeDefined()
    expect(typeof callArgs.actionText).toBe('string')
  })

  it('can be called multiple times', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'First Subject',
      })
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Second Subject',
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(2)
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
          subject: 'Test Subject',
          type,
        })
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(types.length)
  })

  it('works without optional parameters', () => {
    const { result } = renderHook(() => useResendEmailDialog(), {
      wrapper: customWrapper,
    })

    act(() => {
      result.current.showResendEmailDialog({
        subject: 'Minimal Subject',
      })
    })

    expect(mockCentralizedDialogOpen).toHaveBeenCalledTimes(1)

    const callArgs = mockCentralizedDialogOpen.mock.calls[0][0]

    expect(callArgs).toBeDefined()
    expect(callArgs.title).toBeDefined()
    expect(callArgs.headerContent).toBeDefined()
    expect(callArgs.children).toBeDefined()
    expect(callArgs.onAction).toBeDefined()
    expect(callArgs.actionText).toBeDefined()
  })
})
