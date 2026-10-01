import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode, useEffect } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  FORM_DIALOG_OPENING_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialogOpeningDialog from '~/components/dialogs/FormDialogOpeningDialog'
import { initializeTranslations } from '~/core/apolloClient'
import {
  AddOktaIntegrationDialogFragment,
  CreateOktaIntegrationDocument,
  UpdateOktaIntegrationDocument,
} from '~/generated/graphql'
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

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

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
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent />
      </NiceModalWrapper>,
      { mocks },
    ),
  )

  await waitFor(() => {
    expect(screen.getByLabelText(/Your domain name/i)).toBeInTheDocument()
  })
}

describe('AddOktaDialog', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

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

    // Validation only runs on submit before the first submission attempt (revalidateLogic default)
    const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
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

    const submitButton = screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)

    // Validation only runs on submit before the first submission attempt (revalidateLogic default)
    await userEvent.click(submitButton)

    // After submit attempt with empty domain (required), button should be disabled
    await waitFor(() => {
      expect(screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
    })
  })

  describe('edition mode', () => {
    const existingIntegration: AddOktaIntegrationDialogFragment = {
      id: 'integration-id',
      name: 'Okta Integration',
      domain: 'example.com',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      organizationName: 'org-name',
      host: 'okta.example.com',
    }

    const TestEditComponent = () => {
      const { openAddOktaDialog } = useAddOktaDialog()

      useEffect(() => {
        openAddOktaDialog({
          integration: existingIntegration,
          callback: mockOnSubmit,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      return null
    }

    async function prepareEdit({ mocks = [] }: { mocks?: TestMocksType } = {}) {
      await act(() =>
        render(
          <NiceModalWrapper>
            <TestEditComponent />
          </NiceModalWrapper>,
          { mocks },
        ),
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/Your domain name/i)).toBeInTheDocument()
      })
    }

    it('prefills the form without the client secret', async () => {
      await prepareEdit()

      expect(screen.getByLabelText(/Your domain name/i)).toHaveValue('example.com')
      expect(screen.getByLabelText(/Host \(optional\)/i)).toHaveValue('okta.example.com')
      expect(screen.getByLabelText(/Okta client ID/i)).toHaveValue('client-id')
      expect(screen.getByLabelText(/Okta client secret/i)).toHaveValue('')
      expect(screen.getByText('Leave empty to keep the current client secret')).toBeInTheDocument()
      expect(screen.getByLabelText(/Okta organization name/i)).toHaveValue('org-name')
    })

    it('omits an empty client secret when updating the integration', async () => {
      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateOktaIntegrationDocument,
            variables: {
              input: {
                domain: 'edited.com',
                host: 'okta.example.com',
                clientId: 'client-id',
                organizationName: 'org-name',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateOktaIntegration: {
                id: 'integration-id',
              },
            },
          },
        },
      ]

      await prepareEdit({ mocks })

      const domainInput = screen.getByLabelText(/Your domain name/i)

      await userEvent.clear(domainInput)
      await userEvent.type(domainInput, 'edited.com')
      await userEvent.click(screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
      })
    })

    it('sends a new client secret when updating the integration', async () => {
      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateOktaIntegrationDocument,
            variables: {
              input: {
                domain: 'example.com',
                host: 'okta.example.com',
                clientId: 'client-id',
                clientSecret: 'new-client-secret',
                organizationName: 'org-name',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateOktaIntegration: {
                id: 'integration-id',
              },
            },
          },
        },
      ]

      await prepareEdit({ mocks })

      await userEvent.type(screen.getByLabelText(/Okta client secret/i), 'new-client-secret')
      await userEvent.click(screen.getByTestId(OKTA_INTEGRATION_SUBMIT_BTN))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
      })
    })
  })
})
