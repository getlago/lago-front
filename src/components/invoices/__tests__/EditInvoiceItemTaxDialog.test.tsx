import { act, renderHook } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import {
  EDIT_INVOICE_ITEM_TAX_FORM_ID,
  useEditInvoiceItemTaxDialog,
} from '../EditInvoiceItemTaxDialog'
import { LocalFeeInput } from '../types'

const mockFormDialogOpen = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const TAX = { id: 'tax-1', name: 'VAT', rate: 20, code: 'vat' }
const validTaxes = [TAX] as unknown as LocalFeeInput['taxes']
const invalidTaxes = [{}] as unknown as LocalFeeInput['taxes']

describe('useEditInvoiceItemTaxDialog', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children })

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return openEditInvoiceItemTaxDialog function', () => {
        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.openEditInvoiceItemTaxDialog).toBe('function')
      })
    })
  })

  describe('GIVEN openEditInvoiceItemTaxDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open once', () => {
        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback: jest.fn() })
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['closeOnError', false],
        ['cancelOrCloseText', 'cancel'],
      ])('THEN should pass %s', (prop, expected) => {
        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback: jest.fn() })
        })

        expect(mockFormDialogOpen.mock.calls[0][0][prop]).toBe(expected)
      })

      it.each([
        ['title', 'string'],
        ['description', 'string'],
        ['children', 'object'],
        ['mainAction', 'object'],
      ])('THEN should include %s', (prop, expectedType) => {
        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback: jest.fn() })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs[prop]).toBeDefined()
        expect(typeof callArgs[prop]).toBe(expectedType)
      })

      it('THEN should include form with the expected id and a submit function', () => {
        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback: jest.fn() })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.form.id).toBe(EDIT_INVOICE_ITEM_TAX_FORM_ID)
        expect(typeof callArgs.form.submit).toBe('function')
      })
    })
  })

  describe('GIVEN the form is submitted', () => {
    describe('WHEN every tax row has an id', () => {
      it('THEN should invoke the callback with the taxes array', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback })
        })

        expect(callback).toHaveBeenCalledWith([TAX])
      })
    })

    describe('WHEN the taxes array is empty', () => {
      it('THEN should invoke the callback with an empty array', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: [], callback })
        })

        expect(callback).toHaveBeenCalledWith([])
      })
    })

    describe('WHEN a tax row has no id', () => {
      it('THEN should not invoke the callback', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: invalidTaxes, callback })
        })

        expect(callback).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the dialog resolves with close', () => {
    describe('WHEN the dialog is cancelled before submit', () => {
      it('THEN should not invoke the callback', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockResolvedValue({ reason: 'close' })

        const { result } = renderHook(() => useEditInvoiceItemTaxDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditInvoiceItemTaxDialog({ taxes: validTaxes, callback })
        })

        expect(callback).not.toHaveBeenCalled()
      })
    })
  })
})
