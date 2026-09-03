import { ApolloError } from '@apollo/client'
import { act, renderHook } from '@testing-library/react'

import { LagoApiError } from '~/generated/graphql'

import { useInviteActions } from '../useInviteActions'

const GENERIC_ERROR_KEY = 'text_622f7a3dc32ce100c46a5154'
const STALE_INVITE_ERROR_KEY = 'text_1788431703232ovdpgmdftnt'

type MutationConfig = {
  context?: { silentErrorCodes?: unknown[] }
  onError?: (error: ApolloError) => void
}

let mockUpdateInviteRoleConfig: MutationConfig | undefined
let mockRevokeInviteConfig: MutationConfig | undefined

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateInviteMutation: () => [jest.fn(), { error: undefined }],
  useUpdateInviteRoleMutation: (config: MutationConfig) => {
    mockUpdateInviteRoleConfig = config

    return [jest.fn()]
  },
  useRevokeInviteMutation: (config: MutationConfig) => {
    mockRevokeInviteConfig = config

    return [jest.fn()]
  },
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const mockRefetchQueries = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
}))

const buildError = (code?: LagoApiError, details?: Record<string, string[]>): ApolloError =>
  ({
    graphQLErrors: code
      ? [{ message: 'error', extensions: details ? { code, details } : { code } }]
      : [],
  }) as unknown as ApolloError

describe('useInviteActions error handling', () => {
  const onInviteNotFound = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateInviteRoleConfig = undefined
    mockRevokeInviteConfig = undefined
  })

  const renderInviteActions = (): void => {
    renderHook(() => useInviteActions({ onInviteNotFound }))
  }

  it('silences not_found for invite-resolving mutations', () => {
    renderInviteActions()

    expect(mockUpdateInviteRoleConfig?.context?.silentErrorCodes).toContain(LagoApiError.NotFound)
    expect(mockRevokeInviteConfig?.context?.silentErrorCodes).toContain(LagoApiError.NotFound)
  })

  it('handles an invite not_found from an update', () => {
    renderInviteActions()

    act(() => {
      mockUpdateInviteRoleConfig?.onError?.(
        buildError(LagoApiError.NotFound, { invite: ['not_found'] }),
      )
    })

    expect(mockAddToast).toHaveBeenCalledTimes(1)
    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: STALE_INVITE_ERROR_KEY,
    })
    expect(mockAddToast).not.toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: GENERIC_ERROR_KEY,
    })
    expect(mockRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: ['getInvites'] })
    expect(onInviteNotFound).toHaveBeenCalledTimes(1)
  })

  it('falls back to the generic toast for another not_found resource', () => {
    renderInviteActions()

    act(() => {
      mockUpdateInviteRoleConfig?.onError?.(
        buildError(LagoApiError.NotFound, { organization: ['not_found'] }),
      )
    })

    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: GENERIC_ERROR_KEY,
    })
    expect(mockRefetchQueries).not.toHaveBeenCalled()
    expect(onInviteNotFound).not.toHaveBeenCalled()
  })

  it.each([
    ['an unprocessable entity', buildError(LagoApiError.UnprocessableEntity)],
    ['a network error', buildError()],
  ])('leaves %s to the global error handling', (_, error) => {
    renderInviteActions()

    act(() => {
      mockUpdateInviteRoleConfig?.onError?.(error)
    })

    expect(mockAddToast).not.toHaveBeenCalled()
    expect(mockRefetchQueries).not.toHaveBeenCalled()
    expect(onInviteNotFound).not.toHaveBeenCalled()
  })

  it('handles an invite not_found from a revocation', () => {
    renderInviteActions()

    act(() => {
      mockRevokeInviteConfig?.onError?.(
        buildError(LagoApiError.NotFound, { invite: ['not_found'] }),
      )
    })

    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: STALE_INVITE_ERROR_KEY,
    })
    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: ['getInvites'] })
    expect(onInviteNotFound).toHaveBeenCalledTimes(1)
  })
})
