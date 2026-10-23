import { act, renderHook } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { CustomerPortalEditableFieldEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useEditCustomerPortalFieldsDialog } from '../useEditCustomerPortalFieldsDialog'

const mockFormDialogOpen = jest.fn()
const mockUpdateEditableFields = jest.fn()

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

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateOrganizationCustomerPortalEditableFieldsMutation: () => [mockUpdateEditableFields],
}))

const customWrapper = ({ children }: { children: React.ReactNode }) => AllTheProviders({ children })

const editableFields = [CustomerPortalEditableFieldEnum.Name, CustomerPortalEditableFieldEnum.City]

describe('useEditCustomerPortalFieldsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormDialogOpen.mockResolvedValue({ reason: 'close' })
  })

  describe('GIVEN openEditCustomerPortalFieldsDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should open a form dialog with a submit function', () => {
        const { result } = renderHook(() => useEditCustomerPortalFieldsDialog(), {
          wrapper: customWrapper,
        })

        act(() => {
          result.current.openEditCustomerPortalFieldsDialog({ editableFields })
        })

        const callArgs = mockFormDialogOpen.mock.calls[0][0]

        expect(callArgs.closeOnError).toBe(false)
        expect(callArgs.form.id).toBe('form-edit-customer-portal-fields')
        expect(typeof callArgs.form.submit).toBe('function')
      })
    })

    describe('WHEN the form is submitted without changes', () => {
      it('THEN should save the current editable fields and show a toast', async () => {
        mockUpdateEditableFields.mockResolvedValue({ data: {}, errors: undefined })
        mockFormDialogOpen.mockImplementation(async (config) => {
          await config.form.submit()
          return { reason: 'success' }
        })

        const { result } = renderHook(() => useEditCustomerPortalFieldsDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditCustomerPortalFieldsDialog({ editableFields })
        })

        expect(mockUpdateEditableFields).toHaveBeenCalledWith({
          variables: {
            input: {
              customerPortalEditableFields: expect.arrayContaining(editableFields),
            },
          },
        })
        expect(
          mockUpdateEditableFields.mock.calls[0][0].variables.input.customerPortalEditableFields,
        ).toHaveLength(editableFields.length)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN the mutation fails', () => {
      it('THEN should reject the submit and not show a toast', async () => {
        mockUpdateEditableFields.mockResolvedValue({ data: null, errors: [new Error('nope')] })

        let submitError: unknown

        mockFormDialogOpen.mockImplementation(async (config) => {
          try {
            await config.form.submit()
          } catch (error) {
            submitError = error
          }
          return { reason: 'close' }
        })

        const { result } = renderHook(() => useEditCustomerPortalFieldsDialog(), {
          wrapper: customWrapper,
        })

        await act(async () => {
          result.current.openEditCustomerPortalFieldsDialog({ editableFields })
        })

        expect(submitError).toBeInstanceOf(Error)
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
