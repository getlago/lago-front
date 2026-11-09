import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'

import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { AdminCreateOrganizationDocument, LagoApiError } from '~/generated/graphql'
import { render, testMockNavigateFn, TestMocksType } from '~/test-utils'

import AdminOrganizationCreate, {
  ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID,
} from '../AdminOrganizationCreate'

const mockOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen }),
}))
jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))
jest.mock('~/core/apolloClient', () => {
  const actual = jest.requireActual('~/core/apolloClient')

  return {
    ...actual,
    envGlobalVar: jest.fn(() => actual.envGlobalVar()),
    addToast: jest.fn(),
  }
})

const setSelfServeEnabled = (selfServeEnabled: boolean): void => {
  const actualEnv = jest.requireActual('~/core/apolloClient').envGlobalVar()

  jest.mocked(envGlobalVar).mockReturnValue({ ...actualEnv, selfServeEnabled })
}

type InviteDialogOptions = Parameters<ReturnType<typeof useCentralizedDialog>['open']>[0]

const REASON = 'Customer onboarding approved'
const INVITE_URL = 'https://app.lago.dev/invite/token'
const PRODUCTION_ORG = { id: 'new-org', name: 'Acme' }
const SANDBOX_ORG = { id: 'sandbox-org', name: 'Acme Sandbox' }
const SELF_SERVE_DISABLED_MESSAGE =
  "Self-serve is not enabled on this deployment, so a sandbox can't be created."
const GENERIC_FAILURE_MESSAGE = 'Failed to create organization. Please try again.'

const buildCreateMock = ({
  selfServe,
  result,
}: {
  selfServe: boolean
  result: jest.Mock
}): TestMocksType[number] => ({
  request: {
    query: AdminCreateOrganizationDocument,
    variables: {
      input: {
        name: 'Acme',
        ownerEmail: 'owner@example.com',
        premiumIntegrations: [],
        featureFlags: [],
        ...(selfServe ? { selfServe: true } : {}),
        reason: REASON,
      },
    },
  },
  result,
})

const buildSuccessResult = (sandboxOrganization: typeof SANDBOX_ORG | null): jest.Mock =>
  jest.fn(() => ({
    data: {
      adminCreateOrganization: {
        inviteUrl: INVITE_URL,
        organization: PRODUCTION_ORG,
        sandboxOrganization,
      },
    },
  }))

const fillRequiredFields = (): void => {
  fireEvent.change(screen.getByPlaceholderText('Acme Corp'), { target: { value: '  Acme  ' } })
  fireEvent.change(screen.getByPlaceholderText('owner@example.com'), {
    target: { value: 'owner@example.com' },
  })
}

const submitAndConfirmReason = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }))
  await waitFor(() => expect(NiceModal.show).toHaveBeenCalled())
  const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

  await act(() => props.onConfirm(REASON, false))
}

const renderInviteDialogChildren = (): HTMLElement => {
  const inviteProps = mockOpen.mock.calls[0][0] as InviteDialogOptions

  return rtlRender(<>{inviteProps.children}</>).container
}

describe('AdminOrganizationCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    mockOpen.mockResolvedValue(undefined)
    setSelfServeEnabled(false)
  })
  afterEach(() => jest.restoreAllMocks())

  it('validates required fields before asking for a reason', async () => {
    render(<AdminOrganizationCreate />)
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }))
    expect(await screen.findAllByText('Field is required')).not.toHaveLength(0)
    expect(NiceModal.show).not.toHaveBeenCalled()
  })

  it('creates an organization after confirmation and exposes the invitation link', async () => {
    const result = buildSuccessResult(null)

    render(<AdminOrganizationCreate />, {
      mocks: [buildCreateMock({ selfServe: false, result })],
    })
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }))
    await waitFor(() => expect(NiceModal.show).toHaveBeenCalled())
    expect(result).not.toHaveBeenCalled()
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    expect(props.showNotifyCheckbox).toBe(false)
    await act(() => props.onConfirm(REASON, false))
    expect(result).toHaveBeenCalledTimes(1)
    const inviteProps = mockOpen.mock.calls[0][0] as InviteDialogOptions

    expect(inviteProps.description).toContain('owner@example.com')
    await act(async () => inviteProps.onAction?.())
    expect(copyToClipboard).toHaveBeenCalledWith(INVITE_URL)
    expect(testMockNavigateFn).toHaveBeenCalledWith('/admin/organizations/new-org', {})
  })

  it('returns to the organization list on cancel', () => {
    render(<AdminOrganizationCreate />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(testMockNavigateFn).toHaveBeenCalledWith('/admin/organizations', {})
  })

  describe('GIVEN self-serve is disabled on the deployment', () => {
    beforeEach(() => {
      setSelfServeEnabled(false)
    })

    describe('WHEN the page renders', () => {
      it('THEN should not display the self-serve switch', () => {
        render(<AdminOrganizationCreate />)

        expect(
          screen.queryByTestId(ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the organization is created', () => {
      it('THEN should send the input without the selfServe key and open the invite dialog', async () => {
        const result = buildSuccessResult(null)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: false, result })],
        })
        fillRequiredFields()
        await submitAndConfirmReason()

        expect(result).toHaveBeenCalledTimes(1)
        expect(mockOpen).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN self-serve is enabled on the deployment', () => {
    beforeEach(() => {
      setSelfServeEnabled(true)
    })

    describe('WHEN the page renders', () => {
      it('THEN should display the self-serve switch turned off', () => {
        render(<AdminOrganizationCreate />)

        const switchContainer = screen.getByTestId(
          ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID,
        )

        expect(switchContainer.querySelector('input')).not.toBeChecked()
      })
    })

    describe('WHEN the switch is left off and the organization is created', () => {
      it('THEN should send the input without the selfServe key', async () => {
        const result = buildSuccessResult(null)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: false, result })],
        })
        fillRequiredFields()
        await submitAndConfirmReason()

        expect(result).toHaveBeenCalledTimes(1)
      })

      it('THEN should show the invite dialog without production and sandbox rows', async () => {
        const result = buildSuccessResult(null)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: false, result })],
        })
        fillRequiredFields()
        await submitAndConfirmReason()

        const dialogBody = renderInviteDialogChildren()

        expect(dialogBody).toHaveTextContent(INVITE_URL)
        expect(dialogBody).not.toHaveTextContent('Sandbox')
        expect(dialogBody).not.toHaveTextContent(`${PRODUCTION_ORG.name} (${PRODUCTION_ORG.id})`)
      })
    })

    describe('WHEN the switch is turned on and a sandbox is created', () => {
      it('THEN should send selfServe true in the input', async () => {
        const result = buildSuccessResult(SANDBOX_ORG)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: true, result })],
        })
        fillRequiredFields()
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID))
        await submitAndConfirmReason()

        expect(result).toHaveBeenCalledTimes(1)
      })

      it('THEN should list the production and sandbox organizations in the invite dialog', async () => {
        const result = buildSuccessResult(SANDBOX_ORG)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: true, result })],
        })
        fillRequiredFields()
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID))
        await submitAndConfirmReason()

        const dialogBody = renderInviteDialogChildren()

        expect(dialogBody).toHaveTextContent(`${PRODUCTION_ORG.name} (${PRODUCTION_ORG.id})`)
        expect(dialogBody).toHaveTextContent(`${SANDBOX_ORG.name} (${SANDBOX_ORG.id})`)
        expect(dialogBody).toHaveTextContent(INVITE_URL)
      })

      it('THEN should navigate to the production organization once the dialog closes', async () => {
        const result = buildSuccessResult(SANDBOX_ORG)

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: true, result })],
        })
        fillRequiredFields()
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID))
        await submitAndConfirmReason()

        await waitFor(() =>
          expect(testMockNavigateFn).toHaveBeenCalledWith(
            `/admin/organizations/${PRODUCTION_ORG.id}`,
            {},
          ),
        )
      })
    })

    describe('WHEN the API rejects the sandbox with self_serve_disabled', () => {
      it('THEN should show the self-serve danger toast and not open the invite dialog', async () => {
        const result = jest.fn(() => ({
          data: { adminCreateOrganization: null },
          errors: [
            new GraphQLError('Self-serve disabled', {
              extensions: { code: LagoApiError.SelfServeDisabled },
            }),
          ],
        }))

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: true, result })],
        })
        fillRequiredFields()
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_CREATE_SELF_SERVE_SWITCH_TEST_ID))
        await submitAndConfirmReason()

        expect(result).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          message: SELF_SERVE_DISABLED_MESSAGE,
        })
        expect(mockOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the switch is left off and the API returns a generic error', () => {
      it('THEN should show only the generic failure toast and not open the invite dialog', async () => {
        const result = jest.fn(() => ({
          data: { adminCreateOrganization: null },
          errors: [
            new GraphQLError('Unprocessable entity', {
              extensions: { code: LagoApiError.UnprocessableEntity },
            }),
          ],
        }))

        render(<AdminOrganizationCreate />, {
          mocks: [buildCreateMock({ selfServe: false, result })],
        })
        fillRequiredFields()
        await submitAndConfirmReason()

        expect(result).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          message: GENERIC_FAILURE_MESSAGE,
        })
        expect(addToast).not.toHaveBeenCalledWith(
          expect.objectContaining({ message: SELF_SERVE_DISABLED_MESSAGE }),
        )
        expect(mockOpen).not.toHaveBeenCalled()
      })
    })
  })
})
