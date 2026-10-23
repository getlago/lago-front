import { act, renderHook, screen, within } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { CustomerPortalEditableFieldEnum } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import {
  CUSTOMER_PORTAL_FIELD_CHECKBOX_TEST_ID,
  useEditCustomerPortalFieldsDialog,
} from '../useEditCustomerPortalFieldsDialog'

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

  describe('GIVEN the dialog content is rendered', () => {
    const renderDialogContent = (fields: CustomerPortalEditableFieldEnum[]) => {
      const { result } = renderHook(() => useEditCustomerPortalFieldsDialog(), {
        wrapper: customWrapper,
      })

      act(() => {
        result.current.openEditCustomerPortalFieldsDialog({ editableFields: fields })
      })

      render(mockFormDialogOpen.mock.calls[0][0].children)
    }

    const checkboxFor = (field: CustomerPortalEditableFieldEnum) =>
      within(screen.getByTestId(`${CUSTOMER_PORTAL_FIELD_CHECKBOX_TEST_ID}-${field}`)).getByRole(
        'checkbox',
      )

    it('THEN should check the editable fields and leave the others unchecked', () => {
      renderDialogContent(editableFields)

      expect(checkboxFor(CustomerPortalEditableFieldEnum.Name)).toBeChecked()
      expect(checkboxFor(CustomerPortalEditableFieldEnum.City)).toBeChecked()
      expect(checkboxFor(CustomerPortalEditableFieldEnum.Country)).not.toBeChecked()
      expect(checkboxFor(CustomerPortalEditableFieldEnum.TaxIdentificationNumber)).not.toBeChecked()
    })

    it('THEN should not offer the document locale, which the portal form cannot edit', () => {
      renderDialogContent(editableFields)

      expect(
        screen.queryByTestId(
          `${CUSTOMER_PORTAL_FIELD_CHECKBOX_TEST_ID}-${CustomerPortalEditableFieldEnum.DocumentLocale}`,
        ),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the document locale is already editable', () => {
    it('THEN should keep it in the saved list', async () => {
      const fields = [...editableFields, CustomerPortalEditableFieldEnum.DocumentLocale]

      mockUpdateEditableFields.mockResolvedValue({ data: {}, errors: undefined })
      mockFormDialogOpen.mockImplementation(async (config) => {
        await config.form.submit()
        return { reason: 'success' }
      })

      const { result } = renderHook(() => useEditCustomerPortalFieldsDialog(), {
        wrapper: customWrapper,
      })

      await act(async () => {
        result.current.openEditCustomerPortalFieldsDialog({ editableFields: fields })
      })

      expect(
        mockUpdateEditableFields.mock.calls[0][0].variables.input.customerPortalEditableFields,
      ).toEqual(expect.arrayContaining([CustomerPortalEditableFieldEnum.DocumentLocale]))
    })
  })
})
