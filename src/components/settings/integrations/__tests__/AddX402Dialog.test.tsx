import { act, cleanup, fireEvent, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'
import { generatePath } from 'react-router'

import { FormProps } from '~/components/dialogs/types'
import { addToast, initializeTranslations } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { X402_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddX402ConnectionDialogFragment,
  CreateX402ConnectionMutation,
  CreateX402ConnectionMutationOptions,
  LagoApiError,
  UpdateX402ConnectionMutation,
  UpdateX402ConnectionMutationOptions,
  X402AssetEnum,
} from '~/generated/graphql'
import { AllTheProviders, render, testMockNavigateFn } from '~/test-utils'

import { X402_TEST_CATALOG } from './x402NetworksFixture'

import { useAddX402Dialog } from '../AddX402Dialog'

const REQUIRED_ERROR = 'Value is mandatory to move forward'
const ORIGINS_FORMAT_ERROR =
  'Use https:// and a domain, with an optional port. http only works for localhost, 127.0.0.1 and [::1]. No path or wildcard.'
const ENVIRONMENT_PLACEHOLDER = 'Select an environment'
const NETWORK_PLACEHOLDER = 'Select one or multiple networks'
const MAINNET_LABEL = 'Mainnet'
const DEVNET_LABEL = 'Devnet'

const mockDialogOpen = jest.fn()
const mockCreateConnection = jest.fn()
const mockUpdateConnection = jest.fn()

let mockCreateOptions: CreateX402ConnectionMutationOptions | undefined
let mockUpdateOptions: UpdateX402ConnectionMutationOptions | undefined

jest.mock('~/hooks/useX402Networks', () => ({
  useX402Networks: () => ({
    networks: jest.requireActual('~/components/settings/integrations/__tests__/x402NetworksFixture')
      .X402_TEST_CATALOG,
    loading: false,
  }),
}))
jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateX402ConnectionMutation: (options?: CreateX402ConnectionMutationOptions) => {
    mockCreateOptions = options
    return [mockCreateConnection]
  },
  useUpdateX402ConnectionMutation: (options?: UpdateX402ConnectionMutationOptions) => {
    mockUpdateOptions = options
    return [mockUpdateConnection]
  },
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const SVM_ADDRESS = '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4'

const connection: AddX402ConnectionDialogFragment = {
  __typename: 'X402ConnectionObject',
  id: 'connection-id',
  name: 'Coinbase Prod',
  code: 'coinbase_prod',
  networks: ['eip155:8453', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  allowedOrigins: ['https://example.com', 'http://localhost:3000'],
  autoCreateCustomers: true,
  payoutAddresses: {
    __typename: 'X402PayoutAddresses',
    evm: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    svm: SVM_ADDRESS,
  },
}

// What the API answers: the dialog's fields plus the details page's.
const savedConnection: NonNullable<UpdateX402ConnectionMutation['updateX402Connection']> = {
  ...connection,
  asset: X402AssetEnum.Usdc,
  cdpApiKeyId: '••••••••…abc',
  cdpApiKeySecret: '••••••••…xyz',
}

// The input's wrapper, which holds its error message.
const fieldOf = (input: HTMLElement): HTMLElement => {
  const field = input.closest('.MuiFormControl-root')?.parentElement

  if (!field) throw new Error('No form field around this input')

  return field
}

const openDialog = async (data?: { connection: AddX402ConnectionDialogFragment }) => {
  const { result } = renderHook(() => useAddX402Dialog(), { wrapper })

  act(() => {
    result.current.openAddX402Dialog(data && { ...data, catalog: X402_TEST_CATALOG })
  })

  const dialogProps = mockDialogOpen.mock.calls[0][0]

  await act(() => render(<>{dialogProps.children}</>))

  return dialogProps
}

// Judged the way the dialog does: a rejected submit, or one the form did not mark successful.
const submit = async (dialogProps: { form: FormProps }) => {
  let outcome: 'success' | 'failure' = 'success'

  await act(async () => {
    await Promise.resolve(dialogProps.form.submit()).catch(() => {
      outcome = 'failure'
    })
  })

  if (dialogProps.form.didSubmitSucceed && !dialogProps.form.didSubmitSucceed()) outcome = 'failure'

  return outcome
}

const pickOption = async (input: HTMLElement, option: string): Promise<void> => {
  fireEvent.mouseDown(input)
  fireEvent.click(await screen.findByText(option))
}

const unprocessable = (details: Record<string, unknown>) => ({
  errors: [
    { message: 'Unprocessable Entity', extensions: { code: 'unprocessable_entity', details } },
  ],
})

describe('useAddX402Dialog', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  afterEach(cleanup)

  beforeEach(() => {
    jest.clearAllMocks()
    mockDialogOpen.mockImplementation(() => new Promise(() => {}))
    mockCreateConnection.mockImplementation(async () => {
      const data: CreateX402ConnectionMutation = {
        createX402Connection: { ...savedConnection, id: 'new-connection-id' },
      }

      mockCreateOptions?.onCompleted?.(data)
      return { data }
    })
    mockUpdateConnection.mockImplementation(async () => {
      const data: UpdateX402ConnectionMutation = { updateX402Connection: savedConnection }

      mockUpdateOptions?.onCompleted?.(data)
      return { data }
    })
  })

  describe('GIVEN the dialog is opened in creation mode', () => {
    it('THEN silences only the validation errors it shows inline', async () => {
      await openDialog()

      expect(mockCreateOptions?.context).toEqual({
        silentErrorCodes: [LagoApiError.UnprocessableEntity],
      })
      expect(mockUpdateOptions?.context).toEqual({
        silentErrorCodes: [LagoApiError.UnprocessableEntity],
      })
    })

    describe('WHEN submitting an empty form', () => {
      it('THEN shows the required errors, scrolls to the first one and sends nothing', async () => {
        const dialogProps = await openDialog()

        expect(await submit(dialogProps)).toBe('failure')
        expect(screen.getAllByText(REQUIRED_ERROR).length).toBeGreaterThan(0)
        expect(scrollToFirstInputError).toHaveBeenCalledWith(
          'form-add-x402-integration',
          expect.objectContaining({ name: expect.anything() }),
        )
        expect(mockCreateConnection).not.toHaveBeenCalled()
        expect(mockUpdateConnection).not.toHaveBeenCalled()
      })
    })

    describe('WHEN filling every field', () => {
      it('THEN creates the connection and opens its details page', async () => {
        const user = userEvent.setup()
        const dialogProps = await openDialog()

        await user.type(screen.getByPlaceholderText('Type a name'), 'Coinbase')
        await user.type(screen.getByPlaceholderText('Type your CDP API key ID'), 'key-id')
        await user.type(screen.getByPlaceholderText('Type your CDP API key Secret'), 'key-secret')
        await pickOption(screen.getByPlaceholderText(ENVIRONMENT_PLACEHOLDER), DEVNET_LABEL)
        await pickOption(screen.getByPlaceholderText(NETWORK_PLACEHOLDER), 'Base Sepolia')
        await user.type(
          screen.getByPlaceholderText('Type an EVM payout address'),
          '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        )
        await user.type(
          screen.getByPlaceholderText('Separate origins with commas or enter one per line.'),
          'https://api.example.com, http://localhost:3000',
        )

        expect(await submit(dialogProps)).toBe('success')
        expect(mockCreateConnection).toHaveBeenCalledWith({
          variables: {
            input: {
              name: 'Coinbase',
              code: 'coinbase',
              cdpApiKeyId: 'key-id',
              cdpApiKeySecret: 'key-secret',
              networks: ['eip155:84532'],
              payoutAddresses: { evm: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', svm: null },
              allowedOrigins: ['https://api.example.com', 'http://localhost:3000'],
              autoCreateCustomers: true,
            },
          },
        })
        expect(mockUpdateConnection).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalledWith(
          generatePath(X402_INTEGRATION_DETAILS_ROUTE, {
            integrationId: 'new-connection-id',
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )
      })
    })
  })

  describe('GIVEN the dialog is opened on an existing connection', () => {
    describe('WHEN submitting it unchanged', () => {
      it('THEN updates it without sending the secrets', async () => {
        const dialogProps = await openDialog({ connection })

        expect(await submit(dialogProps)).toBe('success')
        expect(mockUpdateConnection).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'connection-id',
              name: 'Coinbase Prod',
              code: 'coinbase_prod',
              networks: ['eip155:8453', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
              payoutAddresses: {
                evm: connection.payoutAddresses.evm,
                svm: connection.payoutAddresses.svm,
              },
              allowedOrigins: ['https://example.com', 'http://localhost:3000'],
              autoCreateCustomers: true,
            },
          },
        })
        expect(mockCreateConnection).not.toHaveBeenCalled()
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(addToast).toHaveBeenCalledWith({
          message: 'Coinbase integration successfully edited',
          severity: 'success',
        })
      })
    })

    describe('WHEN typing a new secret only', () => {
      it('THEN sends the secret and leaves the key id out', async () => {
        const user = userEvent.setup()
        const dialogProps = await openDialog({ connection })

        await user.type(screen.getByPlaceholderText('Type your CDP API key Secret'), 'new-secret')

        expect(await submit(dialogProps)).toBe('success')

        const { input } = mockUpdateConnection.mock.calls[0][0].variables

        expect(input.cdpApiKeySecret).toBe('new-secret')
        expect(input).not.toHaveProperty('cdpApiKeyId')
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN shows a toast and keeps the dialog open', async () => {
        mockUpdateConnection.mockRejectedValueOnce(new Error('Network error'))
        const dialogProps = await openDialog({ connection })

        expect(await submit(dialogProps)).toBe('failure')
        expect(addToast).toHaveBeenCalledWith({
          message: 'Something went wrong',
          severity: 'danger',
        })
      })
    })

    describe('WHEN switching the environment', () => {
      it('THEN drops the networks of the other environment', async () => {
        await openDialog({ connection })

        expect(screen.getByText('Base')).toBeInTheDocument()

        await pickOption(screen.getByDisplayValue(MAINNET_LABEL), DEVNET_LABEL)

        expect(screen.queryByText('Base')).not.toBeInTheDocument()
        expect(screen.queryByText('Solana')).not.toBeInTheDocument()
      })
    })

    describe('WHEN an origin has a path', () => {
      it('THEN shows the format error and sends nothing', async () => {
        const user = userEvent.setup()
        const dialogProps = await openDialog({ connection })
        const origins = screen.getByDisplayValue(/https:\/\/example\.com/)

        await user.clear(origins)
        await user.type(origins, 'https://api.example.com/v1')

        expect(await submit(dialogProps)).toBe('failure')
        expect(screen.getByText(ORIGINS_FORMAT_ERROR)).toBeInTheDocument()
        expect(mockUpdateConnection).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API refuses fields', () => {
      it('THEN shows each error on its field, the payout address one by family', async () => {
        mockUpdateConnection.mockResolvedValueOnce(
          unprocessable({
            payoutAddresses: { svm: ['not_in_cdp_project'] },
            cdpApiKey: ['invalid_credentials'],
            code: ['value_already_exist'],
            allowedOrigins: ['value_is_too_long'],
          }),
        )
        const dialogProps = await openDialog({ connection })

        expect(await submit(dialogProps)).toBe('failure')

        const svmField = fieldOf(screen.getByDisplayValue(SVM_ADDRESS))

        expect(
          within(svmField).getByText(
            "This address isn't an account of the CDP project behind this API key",
          ),
        ).toBeInTheDocument()
        expect(screen.getByText('Coinbase refused this API key')).toBeInTheDocument()
        expect(screen.getByText('Code already existing, please type a new one')).toBeInTheDocument()
        expect(screen.getByText('Add at most 10 origins')).toBeInTheDocument()
        expect(addToast).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the API refuses with an error no field owns', () => {
      it('THEN shows a toast instead', async () => {
        mockUpdateConnection.mockResolvedValueOnce(
          unprocessable({ base: ['changed_concurrently'] }),
        )
        const dialogProps = await openDialog({ connection })

        expect(await submit(dialogProps)).toBe('failure')
        expect(addToast).toHaveBeenCalledWith({
          message: 'Something went wrong',
          severity: 'danger',
        })
      })
    })

    describe('WHEN the API fails with a code the error link reports', () => {
      it('THEN leaves the toast to the error link', async () => {
        mockUpdateConnection.mockResolvedValueOnce({
          errors: [{ message: 'Internal Error', extensions: { code: 'internal_error' } }],
        })
        const dialogProps = await openDialog({ connection })

        expect(await submit(dialogProps)).toBe('failure')
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })
})
