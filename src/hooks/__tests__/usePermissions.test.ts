import { renderHook } from '@testing-library/react'

import { GetCurrentUserInfosDocument } from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'
import { AllTheProviders } from '~/test-utils'

const membershipWithPermissions = {
  id: '2',
  organization: {
    id: '3',
    name: 'Organization',
    logoUrl: 'https://logo.com',
  },
  permissions: {
    addonsCreate: true,
    addonsDelete: false,
    addonsEdit: true,
    addonsRead: true,
  },
}

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    currentMembership: membershipWithPermissions,
  }),
}))

async function prepare() {
  const mocks = [
    {
      request: {
        query: GetCurrentUserInfosDocument,
      },
      result: {
        data: {
          currentUser: {
            id: '1',
            email: 'gavin@hooli.com',
            premium: true,
            memberships: [membershipWithPermissions],
            __typename: 'User',
          },
        },
      },
    },
  ]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      forceTypenames: true,
    })

  const { result } = renderHook(() => usePermissions(), {
    wrapper: customWrapper,
  })

  return { result: result }
}

describe('useCreateCreditNote()', () => {
  it('returns default datas', async () => {
    const { result } = await prepare()

    expect(result.current.hasPermissions).toBeDefined()
    expect(result.current.hasPermissions(['addonsCreate'])).toBeTruthy()
    expect(result.current.hasPermissions(['addonsDelete'])).toBeFalsy()
  })
})
