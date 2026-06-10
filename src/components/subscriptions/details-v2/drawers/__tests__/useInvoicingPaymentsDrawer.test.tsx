import { act, render, renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { InvoicingPaymentsSectionFragment } from '~/generated/graphql'

import { useInvoicingPaymentsDrawer } from '../useInvoicingPaymentsDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  form?: { id: string; submit: () => void }
  closeOnSubmitSuccess?: boolean
}

const mockOpen = jest.fn<void, [CapturedDrawerArgs]>()
const mockClose = jest.fn()
const mockHandleSubmit = jest.fn()
const mockResetForm = jest.fn()
// Captures the onSuccess the hook hands to the update hook, so we can assert
// the success path closes the drawer.
const mockOnSuccessHolder: { current?: () => void } = {}

// Mock the NiceModal-backed drawer hook so Jest never loads the drawer stack
// (drawerStack.ts uses import.meta and crashes Jest) and we can capture the
// args the hook passes to `open`.
jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/hooks/customer/useUpdateSubscriptionInvoicingPayments', () => ({
  useUpdateSubscriptionInvoicingPayments: (options: { onSuccess?: () => void }) => {
    mockOnSuccessHolder.current = options?.onSuccess

    return {
      form: {
        handleSubmit: mockHandleSubmit,
        AppForm: ({ children }: { children: ReactNode }) => <>{children}</>,
        SubmitButton: ({ children, dataTest }: { children: ReactNode; dataTest?: string }) => (
          <button type="submit" data-test={dataTest}>
            {children}
          </button>
        ),
      },
      resetForm: mockResetForm,
    }
  },
}))

// Stub the form section: surface the customer external id so we can assert the
// drawer body is wired with the subscription's customer.
jest.mock('~/components/subscriptions/form/InvoicingPaymentsFormSection', () => ({
  InvoicingPaymentsFormSection: ({
    customer,
  }: {
    customer: { id?: string | null; externalId?: string | null }
  }) => {
    const React = jest.requireActual('react')

    return React.createElement('div', null, `customer-${customer?.externalId ?? 'none'}`)
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const subscription = {
  id: 'sub-1',
  paymentMethodType: null,
  paymentMethod: null,
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [],
  customer: { id: 'cust-1', externalId: 'cust-ext-1' },
} as unknown as InvoicingPaymentsSectionFragment

describe('useInvoicingPaymentsDrawer', () => {
  beforeEach(() => {
    mockOpen.mockClear()
    mockClose.mockClear()
    mockHandleSubmit.mockClear()
    mockResetForm.mockClear()
    mockOnSuccessHolder.current = undefined
  })

  it('closes the drawer when the update succeeds', () => {
    renderHook(() => useInvoicingPaymentsDrawer(subscription))

    expect(typeof mockOnSuccessHolder.current).toBe('function')

    act(() => mockOnSuccessHolder.current?.())

    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('opens the drawer with the edit title, form id and content', () => {
    const { result } = renderHook(() => useInvoicingPaymentsDrawer(subscription))

    act(() => result.current.openDrawer())

    expect(mockResetForm).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledTimes(1)

    const openArgs = mockOpen.mock.calls[0][0]

    expect(openArgs.title).toBe('text_1780503765268ttscgcx6yo7')
    expect(openArgs.form?.id).toBe('invoicing-payments-drawer-form')
    expect(typeof openArgs.form?.submit).toBe('function')
    expect(openArgs.children).toBeDefined()
  })

  it('hosts the form section wired with the subscription customer', () => {
    const { result } = renderHook(() => useInvoicingPaymentsDrawer(subscription))

    act(() => result.current.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    render(<>{openArgs.children}</>)

    expect(screen.getByText('customer-cust-ext-1')).toBeInTheDocument()
  })

  it('renders a submit button and submits through the drawer form handler', () => {
    const { result } = renderHook(() => useInvoicingPaymentsDrawer(subscription))

    act(() => result.current.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    // The save action is a type="submit" button; it triggers the drawer form,
    // it does not wire its own onClick handler.
    render(<>{openArgs.mainAction}</>)
    expect(screen.getByRole('button', { name: 'text_17295436903260tlyb1gp1i7' })).toHaveAttribute(
      'type',
      'submit',
    )

    // The drawer form's submit handler drives the tanstack submission.
    openArgs.form?.submit()
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps close ownership in the drawer so a failed save leaves it open', () => {
    const { result } = renderHook(() => useInvoicingPaymentsDrawer(subscription))

    act(() => result.current.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    expect(openArgs.closeOnSubmitSuccess).toBe(false)
  })
})
