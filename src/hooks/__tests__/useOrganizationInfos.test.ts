import { renderHook } from '@testing-library/react'

import { currentOrganizationVar } from '~/core/apolloClient/reactiveVars'
import { EventsStoreEnum, FeatureFlagEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const mockUseGetOrganizationInfosQuery = jest.fn()

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({}),
}))

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => ({ isAuthenticated: true }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrganizationInfosQuery: (opts: unknown) => mockUseGetOrganizationInfosQuery(opts),
}))

describe('useOrganizationInfos — skip-on-null-var guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetOrganizationInfosQuery.mockReturnValue({
      data: undefined,
      loading: false,
      refetch: jest.fn(),
    })
  })

  it('skips the org query when there is no current org id (no header to send)', () => {
    currentOrganizationVar(null)

    renderHook(() => useOrganizationInfos())

    expect(mockUseGetOrganizationInfosQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    )
  })

  it('runs the org query once the current org id is set', () => {
    currentOrganizationVar('org-1')

    renderHook(() => useOrganizationInfos())

    expect(mockUseGetOrganizationInfosQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: false }),
    )

    currentOrganizationVar(null)
  })
})

describe('useOrganizationInfos — hasFeatureFlag', () => {
  const mockOrganization = (
    featureFlags: FeatureFlagEnum[],
    eventsStore: EventsStoreEnum,
  ): void => {
    mockUseGetOrganizationInfosQuery.mockReturnValue({
      data: { organization: { id: 'org-1', slug: 'acme', featureFlags, eventsStore } },
      loading: false,
      refetch: jest.fn(),
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the account_tree flag is enabled', () => {
    describe('WHEN the organization uses the ClickHouse events store', () => {
      it('THEN should report the flag as enabled', () => {
        mockOrganization([FeatureFlagEnum.AccountTree], EventsStoreEnum.Clickhouse)

        const { result } = renderHook(() => useOrganizationInfos())

        expect(result.current.hasFeatureFlag(FeatureFlagEnum.AccountTree)).toBe(true)
      })
    })

    describe('WHEN the organization uses the Postgres events store', () => {
      it('THEN should report the flag as disabled', () => {
        mockOrganization([FeatureFlagEnum.AccountTree], EventsStoreEnum.Postgres)

        const { result } = renderHook(() => useOrganizationInfos())

        expect(result.current.hasFeatureFlag(FeatureFlagEnum.AccountTree)).toBe(false)
      })
    })
  })

  describe('GIVEN a flag without prerequisite', () => {
    describe('WHEN the organization uses the Postgres events store', () => {
      it('THEN should only depend on the flag being present', () => {
        mockOrganization([FeatureFlagEnum.OrderForms], EventsStoreEnum.Postgres)

        const { result } = renderHook(() => useOrganizationInfos())

        expect(result.current.hasFeatureFlag(FeatureFlagEnum.OrderForms)).toBe(true)
        expect(result.current.hasFeatureFlag(FeatureFlagEnum.AccountTree)).toBe(false)
      })
    })
  })
})
