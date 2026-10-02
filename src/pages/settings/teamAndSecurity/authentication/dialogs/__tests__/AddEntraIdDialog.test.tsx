import { InMemoryCache } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { ThemeProvider } from '@mui/material/styles'
import { act, cleanup, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  FORM_DIALOG_OPENING_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialogOpeningDialog from '~/components/dialogs/FormDialogOpeningDialog'
import { MainHeaderProvider } from '~/components/MainHeader/MainHeaderContext'
import { initializeTranslations } from '~/core/apolloClient'
import {
  AddEntraIdIntegrationDialogFragment,
  AddEntraIdIntegrationDialogFragmentDoc,
  CreateEntraIdIntegrationDocument,
  UpdateEntraIdIntegrationDocument,
} from '~/generated/graphql'
import {
  ENTRA_ID_INTEGRATION_SUBMIT_BTN,
  useAddEntraIdDialog,
} from '~/pages/settings/teamAndSecurity/authentication/dialogs/AddEntraIdDialog'
import { theme } from '~/styles'
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

  it('masks the client secret input', async () => {
    await prepare()

    expect(screen.getByLabelText(/Entra ID client secret/i)).toHaveAttribute('type', 'password')
  })

  it('should accept valid host without protocol', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateEntraIdIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              additionalDomains: [],
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
              additionalDomains: [],
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

  it('sends the additional domains typed in the list', async () => {
    const mocks: TestMocksType = [
      {
        request: {
          query: CreateEntraIdIntegrationDocument,
          variables: {
            input: {
              domain: 'example.com',
              additionalDomains: ['de.example.com', 'us.example.com'],
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
    await userEvent.type(
      screen.getByPlaceholderText('Type a domain and press Enter'),
      'de.example.com{enter}us.example.com{enter}',
    )
    await userEvent.type(screen.getByLabelText(/Entra ID client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Entra ID tenant ID/i), 'tenant-id')

    await userEvent.click(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('rejects an additional domain that is not a domain', async () => {
    await prepare()

    await userEvent.type(screen.getByLabelText(/Your domain name/i), 'example.com')
    await userEvent.type(
      screen.getByPlaceholderText('Type a domain and press Enter'),
      'not a domain{enter}',
    )
    await userEvent.type(screen.getByLabelText(/Entra ID client ID/i), 'client-id')
    await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'client-secret')
    await userEvent.type(screen.getByLabelText(/Entra ID tenant ID/i), 'tenant-id')

    await userEvent.click(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN))

    await waitFor(() => {
      expect(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN)).toBeDisabled()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
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
      additionalDomains: ['de.example.com'],
    }

    // The update mutation returns the dialog fields so Apollo refreshes the cached integration.
    const updatedIntegrationResult = {
      ...existingIntegration,
      clientSecret: '••••••••…ret',
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

    it('prefills the form without the client secret', async () => {
      await prepareEdit()

      expect(screen.getByLabelText(/Your domain name/i)).toHaveValue('example.com')
      expect(screen.getByLabelText(/Host \(optional\)/i)).toHaveValue('login.microsoftonline.com')
      expect(screen.getByLabelText(/Entra ID client ID/i)).toHaveValue('client-id')
      expect(screen.getByLabelText(/Entra ID client secret/i)).toHaveValue('')
      expect(screen.getByText('Leave empty to keep the current client secret')).toBeInTheDocument()
      expect(screen.getByLabelText(/Entra ID tenant ID/i)).toHaveValue('tenant-id')
      expect(screen.getByText('de.example.com')).toBeInTheDocument()
    })

    it('omits an empty client secret when updating the integration', async () => {
      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateEntraIdIntegrationDocument,
            variables: {
              input: {
                domain: 'edited.com',
                additionalDomains: ['de.example.com'],
                host: 'login.microsoftonline.com',
                clientId: 'client-id',
                tenantId: 'tenant-id',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateEntraIdIntegration: updatedIntegrationResult,
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

    it('sends a new client secret when updating the integration', async () => {
      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateEntraIdIntegrationDocument,
            variables: {
              input: {
                domain: 'example.com',
                additionalDomains: ['de.example.com'],
                host: 'login.microsoftonline.com',
                clientId: 'client-id',
                clientSecret: 'new-client-secret',
                tenantId: 'tenant-id',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateEntraIdIntegration: updatedIntegrationResult,
            },
          },
        },
      ]

      await prepareEdit({ mocks })

      await userEvent.type(screen.getByLabelText(/Entra ID client secret/i), 'new-client-secret')
      await userEvent.click(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
      })
    })
    it('refreshes the cached integration with the updated values', async () => {
      const cache = new InMemoryCache()
      const cachedIntegration = {
        ...existingIntegration,
        __typename: 'EntraIdIntegration' as const,
      }
      const integrationCacheRef = {
        id: cache.identify(cachedIntegration),
        fragment: AddEntraIdIntegrationDialogFragmentDoc,
        fragmentName: 'AddEntraIdIntegrationDialog',
      }

      cache.writeFragment({ ...integrationCacheRef, data: cachedIntegration })

      const mocks: TestMocksType = [
        {
          request: {
            query: UpdateEntraIdIntegrationDocument,
            variables: {
              input: {
                domain: 'example.com',
                additionalDomains: ['de.example.com', 'us.example.com'],
                host: 'login.microsoftonline.com',
                clientId: 'client-id',
                tenantId: 'tenant-id',
                id: 'integration-id',
              },
            },
          },
          result: {
            data: {
              updateEntraIdIntegration: {
                ...cachedIntegration,
                clientSecret: '••••••••…ret',
                additionalDomains: ['de.example.com', 'us.example.com'],
              },
            },
          },
        },
      ]

      await act(() =>
        rtlRender(
          <BrowserRouter basename="/" useTransitions={false}>
            <MockedProvider mocks={mocks} cache={cache}>
              <ThemeProvider theme={theme}>
                <MainHeaderProvider>
                  <NiceModalWrapper>
                    <TestEditComponent />
                  </NiceModalWrapper>
                </MainHeaderProvider>
              </ThemeProvider>
            </MockedProvider>
          </BrowserRouter>,
        ),
      )

      await userEvent.type(
        await screen.findByPlaceholderText('Type a domain and press Enter'),
        'us.example.com{enter}',
      )
      await userEvent.click(screen.getByTestId(ENTRA_ID_INTEGRATION_SUBMIT_BTN))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
      })

      expect(
        cache.readFragment<AddEntraIdIntegrationDialogFragment>(integrationCacheRef)
          ?.additionalDomains,
      ).toEqual(['de.example.com', 'us.example.com'])
    })
  })
})
