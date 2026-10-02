import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { AdminCreateOrganizationDocument } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import AdminOrganizationCreate from '../AdminOrganizationCreate'

const mockOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen }),
}))
jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

type InviteDialogOptions = Parameters<ReturnType<typeof useCentralizedDialog>['open']>[0]

describe('AdminOrganizationCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    mockOpen.mockResolvedValue(undefined)
  })
  afterEach(() => jest.restoreAllMocks())

  it('validates required fields before asking for a reason', async () => {
    render(<AdminOrganizationCreate />)
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }))
    expect(await screen.findAllByText('Field is required')).not.toHaveLength(0)
    expect(NiceModal.show).not.toHaveBeenCalled()
  })

  it('creates an organization after confirmation and exposes the invitation link', async () => {
    const result = jest.fn(() => ({
      data: {
        adminCreateOrganization: {
          inviteUrl: 'https://app.lago.dev/invite/token',
          organization: { id: 'new-org', name: 'Acme' },
        },
      },
    }))

    render(<AdminOrganizationCreate />, {
      mocks: [
        {
          request: {
            query: AdminCreateOrganizationDocument,
            variables: {
              input: {
                name: 'Acme',
                ownerEmail: 'owner@example.com',
                premiumIntegrations: [],
                featureFlags: [],
                reason: 'Customer onboarding approved',
              },
            },
          },
          result,
        },
      ],
    })
    fireEvent.change(screen.getByPlaceholderText('Acme Corp'), { target: { value: '  Acme  ' } })
    fireEvent.change(screen.getByPlaceholderText('owner@example.com'), {
      target: { value: 'owner@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }))
    await waitFor(() => expect(NiceModal.show).toHaveBeenCalled())
    expect(result).not.toHaveBeenCalled()
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    expect(props.showNotifyCheckbox).toBe(false)
    await act(() => props.onConfirm('Customer onboarding approved', false))
    expect(result).toHaveBeenCalledTimes(1)
    const inviteProps = mockOpen.mock.calls[0][0] as InviteDialogOptions

    expect(inviteProps.description).toContain('owner@example.com')
    await act(async () => inviteProps.onAction?.())
    expect(copyToClipboard).toHaveBeenCalledWith('https://app.lago.dev/invite/token')
    expect(testMockNavigateFn).toHaveBeenCalledWith('/admin/organizations/new-org', {})
  })

  it('returns to the organization list on cancel', () => {
    render(<AdminOrganizationCreate />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(testMockNavigateFn).toHaveBeenCalledWith('/admin/organizations', {})
  })
})
