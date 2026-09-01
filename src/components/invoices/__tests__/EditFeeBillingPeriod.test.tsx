import { act, renderHook } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import {
  EDIT_FEE_BILLING_PERIOD_FORM_ID,
  useEditFeeBillingPeriodDialog,
} from '../EditFeeBillingPeriod'

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

const FROM_DATETIME = '2024-01-01T00:00:00.000Z'
const TO_DATETIME = '2024-01-31T23:59:59.999Z'

describe('useEditFeeBillingPeriodDialog', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children })

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN rendered', () => {
      it('THEN should return openEditFeeBillingPeriodDialog function', () => {
        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        expect(typeof result.current.openEditFeeBillingPeriodDialog).toBe('function')
      })
    })
  })

  describe('GIVEN openEditFeeBillingPeriodDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open once', () => {
        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback: jest.fn(),
          })
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['closeOnError', false],
        ['cancelOrCloseText', 'cancel'],
      ])('THEN should pass %s', (prop, expected) => {
        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback: jest.fn(),
          })
        })

        expect(mockFormDialogOpen.mock.calls[0][0][prop]).toBe(expected)
      })

      it.each([
        ['title', 'string'],
        ['description', 'string'],
        ['children', 'object'],
        ['mainAction', 'object'],
      ])('THEN should include %s', (prop, expectedType) => {
        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback: jest.fn(),
          })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs[prop]).toBeDefined()
        expect(typeof callArgs[prop]).toBe(expectedType)
      })

      it('THEN should include form with the expected id and a submit function', () => {
        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback: jest.fn(),
          })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.form.id).toBe(EDIT_FEE_BILLING_PERIOD_FORM_ID)
        expect(typeof callArgs.form.submit).toBe('function')
      })
    })
  })

  describe('GIVEN the form is submitted', () => {
    describe('WHEN the billing period is valid', () => {
      it('THEN should invoke the callback with the from and to datetimes', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback,
          })
        })

        expect(callback).toHaveBeenCalledWith(FROM_DATETIME, TO_DATETIME)
      })

      it('THEN should report the submit as successful so the dialog can close', async () => {
        let didSubmitSucceed: boolean | undefined

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          didSubmitSucceed = config.form.didSubmitSucceed?.()

          return { reason: 'success' }
        })

        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback: jest.fn(),
          })
        })

        expect(didSubmitSucceed).toBe(true)
      })
    })

    // Regression (ING-634): only toDatetime was checked, so a typed pre-1970 from datetime
    // reached the callback once the picker stopped withholding it.
    describe('WHEN the from datetime is before the minimum supported date', () => {
      it('THEN should not invoke the callback and should report the submit as unsuccessful', async () => {
        const callback = jest.fn()
        let didSubmitSucceed: boolean | undefined

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          didSubmitSucceed = config.form.didSubmitSucceed?.()

          return { reason: 'close' }
        })

        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: '0026-08-31T00:00:00.000Z',
            toDatetime: TO_DATETIME,
            callback,
          })
        })

        expect(callback).not.toHaveBeenCalled()
        expect(didSubmitSucceed).toBe(false)
      })
    })

    describe('WHEN the to datetime is before the from datetime', () => {
      it('THEN should not invoke the callback and should report the submit as unsuccessful', async () => {
        const callback = jest.fn()
        let didSubmitSucceed: boolean | undefined

        // Mirror FormDialog's handleContinue: it awaits form.submit(), then asks
        // didSubmitSucceed whether the dialog may close.
        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          didSubmitSucceed = config.form.didSubmitSucceed?.()

          return { reason: 'close' }
        })

        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: TO_DATETIME,
            toDatetime: FROM_DATETIME,
            callback,
          })
        })

        expect(callback).not.toHaveBeenCalled()
        expect(didSubmitSucceed).toBe(false)
      })
    })
  })

  describe('GIVEN the dialog resolves with close', () => {
    describe('WHEN the dialog is cancelled before submit', () => {
      it('THEN should not invoke the callback', async () => {
        const callback = jest.fn()

        mockFormDialogOpen.mockResolvedValue({ reason: 'close' })

        const { result } = renderHook(() => useEditFeeBillingPeriodDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditFeeBillingPeriodDialog({
            fromDatetime: FROM_DATETIME,
            toDatetime: TO_DATETIME,
            callback,
          })
        })

        expect(callback).not.toHaveBeenCalled()
      })
    })
  })
})
