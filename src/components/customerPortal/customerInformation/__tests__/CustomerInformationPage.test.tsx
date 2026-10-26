import { act, screen } from '@testing-library/react'
import { ZodType } from 'zod'

import { CountryCode, CustomerTypeEnum, LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import CustomerInformationPage, { ERROR_ALERT_TEST_ID } from '../CustomerInformationPage'

const mockUseCustomerPortalData = jest.fn()
const mockUseCustomerPortalNavigation = jest.fn()
const mockUseCustomerPortalTranslate = jest.fn()
const mockUpdatePortalCustomer = jest.fn()
const mockUseUpdatePortalCustomerMutation = jest.fn()
let mockMutationError: Error | undefined

jest.mock('~/components/customerPortal/common/hooks/useCustomerPortalData', () => ({
  useCustomerPortalData: () => mockUseCustomerPortalData(),
}))

jest.mock('~/components/customerPortal/common/hooks/useCustomerPortalNavigation', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalNavigation(),
}))

jest.mock('~/components/customerPortal/common/useCustomerPortalTranslate', () => ({
  __esModule: true,
  default: () => mockUseCustomerPortalTranslate(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdatePortalCustomerMutation: (options: unknown) => {
    mockUseUpdatePortalCustomerMutation(options)

    return [mockUpdatePortalCustomer, { loading: false, error: mockMutationError }]
  },
}))

jest.mock('~/components/customerPortal/common/PageTitle', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-test="page-title">{title}</div>,
}))

jest.mock('~/components/customerPortal/common/SectionError', () => ({
  __esModule: true,
  default: () => <div data-test="section-error">Error</div>,
}))

jest.mock('~/components/customerPortal/common/SectionLoading', () => ({
  LoaderCustomerInformationPage: () => <div data-test="loading-skeleton">Loading</div>,
}))

const mockHandleSubmit = jest.fn()
let capturedOnSubmit: (args: {
  value: Record<string, unknown>
  formApi: { setErrorMap: jest.Mock }
}) => Promise<void>
let capturedValidationSchema: ZodType

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: ({
    defaultValues,
    onSubmit,
    validators,
  }: {
    defaultValues: Record<string, unknown>
    onSubmit: typeof capturedOnSubmit
    validators: { onDynamic: ZodType }
  }) => {
    capturedOnSubmit = onSubmit
    capturedValidationSchema = validators.onDynamic

    return {
      store: {
        subscribe: jest.fn(() => jest.fn()),
        state: { values: defaultValues },
        getState: () => ({
          values: defaultValues,
          canSubmit: true,
        }),
      },
      handleSubmit: mockHandleSubmit,
      setFieldValue: jest.fn(),
      AppField: ({
        name,
        children,
      }: {
        name: string
        children: (field: unknown) => React.ReactNode
      }) => {
        const fieldProps = {
          TextInputField: ({
            label,
            placeholder,
            disabled,
          }: {
            label?: string
            placeholder?: string
            disabled?: boolean
          }) => (
            <div data-test={`field-${name}`}>
              {label && <label>{label}</label>}
              <input placeholder={placeholder} disabled={disabled} data-test={`input-${name}`} />
            </div>
          ),
          ComboBoxField: ({
            label,
            placeholder,
            disabled,
          }: {
            label?: string
            placeholder?: string
            disabled?: boolean
          }) => (
            <div data-test={`field-${name}`}>
              {label && <label>{label}</label>}
              <select disabled={disabled} data-test={`input-${name}`}>
                <option>{placeholder}</option>
              </select>
            </div>
          ),
        }

        return <>{children(fieldProps)}</>
      },
      AppForm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      SubmitButton: ({
        children,
        ...props
      }: {
        children: React.ReactNode
        'data-test'?: string
      }) => (
        <button type="submit" data-test={props['data-test']}>
          {children}
        </button>
      ),
    }
  },
}))

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: jest.fn(() => ({})),
  useStore: jest.fn(),
}))

const mockGoHome = jest.fn()

const setupDefaultMocks = () => {
  mockMutationError = undefined

  mockUseCustomerPortalTranslate.mockReturnValue({
    translate: (key: string) => key,
    documentLocale: 'en',
  })

  mockUseCustomerPortalNavigation.mockReturnValue({
    goHome: mockGoHome,
  })

  mockUseCustomerPortalData.mockReturnValue({
    data: {
      customerPortalUser: {
        customerType: CustomerTypeEnum.Company,
        name: 'Acme Inc',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@acme.com',
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Springfield',
        state: 'IL',
        zipcode: '12345',
        country: CountryCode.Us,
        shippingAddress: {
          addressLine1: '456 Ship St',
          addressLine2: null,
          city: 'Shelbyville',
          state: 'IL',
          zipcode: '67890',
          country: CountryCode.Us,
        },
      },
    },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  })
}

describe('CustomerInformationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultMocks()
  })

  describe('GIVEN the page is loading', () => {
    it('THEN should render the loading skeleton', () => {
      mockUseCustomerPortalData.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<CustomerInformationPage />)

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('section-error')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN there is an error', () => {
    it('THEN should render the error state', () => {
      mockUseCustomerPortalData.mockReturnValue({
        data: undefined,
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(<CustomerInformationPage />)

      expect(screen.getByTestId('section-error')).toBeInTheDocument()
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN customer data is loaded', () => {
    it('THEN should render the page title', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('page-title')).toBeInTheDocument()
    })

    it('THEN should render all customer information fields', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('field-customerType')).toBeInTheDocument()
      expect(screen.getByTestId('field-name')).toBeInTheDocument()
      expect(screen.getByTestId('field-firstname')).toBeInTheDocument()
      expect(screen.getByTestId('field-lastname')).toBeInTheDocument()
      expect(screen.getByTestId('field-legalName')).toBeInTheDocument()
      expect(screen.getByTestId('field-taxIdentificationNumber')).toBeInTheDocument()
      expect(screen.getByTestId('field-email')).toBeInTheDocument()
    })

    it('THEN should render billing address fields', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('field-addressLine1')).toBeInTheDocument()
      expect(screen.getByTestId('field-addressLine2')).toBeInTheDocument()
      expect(screen.getByTestId('field-zipcode')).toBeInTheDocument()
      expect(screen.getByTestId('field-city')).toBeInTheDocument()
      expect(screen.getByTestId('field-state')).toBeInTheDocument()
      expect(screen.getByTestId('field-country')).toBeInTheDocument()
    })

    it('THEN should render shipping address fields', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('field-shippingAddress.addressLine1')).toBeInTheDocument()
      expect(screen.getByTestId('field-shippingAddress.addressLine2')).toBeInTheDocument()
      expect(screen.getByTestId('field-shippingAddress.zipcode')).toBeInTheDocument()
      expect(screen.getByTestId('field-shippingAddress.city')).toBeInTheDocument()
      expect(screen.getByTestId('field-shippingAddress.state')).toBeInTheDocument()
      expect(screen.getByTestId('field-shippingAddress.country')).toBeInTheDocument()
    })

    it('THEN should render the submit button', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('submit')).toBeInTheDocument()
    })
  })

  describe('GIVEN customer has no data (null)', () => {
    it('THEN should not render the form', () => {
      mockUseCustomerPortalData.mockReturnValue({
        data: { customerPortalUser: null },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<CustomerInformationPage />)

      expect(screen.queryByTestId('field-name')).not.toBeInTheDocument()
      expect(screen.queryByTestId('submit')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN billing and shipping addresses are identical', () => {
    it('THEN shipping fields should be disabled', () => {
      const address = {
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Springfield',
        state: 'IL',
        zipcode: '12345',
        country: CountryCode.Us,
      }

      mockUseCustomerPortalData.mockReturnValue({
        data: {
          customerPortalUser: {
            name: 'Test',
            ...address,
            shippingAddress: address,
          },
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<CustomerInformationPage />)

      expect(screen.getByTestId('input-shippingAddress.addressLine1')).toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.city')).toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.state')).toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.zipcode')).toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.country')).toBeDisabled()
    })
  })

  describe('GIVEN billing and shipping addresses are different', () => {
    it('THEN shipping fields should not be disabled', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('input-shippingAddress.addressLine1')).not.toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.city')).not.toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.state')).not.toBeDisabled()
    })
  })

  describe('GIVEN the free text inputs', () => {
    const longName = 'a'.repeat(256)

    it('THEN rejects a changed value over its limit', () => {
      render(<CustomerInformationPage />)

      const result = capturedValidationSchema.safeParse({ name: longName, shippingAddress: {} })

      expect(result.success).toBe(false)
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['name'], message: 'text_1792577695510xy36tafb8l5' }),
      ])
    })

    it('THEN accepts a stored value over its limit when it is unchanged', () => {
      mockUseCustomerPortalData.mockReturnValue({
        data: { customerPortalUser: { name: longName, shippingAddress: null } },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      })

      render(<CustomerInformationPage />)

      expect(
        capturedValidationSchema.safeParse({ name: longName, shippingAddress: {} }).success,
      ).toBe(true)
    })
  })

  describe('GIVEN the update mutation', () => {
    it('THEN silences the field error codes from the global error handler', () => {
      render(<CustomerInformationPage />)

      expect(mockUseUpdatePortalCustomerMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            silentErrorDetails: [LagoApiError.InvalidCharacters, LagoApiError.ValueIsTooLong],
          },
        }),
      )
    })
  })

  describe('WHEN the update answers with field errors', () => {
    it('THEN shows each error under its field', async () => {
      const setErrorMap = jest.fn()

      mockUpdatePortalCustomer.mockResolvedValue({
        errors: [
          {
            message: 'Unprocessable Entity',
            extensions: {
              code: LagoApiError.UnprocessableEntity,
              details: {
                legalName: [LagoApiError.InvalidCharacters],
                shippingAddressLine2: [LagoApiError.ValueIsTooLong],
              },
            },
          },
        ],
      })

      render(<CustomerInformationPage />)

      await capturedOnSubmit({ value: { shippingAddress: {} }, formApi: { setErrorMap } })

      expect(setErrorMap).toHaveBeenCalledWith({
        onDynamic: {
          fields: {
            legalName: { message: 'text_1792577695510fp8vzeszoh7', path: ['legalName'] },
            'shippingAddress.addressLine2': {
              message: 'text_1792577695510xy36tafb8l5',
              path: ['shippingAddress', 'addressLine2'],
            },
          },
        },
      })
    })
  })

  describe('WHEN the update answers without field errors', () => {
    it('THEN sets no field error and sends empty shipping values as null', async () => {
      const setErrorMap = jest.fn()

      mockUpdatePortalCustomer.mockResolvedValue({ data: { updateCustomerPortalCustomer: {} } })

      render(<CustomerInformationPage />)

      await capturedOnSubmit({
        value: { name: 'Acme', shippingAddress: { city: '', state: 'IL' } },
        formApi: { setErrorMap },
      })

      expect(mockUpdatePortalCustomer).toHaveBeenCalledWith({
        variables: { input: { name: 'Acme', shippingAddress: { city: null, state: 'IL' } } },
      })
      expect(setErrorMap).not.toHaveBeenCalled()
    })
  })

  describe('WHEN the update completes', () => {
    const getOnCompleted = (): ((res: unknown) => void) =>
      mockUseUpdatePortalCustomerMutation.mock.calls[0][0].onCompleted

    it('THEN goes back home when the customer was updated', () => {
      render(<CustomerInformationPage />)

      getOnCompleted()({ updateCustomerPortalCustomer: { id: '1' } })

      expect(mockGoHome).toHaveBeenCalled()
    })

    it('THEN stays on the form when the answer holds no customer', () => {
      render(<CustomerInformationPage />)

      getOnCompleted()({ updateCustomerPortalCustomer: null })

      expect(mockGoHome).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the update failed', () => {
    beforeEach(() => {
      mockMutationError = new Error('Unprocessable Entity')
    })

    it('THEN shows the generic error when no field error was mapped', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId(ERROR_ALERT_TEST_ID)).toBeInTheDocument()
    })

    it('THEN hides the generic error when field errors were mapped', async () => {
      mockUpdatePortalCustomer.mockResolvedValue({
        errors: [
          {
            message: 'Unprocessable Entity',
            extensions: {
              code: LagoApiError.UnprocessableEntity,
              details: { city: [LagoApiError.ValueIsTooLong] },
            },
          },
        ],
      })

      render(<CustomerInformationPage />)

      await act(() =>
        capturedOnSubmit({ value: { shippingAddress: {} }, formApi: { setErrorMap: jest.fn() } }),
      )

      expect(screen.queryByTestId(ERROR_ALERT_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN keeps the generic error when other details were not mapped', async () => {
      const setErrorMap = jest.fn()

      mockUpdatePortalCustomer.mockResolvedValue({
        errors: [
          {
            message: 'Unprocessable Entity',
            extensions: {
              code: LagoApiError.UnprocessableEntity,
              details: {
                city: [LagoApiError.ValueIsTooLong],
                email: [LagoApiError.ValueIsInvalid],
              },
            },
          },
        ],
      })

      render(<CustomerInformationPage />)

      await act(() =>
        capturedOnSubmit({ value: { shippingAddress: {} }, formApi: { setErrorMap } }),
      )

      expect(setErrorMap).toHaveBeenCalledWith({
        onDynamic: {
          fields: { city: { message: 'text_1792577695510xy36tafb8l5', path: ['city'] } },
        },
      })
      expect(screen.getByTestId(ERROR_ALERT_TEST_ID)).toBeInTheDocument()
    })
  })
})
