import { act, renderHook } from '@testing-library/react'

import { DataExportFormatTypeEnum, InvoiceExportTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useExportDialog } from '../ExportDialog'

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

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ currentUser: { email: 'user@lago.com' } }),
}))

const RESOURCE_TYPE_OPTIONS = [
  { label: 'Invoices', sublabel: 'All invoices', value: InvoiceExportTypeEnum.Invoices },
  {
    label: 'Invoice fees',
    sublabel: 'All invoice fees',
    value: InvoiceExportTypeEnum.InvoiceFees,
  },
]

const openArgs = (onExport = jest.fn()) => ({
  totalCountLabel: '12 invoices',
  onExport,
  resourceTypeOptions: RESOURCE_TYPE_OPTIONS,
})

describe('useExportDialog', () => {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children })

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN openExportDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should open the form dialog once', () => {
        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        act(() => {
          result.current.openExportDialog(openArgs())
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['submit', 'function'],
        ['didSubmitSucceed', 'function'],
      ])('THEN should pass a %s function through the shared form props', (prop, expectedType) => {
        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        act(() => {
          result.current.openExportDialog(openArgs())
        })

        expect(typeof mockFormDialogOpen.mock.calls[0][0].form[prop]).toBe(expectedType)
      })

      it('THEN should not report a successful submit before the form is submitted', () => {
        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        act(() => {
          result.current.openExportDialog(openArgs())
        })

        expect(mockFormDialogOpen.mock.calls[0][0].form.didSubmitSucceed()).toBe(false)
      })
    })
  })

  describe('GIVEN the form is submitted', () => {
    describe('WHEN the selection is valid', () => {
      it('THEN should invoke onExport with the selected format and resource type', async () => {
        const onExport = jest.fn()

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()

          return { reason: 'success' }
        })

        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        await act(async () => {
          result.current.openExportDialog(openArgs(onExport))
        })

        expect(onExport).toHaveBeenCalledWith({
          format: DataExportFormatTypeEnum.Csv,
          resourceType: InvoiceExportTypeEnum.Invoices,
        })
      })

      it('THEN should report the submit as successful so the dialog can close', async () => {
        let didSubmitSucceed: boolean | undefined

        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          didSubmitSucceed = config.form.didSubmitSucceed?.()

          return { reason: 'success' }
        })

        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        await act(async () => {
          result.current.openExportDialog(openArgs())
        })

        expect(didSubmitSucceed).toBe(true)
      })
    })

    describe('WHEN onExport fails', () => {
      it('THEN should not report the submit as successful', async () => {
        const onExport = jest.fn().mockRejectedValue(new Error('Export failed'))
        let didSubmitSucceed: boolean | undefined

        mockFormDialogOpen.mockImplementation(async (config) => {
          try {
            await config.form.submit()
          } catch {
            // FormDialog catches it and, with closeOnError false, keeps the dialog open.
          }

          didSubmitSucceed = config.form.didSubmitSucceed?.()

          return { reason: 'close' }
        })

        const { result } = renderHook(() => useExportDialog(), { wrapper: customWrapper })

        await act(async () => {
          result.current.openExportDialog(openArgs(onExport))
        })

        expect(onExport).toHaveBeenCalled()
        expect(didSubmitSucceed).toBe(false)
      })
    })
  })
})
