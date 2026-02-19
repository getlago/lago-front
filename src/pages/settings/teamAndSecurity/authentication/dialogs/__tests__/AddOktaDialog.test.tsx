import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  FORM_DIALOG_OPENING_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialogOpeningDialog from '~/components/dialogs/FormDialogOpeningDialog'
import { CreateOktaIntegrationDocument } from '~/generated/graphql'
import {
  OKTA_INTEGRATION_SUBMIT_BTN,
  useAddOktaDialog,
} from '~/pages/settings/teamAndSecurity/authentication/dialogs/AddOktaDialog'
import { render, TestMocksType } from '~/test-utils'

const mockOnSubmit = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      authenticationMethods: [],
    },
  }),
}))

NiceModal.register(FORM_DIALOG_OPENING_DIALOG_NAME, FormDialogOpeningDialog)
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const TestComponent = () => {
  const { openAddOktaDialog } = useAddOktaDialog()

  useEffect(() => {
    openAddOktaDialog({
      callback: mockOnSubmit,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

async function prepare({ mocks = [] }: { mocks?: TestMocksType } = {}) {
  await act(() => render(<TestComponent />, { mocks }))
}

describe('AddOktaDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(cleanup)

  it('renders the dialog with all form fields', async () => {
    await prepare()

    expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    expect(screen.getByLabelText(/Your domain name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Host \(optional\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Okta client ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Okta client secret/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Okta organization name/i)).toBeInTheDocument()
  })

  it('should accept valid host without protocol', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateOktaIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              host: 'example.com',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              organizationName: 'org-name',
            },
          },
        },
        result: {
          data: {
            createOktaIntegration: {
              id: 'integration-id',
            },
          },
        },
      },
    ]

    await prepare({ mocks })

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Host \(optional\)/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Okta client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Okta client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Okta organization name/i), 'org-name')

    await waitFor(() => {
      const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('should reject host with http:// or https:// protocol', async () => {
    await prepare()

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Host \(optional\)/i), 'https://example.com')
    await userEvent.type(screen.getByLabelText(/Okta client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Okta client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Okta organization name/i), 'org-name')

    await waitFor(() => {
      const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

      expect(submitButton).toBeDisabled()
    })
  })

  it('should allow empty host field (optional)', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateOktaIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              host: '',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              organizationName: 'org-name',
            },
          },
        },
        result: {
          data: {
            createOktaIntegration: {
              id: 'integration-id',
            },
          },
        },
      },
    ]

    await prepare({ mocks })

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Okta client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Okta client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Okta organization name/i), 'org-name')

    await waitFor(() => {
      const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('should disable submit button when required fields are missing', async () => {
    await prepare()

    // Submit button should be disabled when form is empty
    const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

    expect(submitButton).toBeDisabled()

    // Fill only some fields - button should still be disabled
    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Okta client ID/i), 'client-id')

    await waitFor(() => {
      expect(screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
    })
  })
})
