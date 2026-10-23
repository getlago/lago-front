import { screen } from '@testing-library/react'

import { CountryCode, CustomerPortalEditableFieldEnum, CustomerTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CustomerInformationPage from '../CustomerInformationPage'

const mockUseCustomerPortalData = jest.fn()
const mockUseCustomerPortalNavigation = jest.fn()
const mockUseCustomerPortalTranslate = jest.fn()
const mockUpdatePortalCustomer = jest.fn()

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
  useUpdatePortalCustomerMutation: () => [
    mockUpdatePortalCustomer,
    { loading: false, error: undefined },
  ],
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
let mockOnSubmit: (args: { value: Record<string, unknown> }) => Promise<void>

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: ({
    defaultValues,
    onSubmit,
  }: {
    defaultValues: Record<string, unknown>
    onSubmit: (args: { value: Record<string, unknown> }) => Promise<void>
  }) => {
    mockOnSubmit = onSubmit

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

const ALL_FIELDS = Object.values(CustomerPortalEditableFieldEnum)
const DEFAULT_EDITABLE_FIELDS = ALL_FIELDS.filter(
  (field) =>
    ![
      CustomerPortalEditableFieldEnum.Country,
      CustomerPortalEditableFieldEnum.Zipcode,
      CustomerPortalEditableFieldEnum.TaxIdentificationNumber,
    ].includes(field),
)

const setupDefaultMocks = () => {
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
      customerPortalOrganization: {
        customerPortalEditableFields: ALL_FIELDS,
      },
    },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  })
}

const mockEditableFields = (customerPortalEditableFields: CustomerPortalEditableFieldEnum[]) => {
  const { data, ...rest } = mockUseCustomerPortalData()

  mockUseCustomerPortalData.mockReturnValue({
    ...rest,
    data: { ...data, customerPortalOrganization: { customerPortalEditableFields } },
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

  describe('GIVEN every field is editable', () => {
    it('THEN should not render the read-only alert', () => {
      render(<CustomerInformationPage />)

      expect(screen.queryByTestId('read-only-fields-alert')).not.toBeInTheDocument()
      expect(screen.getByTestId('input-country')).not.toBeDisabled()
    })
  })

  describe('GIVEN the organization keeps the default editable fields', () => {
    beforeEach(() => {
      mockEditableFields(DEFAULT_EDITABLE_FIELDS)
    })

    it('THEN should disable the tax determining fields', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('input-country')).toBeDisabled()
      expect(screen.getByTestId('input-zipcode')).toBeDisabled()
      expect(screen.getByTestId('input-taxIdentificationNumber')).toBeDisabled()
    })

    it('THEN should keep the other fields editable', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('input-name')).not.toBeDisabled()
      expect(screen.getByTestId('input-city')).not.toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.addressLine1')).not.toBeDisabled()
    })

    it('THEN should render the read-only alert', () => {
      render(<CustomerInformationPage />)

      expect(screen.getByTestId('read-only-fields-alert')).toBeInTheDocument()
    })

    it('THEN should only send the editable fields on submit', async () => {
      render(<CustomerInformationPage />)

      await mockOnSubmit({
        value: {
          name: 'Acme Inc',
          city: 'Springfield',
          country: CountryCode.Lu,
          zipcode: '1111',
          taxIdentificationNumber: 'LU123',
          shippingAddress: { city: 'Shelbyville' },
        },
      })

      expect(mockUpdatePortalCustomer).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'Acme Inc',
            city: 'Springfield',
            shippingAddress: { city: 'Shelbyville' },
          },
        },
      })
    })
  })

  describe('GIVEN the shipping address is not editable', () => {
    it('THEN should disable the shipping fields', () => {
      mockEditableFields(
        DEFAULT_EDITABLE_FIELDS.filter(
          (field) => field !== CustomerPortalEditableFieldEnum.ShippingAddress,
        ),
      )

      render(<CustomerInformationPage />)

      expect(screen.getByTestId('input-shippingAddress.addressLine1')).toBeDisabled()
      expect(screen.getByTestId('input-shippingAddress.country')).toBeDisabled()
    })
  })
})
