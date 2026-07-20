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
  AddEntraIdIntegrationDialogFragment,
  CreateEntraIdIntegrationDocument,
  UpdateEntraIdIntegrationDocument,
} from '~/generated/graphql'
import {
  ENTRA_ID_INTEGRATION_SUBMIT_BTN,
  useAddEntraIdDialog,
} from '~/pages/settings/teamAndSecurity/authentication/dialogs/AddEntraIdDialog'
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
  const { openAddEntraIdDialog } = useAddEntraIdDialog()

  useEffect(() => {
    openAddEntraIdDialog({
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

describe('AddEntraIdDialog', () => {
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
    expect(screen.getByLabelText(/Entra ID client ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Entra ID client secret/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Entra ID tenant ID/i)).toBeInTheDocument()
  })

  it('should accept valid host without protocol', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateEntraIdIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              host: 'login.microsoftonline.com',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              tenantId: 'tenant-id',
            },
          },
        },
        result: {
          data: {
            createEntraIdIntegration: {
              id: 'integration-id',
            },
          },
        },
      },
    ]

    await prepare({ mocks })

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Host \(optional\)/i), 'login.microsoftonline.com')
    await userEvent.type(screen.getByLabelText(/Entra ID client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Entra ID tenant ID/i), 'tenant-id')

    await waitFor(() => {
      const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('should reject host with http:// or https:// protocol', async () => {
    await prepare()

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Host \(optional\)/i), 'https://example.com')
    await userEvent.type(screen.getByLabelText(/Entra ID client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Entra ID tenant ID/i), 'tenant-id')

    // Validation only runs on submit before the first submission attempt (revalidateLogic default)
    const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
    })
  })

  it('should allow empty host field (optional)', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateEntraIdIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              host: '',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              tenantId: 'tenant-id',
            },
          },
        },
        result: {
          data: {
            createEntraIdIntegration: {
              id: 'integration-id',
            },
          },
        },
      },
    ]

    await prepare({ mocks })

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(screen.getByLabelText(/Entra ID client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Entra ID tenant ID/i), 'tenant-id')

    await waitFor(() => {
      const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('should disable submit button when required fields are missing', async () => {
    await prepare()

    const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

    // Validation only runs on submit before the first submission attempt (revalidateLogic default)
    await userEvent.click(submitButton)

    // After submit attempt with empty domain (required), button should be disabled
    await waitFor(() => {
      expect(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
    })
  })

  describe('edition mode', () => {
    const existingIntegration: AddEntraIdIntegrationDialogFragment = {
      id: 'integration-id',
      name: 'Entra ID Integration',
      domain: 'example.com',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      tenantId: 'tenant-id',
      host: 'login.microsoftonline.com',
    }

    const TestEditComponent = () => {
      const { openAddEntraIdDialog } = useAddEntraIdDialog()

      useEffect(() => {
        openAddEntraIdDialog({
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

    it('prefills the form with the integration values', async () => {
      await prepareEdit()

      expect(screen.getByLabelText(/Your domain name/i)).toHaveValue('example.com')
      expect(screen.getByLabelText(/Host \(optional\)/i)).toHaveValue('login.microsoftonline.com')
      expect(screen.getByLabelText(/Entra ID client ID/i)).toHaveValue('client-id')
      expect(screen.getByLabelText(/Entra ID client secret/i)).toHaveValue('client-secret')
      expect(screen.getByLabelText(/Entra ID tenant ID/i)).toHaveValue('tenant-id')
    })

    it('updates the integration on submit', async () => {
      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateEntraIdIntegrationDocument,
            variables: {
              input: {
                domain: 'edited.com',
                host: 'login.microsoftonline.com',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tenantId: 'tenant-id',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateEntraIdIntegration: {
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

      const submitButton = screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
      })
    })
  })
})
