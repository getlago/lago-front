import { MockedResponse } from '@apollo/client/testing'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import {
  ApiKeysPermissionsEnum,
  CreateApiKeyDocument,
  FeatureFlagEnum,
  GetApiKeyToEditDocument,
  PremiumIntegrationTypeEnum,
  UpdateApiKeyDocument,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import ApiKeysForm, {
  API_KEYS_FORM_CANCEL_BUTTON_TEST_ID,
  API_KEYS_FORM_CLOSE_BUTTON_TEST_ID,
  API_KEYS_FORM_HEADER_TITLE_TEST_ID,
  API_KEYS_FORM_LAST_USED_ALERT_TEST_ID,
  API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID,
  API_KEYS_FORM_PREMIUM_BANNER_TEST_ID,
  API_KEYS_FORM_PREMIUM_BUTTON_TEST_ID,
  getApiKeysFormPermissionRowTestId,
} from '../ApiKeysForm'

// Mock dependencies
jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockGoBack = jest.fn()

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: mockGoBack,
  }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({
    panelOpen: false,
    closePanel: jest.fn(),
    openPanel: jest.fn(),
  }),
}))

const mockUseOrganizationInfos = jest.fn()
const mockHasFeatureFlag = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

const mockApiKeyData = {
  apiKey: {
    id: 'api-key-123',
    name: 'Test API Key',
    lastUsedAt: '2024-01-15T10:30:00Z',
    permissions: {
      [ApiKeysPermissionsEnum.AddOn]: ['read', 'write'],
      [ApiKeysPermissionsEnum.BillableMetric]: ['read'],
      [ApiKeysPermissionsEnum.Customer]: ['read', 'write'],
    },
  },
}

const getApiKeyMock: MockedResponse = {
  request: {
    query: GetApiKeyToEditDocument,
    variables: { apiKeyId: 'api-key-123' },
  },
  result: {
    data: mockApiKeyData,
  },
}

const createApiKeyMock: MockedResponse = {
  request: {
    query: CreateApiKeyDocument,
    variables: {
      input: {
        name: 'New API Key',
        permissions: undefined,
      },
    },
  },
  result: {
    data: {
      createApiKey: {
        id: 'new-api-key-456',
      },
    },
  },
}

const updateApiKeyMock: MockedResponse = {
  request: {
    query: UpdateApiKeyDocument,
    variables: {
      input: {
        id: 'api-key-123',
        name: 'Updated API Key',
        permissions: undefined,
      },
    },
  },
  result: {
    data: {
      updateApiKey: {
        id: 'api-key-123',
      },
    },
  },
}

describe('ApiKeysForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasFeatureFlag.mockReturnValue(false)
    mockUseOrganizationInfos.mockReturnValue({
      organization: {
        premiumIntegrations: [],
      },
      hasFeatureFlag: mockHasFeatureFlag,
    })
    // Reset useParams mock for each test
    const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

    useParamsMock.mockReturnValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the form is in create mode', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the header title for creation', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_HEADER_TITLE_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should display the close button', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should display the cancel button', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should display an empty name input field', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          const nameInput = screen.getByRole('textbox')

          expect(nameInput).toBeInTheDocument()
          expect(nameInput).toHaveValue('')
        })
      })

      it('THEN should not display the last used alert', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(
            screen.queryByTestId(API_KEYS_FORM_LAST_USED_ALERT_TEST_ID),
          ).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN user does not have premium access', () => {
      it('THEN should display the premium banner', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PREMIUM_BANNER_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should display the premium upgrade button', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PREMIUM_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should not display the permissions table', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(
            screen.queryByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID),
          ).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN user has premium access', () => {
      beforeEach(() => {
        mockUseOrganizationInfos.mockReturnValue({
          organization: {
            premiumIntegrations: [PremiumIntegrationTypeEnum.ApiPermissions],
          },
          hasFeatureFlag: mockHasFeatureFlag,
        })
      })

      it('THEN should display the permissions table', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should not display the premium banner', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.queryByTestId(API_KEYS_FORM_PREMIUM_BANNER_TEST_ID)).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN user fills the form and submits', () => {
      it('THEN should call createApiKey mutation with form values', async () => {
        const user = userEvent.setup()

        render(<ApiKeysForm />, { mocks: [createApiKeyMock] })

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toBeInTheDocument()
        })

        const nameInput = screen.getByRole('textbox')

        await user.type(nameInput, 'New API Key')

        const submitButton = screen.getByRole('button', { name: /add api key/i })

        await user.click(submitButton)

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
      })
    })

    describe('WHEN user clicks the cancel button', () => {
      it('THEN should call goBack to navigate away', async () => {
        const user = userEvent.setup()

        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
        })

        const cancelButton = screen.getByTestId(API_KEYS_FORM_CANCEL_BUTTON_TEST_ID)

        await user.click(cancelButton)

        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    describe('WHEN user clicks the close button', () => {
      it('THEN should call goBack to navigate away', async () => {
        const user = userEvent.setup()

        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_CLOSE_BUTTON_TEST_ID)).toBeInTheDocument()
        })

        const closeButton = screen.getByTestId(API_KEYS_FORM_CLOSE_BUTTON_TEST_ID)

        await user.click(closeButton)

        expect(mockGoBack).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the form is in edit mode', () => {
    beforeEach(() => {
      const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

      useParamsMock.mockReturnValue({
        apiKeyId: 'api-key-123',
      })
    })

    describe('WHEN the component renders', () => {
      it('THEN should display the header title for editing', async () => {
        render(<ApiKeysForm />, { mocks: [getApiKeyMock] })

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_HEADER_TITLE_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should display the last used alert when API key has been used', async () => {
        render(<ApiKeysForm />, { mocks: [getApiKeyMock] })

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_LAST_USED_ALERT_TEST_ID)).toBeInTheDocument()
        })
      })

      it('THEN should populate the name input with existing value', async () => {
        render(<ApiKeysForm />, { mocks: [getApiKeyMock] })

        await waitFor(() => {
          const nameInput = screen.getByRole('textbox')

          expect(nameInput).toHaveValue('Test API Key')
        })
      })
    })

    describe('WHEN user updates the form and submits', () => {
      it('THEN should call updateApiKey mutation with form values', async () => {
        const user = userEvent.setup()

        render(<ApiKeysForm />, { mocks: [getApiKeyMock, updateApiKeyMock] })

        await waitFor(() => {
          expect(screen.getByRole('textbox')).toHaveValue('Test API Key')
        })

        const nameInput = screen.getByRole('textbox')

        await user.clear(nameInput)
        await user.type(nameInput, 'Updated API Key')

        const submitButton = screen.getByRole('button', { name: /save/i })

        await user.click(submitButton)

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
      })
    })
  })

  describe('GIVEN the form has premium permissions enabled', () => {
    beforeEach(() => {
      mockUseOrganizationInfos.mockReturnValue({
        organization: {
          premiumIntegrations: [PremiumIntegrationTypeEnum.ApiPermissions],
        },
        hasFeatureFlag: mockHasFeatureFlag,
      })
    })

    describe('WHEN user interacts with the permissions table', () => {
      it('THEN should display checkboxes for read and write permissions', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        // The table should contain checkbox inputs
        await waitFor(() => {
          const checkboxInputs = document.querySelectorAll('input[type="checkbox"]')

          expect(checkboxInputs.length).toBeGreaterThan(0)
        })
      })
    })

    describe('WHEN user clicks the select-all read header checkbox', () => {
      it('THEN should toggle all read permissions on then off', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        const table = screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)
        const headerCheckboxes = table.querySelectorAll('thead input[type="checkbox"]')
        const readHeaderCheckbox = headerCheckboxes[0] as HTMLInputElement

        expect(readHeaderCheckbox).toBeDefined()

        // Default state: all permissions have canRead=true, so header checkbox is checked
        // First click: sets all to false (since all are currently true)
        await user.click(readHeaderCheckbox)

        await waitFor(() => {
          const rows = table.querySelectorAll('tbody tr')

          rows.forEach((row) => {
            const rowReadCheckbox = row.querySelectorAll(
              'input[type="checkbox"]',
            )[0] as HTMLInputElement

            expect(rowReadCheckbox.checked).toBe(false)
          })
        })

        // Second click: now all are false, so sets all to true
        await user.click(readHeaderCheckbox)

        await waitFor(() => {
          const rows = table.querySelectorAll('tbody tr')

          rows.forEach((row) => {
            const rowReadCheckbox = row.querySelectorAll(
              'input[type="checkbox"]',
            )[0] as HTMLInputElement

            expect(rowReadCheckbox.checked).toBe(true)
          })
        })
      })
    })

    describe('WHEN user toggles an individual permission row checkbox', () => {
      it('THEN should toggle only that specific permission', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        const table = screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)
        const rows = table.querySelectorAll('tbody tr')

        const firstRow = rows[0] as HTMLTableRowElement
        const firstRowReadCheckbox = firstRow.querySelectorAll(
          'input[type="checkbox"]',
        )[0] as HTMLInputElement
        const secondRow = rows[1] as HTMLTableRowElement
        const secondRowReadCheckbox = secondRow.querySelectorAll(
          'input[type="checkbox"]',
        )[0] as HTMLInputElement

        const initialValue = firstRowReadCheckbox.checked
        const secondRowInitialValue = secondRowReadCheckbox.checked

        // Click to toggle first row only
        await user.click(firstRowReadCheckbox)

        await waitFor(() => {
          expect(firstRowReadCheckbox.checked).toBe(!initialValue)
        })

        // Second row should remain unchanged
        expect(secondRowReadCheckbox.checked).toBe(secondRowInitialValue)
      })
    })

    describe('WHEN the organization has no product catalog feature flag', () => {
      beforeEach(() => {
        mockHasFeatureFlag.mockReturnValue(false)
      })

      it('THEN should display only the resources available without the product catalog', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        ;[
          ApiKeysPermissionsEnum.ApiLog,
          ApiKeysPermissionsEnum.Coupon,
          ApiKeysPermissionsEnum.PaymentReceipt,
          ApiKeysPermissionsEnum.Plan,
        ].forEach((permission) => {
          expect(
            screen.getByTestId(getApiKeysFormPermissionRowTestId(permission)),
          ).toBeInTheDocument()
        })
        ;[
          ApiKeysPermissionsEnum.Contract,
          ApiKeysPermissionsEnum.Product,
          ApiKeysPermissionsEnum.RateCard,
        ].forEach((permission) => {
          expect(
            screen.queryByTestId(getApiKeysFormPermissionRowTestId(permission)),
          ).not.toBeInTheDocument()
        })
      })

      it('THEN should submit only the displayed resources', async () => {
        const user = userEvent.setup()
        let submittedPermissions: Record<string, string[]> = {}

        const createApiKeyWithPermissionsMock: MockedResponse = {
          request: { query: CreateApiKeyDocument },
          variableMatcher: (variables) => {
            submittedPermissions = variables.input.permissions

            return true
          },
          result: { data: { createApiKey: { id: 'new-api-key-456' } } },
        }

        render(<ApiKeysForm />, { mocks: [createApiKeyWithPermissionsMock] })

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        await user.type(screen.getByRole('textbox'), 'New API Key')
        await user.click(screen.getByRole('button', { name: /add api key/i }))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })

        expect(submittedPermissions[ApiKeysPermissionsEnum.Plan]).toEqual(['read', 'write'])
        expect(submittedPermissions[ApiKeysPermissionsEnum.ApiLog]).toEqual(['read'])
        expect(submittedPermissions).not.toHaveProperty(ApiKeysPermissionsEnum.Product)
        expect(submittedPermissions).not.toHaveProperty(ApiKeysPermissionsEnum.Contract)
      })
    })

    describe('WHEN the organization has the product catalog feature flag', () => {
      beforeEach(() => {
        mockHasFeatureFlag.mockImplementation(
          (flag: FeatureFlagEnum) => flag === FeatureFlagEnum.ProductCatalog,
        )
      })

      it('THEN should display only the v2 resources', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        ;[
          ApiKeysPermissionsEnum.Contract,
          ApiKeysPermissionsEnum.ContractRateCard,
          ApiKeysPermissionsEnum.Customer,
          ApiKeysPermissionsEnum.Invoice,
          ApiKeysPermissionsEnum.Plan,
          ApiKeysPermissionsEnum.PlanRateCard,
          ApiKeysPermissionsEnum.Product,
          ApiKeysPermissionsEnum.ProductCategory,
          ApiKeysPermissionsEnum.RateCard,
        ].forEach((permission) => {
          expect(
            screen.getByTestId(getApiKeysFormPermissionRowTestId(permission)),
          ).toBeInTheDocument()
        })
        ;[
          ApiKeysPermissionsEnum.Coupon,
          ApiKeysPermissionsEnum.Feature,
          ApiKeysPermissionsEnum.InvoiceCustomSection,
          ApiKeysPermissionsEnum.PaymentReceipt,
          ApiKeysPermissionsEnum.Subscription,
          ApiKeysPermissionsEnum.Wallet,
        ].forEach((permission) => {
          expect(
            screen.queryByTestId(getApiKeysFormPermissionRowTestId(permission)),
          ).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN the organization is not loaded yet', () => {
      beforeEach(() => {
        // Guards the skipped organization query: `loading: false` with no organization used to
        // build the table from an unset product catalog flag.
        mockUseOrganizationInfos.mockReturnValue({
          organization: undefined,
          hasFeatureFlag: mockHasFeatureFlag,
          loading: false,
        })
      })

      it('THEN should not display the form and should disable the submit button', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /add api key/i })).toBeDisabled()
        })

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the organization infos are refetched', () => {
      beforeEach(() => {
        mockUseOrganizationInfos.mockReturnValue({
          organization: {
            premiumIntegrations: [PremiumIntegrationTypeEnum.ApiPermissions],
          },
          hasFeatureFlag: mockHasFeatureFlag,
          loading: true,
        })
      })

      it('THEN should keep the permissions table displayed', async () => {
        render(<ApiKeysForm />)

        await waitFor(() => {
          expect(screen.getByTestId(API_KEYS_FORM_PERMISSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: /add api key/i })).toBeEnabled()
      })
    })
  })
})
