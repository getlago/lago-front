import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AddOktaDialog,
  AddOktaDialogRef,
  SUBMIT_BUTTON_TEST_ID,
} from '~/components/settings/authentication/AddOktaDialog'
import { initializeYup } from '~/formValidation/initializeYup'
import { CreateOktaIntegrationDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

initializeYup()

const mockOnSubmit = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      authenticationMethods: [],
    },
  }),
}))

async function prepare({ mocks = [] }: { mocks?: TestMocksType } = {}) {
  const dialogRef = { current: null as AddOktaDialogRef | null }

  await act(() =>
    render(<AddOktaDialog ref={(ref) => (dialogRef.current = ref)} />, {
      mocks,
    }),
  )

  act(() => {
    dialogRef.current?.openDialog({
      callback: mockOnSubmit,
    })
  })

  return { dialogRef }
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
      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

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
      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

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
      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

      expect(submitButton).not.toBeDisabled()
    })

    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('integration-id')
    })
  })

  it('should disable submit button when required fields are missing', async () => {
    const requiredFields = [
      { label: /Your domain name/i, value: 'example.com' },
      { label: /Okta client ID/i, value: 'client-id' },
      { label: /Okta client secret/i, value: 'client-secret' },
      { label: /Okta organization name/i, value: 'org-name' },
    ]

    for (const field of requiredFields) {
      await prepare()

      // Fill all fields except the current one
      for (const otherField of requiredFields) {
        if (otherField.label !== field.label) {
          await userEvent.type(screen.getByLabelText(otherField.label), otherField.value)
        }
      }

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

        expect(submitButton).toBeDisabled()
      })

      cleanup()
    }
  })
})
