import { renderHook } from '@testing-library/react'

import { GetCurrentUserInfosDocument } from '~/generated/graphql'
import { useAccordionPermissions } from '~/hooks/plans/useAccordionPermissions'
import { AllTheProviders } from '~/test-utils'

type PlanPermissions = {
  plansCreate: boolean
  plansUpdate: boolean
  plansDelete: boolean
  chargesCreate: boolean
  chargesUpdate: boolean
  chargesDelete: boolean
  subscriptionsUpdate: boolean
}

const DEFAULT_PERMISSIONS: PlanPermissions = {
  plansCreate: true,
  plansUpdate: true,
  plansDelete: true,
  chargesCreate: true,
  chargesUpdate: true,
  chargesDelete: true,
  subscriptionsUpdate: true,
}

const mockCurrentUser = {
  currentMembership: {
    id: '2',
    organization: { id: '3', name: 'Organization', logoUrl: 'https://logo.com' },
    permissions: DEFAULT_PERMISSIONS,
  },
}

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockCurrentUser,
}))

const prepare = (
  permissions: Partial<PlanPermissions> = {},
  isInSubscriptionForm = false,
  domain: 'plan' | 'charges' = 'plan',
) => {
  const membership = {
    id: '2',
    organization: { id: '3', name: 'Organization', logoUrl: 'https://logo.com' },
    permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
  }

  mockCurrentUser.currentMembership = membership

  const mocks = [
    {
      request: { query: GetCurrentUserInfosDocument },
      result: {
        data: {
          currentUser: {
            id: '1',
            email: 'gavin@hooli.com',
            premium: true,
            memberships: [membership],
            __typename: 'User',
          },
        },
      },
    },
  ]

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({ children, mocks, forceTypenames: true })

  return renderHook(() => useAccordionPermissions(isInSubscriptionForm, domain), { wrapper })
}

describe('useAccordionPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all true when user has every plan permission and not in subscription form', () => {
    const { result } = prepare()

    expect(result.current).toEqual({ canCreate: true, canUpdate: true, canDelete: true })
  })

  // The 'plan' domain submits through updatePlan (plans:update) only - no
  // plans:create/delete exists for a sub-resource of an existing plan.
  it('gates create, update and delete all on plansUpdate, not plansCreate/plansDelete', () => {
    const { result } = prepare({ plansCreate: false, plansDelete: false })

    expect(result.current).toEqual({ canCreate: true, canUpdate: true, canDelete: true })
  })

  it('blocks create, update and delete together when plansUpdate is missing', () => {
    const { result } = prepare({ plansUpdate: false })

    expect(result.current).toEqual({ canCreate: false, canUpdate: false, canDelete: false })
  })

  it('allows update via subscriptionsUpdate but blocks create/delete in sub mode', () => {
    const { result } = prepare({ subscriptionsUpdate: true }, true)

    expect(result.current.canUpdate).toBe(true)
    expect(result.current.canCreate).toBe(false)
    expect(result.current.canDelete).toBe(false)
  })

  it('blocks update in sub mode without subscriptionsUpdate', () => {
    const { result } = prepare({ subscriptionsUpdate: false }, true)

    expect(result.current.canUpdate).toBe(false)
  })

  it('ignores plansCreate and plansDelete entirely on the plan domain', () => {
    const { result } = prepare({ plansCreate: true, plansDelete: true, plansUpdate: false })

    expect(result.current).toEqual({ canCreate: false, canUpdate: false, canDelete: false })
  })

  it('gates the charges domain on charges permissions, not plans permissions', () => {
    const { result } = prepare(
      { plansCreate: false, plansUpdate: false, plansDelete: false },
      false,
      'charges',
    )

    expect(result.current).toEqual({ canCreate: true, canUpdate: true, canDelete: true })
  })

  it('blocks the charges domain when charges permissions are missing', () => {
    const { result } = prepare(
      { chargesCreate: false, chargesUpdate: false, chargesDelete: false },
      false,
      'charges',
    )

    expect(result.current).toEqual({ canCreate: false, canUpdate: false, canDelete: false })
  })

  it('allows charges update via subscriptionsUpdate but blocks create/delete in sub mode', () => {
    const { result } = prepare({ subscriptionsUpdate: true }, true, 'charges')

    expect(result.current).toEqual({ canCreate: false, canUpdate: true, canDelete: false })
  })
})
