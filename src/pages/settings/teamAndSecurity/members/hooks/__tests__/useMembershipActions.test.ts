import { act, renderHook, waitFor } from '@testing-library/react'

import { RevokeMembershipDocument, UpdateMembershipRoleDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { allPermissionsGranted } from '../../__tests__/membershipMocks'
import { useMembershipActions } from '../useMembershipActions'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const createWrapper = (mocks: TestMocksType) => {
  return ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })
}

describe('useMembershipActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateMembershipRole', () => {
    it('returns updateMembershipRole function', () => {
      const { result } = renderHook(() => useMembershipActions(), {
        wrapper: createWrapper([]),
      })

      expect(typeof result.current.updateMembershipRole).toBe('function')
    })

    it('shows success toast on successful update', async () => {
      const updateMembershipRoleMock = {
        request: {
          query: UpdateMembershipRoleDocument,
          variables: {
            input: {
              id: 'member-1',
              roles: ['Finance'],
            },
          },
        },
        result: {
          data: {
            updateMembership: {
              __typename: 'Membership',
              id: 'member-1',
              roles: ['Finance'],
              user: {
                __typename: 'User',
                id: 'user-1',
                email: 'test@example.com',
              },
              permissions: allPermissionsGranted,
            },
          },
        },
      }

      const { result } = renderHook(() => useMembershipActions(), {
        wrapper: createWrapper([updateMembershipRoleMock]),
      })

      await act(async () => {
        await result.current.updateMembershipRole({
          variables: {
            input: {
              id: 'member-1',
              roles: ['Finance'],
            },
          },
        })
      })

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'success',
          translateKey: 'text_664f3562b7caf600e5246883',
        })
      })
    })
  })

  describe('revokeMembership', () => {
    it('returns revokeMembership function', () => {
      const { result } = renderHook(() => useMembershipActions(), {
        wrapper: createWrapper([]),
      })

      expect(typeof result.current.revokeMembership).toBe('function')
    })

    it('shows success toast on successful revoke', async () => {
      const revokeMembershipMock = {
        request: {
          query: RevokeMembershipDocument,
          variables: {
            input: {
              id: 'member-1',
            },
          },
        },
        result: {
          data: {
            revokeMembership: {
              __typename: 'Membership',
              id: 'member-1',
            },
          },
        },
      }

      const { result } = renderHook(() => useMembershipActions(), {
        wrapper: createWrapper([revokeMembershipMock]),
      })

      await act(async () => {
        await result.current.revokeMembership({
          variables: {
            input: {
              id: 'member-1',
            },
          },
        })
      })

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          translateKey: 'text_63208c711ce25db78140755d',
          severity: 'success',
        })
      })
    })
  })
})
