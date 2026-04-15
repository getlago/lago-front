import { ApolloClient } from '@apollo/client'

import { onLogIn, switchCurrentOrganization } from '../cacheUtils'

const mockGetCurrentOrganizationId = jest.fn()
const mockSetCurrentOrganizationId = jest.fn()
const mockUpdateAuthTokenVar = jest.fn()
const mockAddToast = jest.fn()

jest.mock('../reactiveVars', () => ({
  addToast: (...args: unknown[]) => mockAddToast(...args),
  AUTH_TOKEN_LS_KEY: 'auth_token',
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  getCurrentOrganizationId: (...args: unknown[]) => mockGetCurrentOrganizationId(...args),
  setCurrentOrganizationId: (...args: unknown[]) => mockSetCurrentOrganizationId(...args),
  resetLocationHistoryVar: jest.fn(),
  updateAuthTokenVar: (...args: unknown[]) => mockUpdateAuthTokenVar(...args),
  updateCustomerPortalTokenVar: jest.fn(),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const createMockOrg = (
  overrides: { id?: string; name?: string; accessibleByCurrentSession?: boolean } = {},
) => ({
  id: overrides.id ?? 'org-1',
  name: overrides.name ?? 'Org One',
  timezone: 'TZ_UTC',
  accessibleByCurrentSession: overrides.accessibleByCurrentSession ?? true,
})

const createMockClient = (queryResponse?: unknown) =>
  ({
    stop: jest.fn(),
    clearStore: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(
      queryResponse ?? {
        data: {
          currentUser: {
            id: 'user-1',
            organizations: [createMockOrg()],
          },
        },
      },
    ),
  }) as unknown as ApolloClient<object>

describe('switchCurrentOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('GIVEN a valid organization id', () => {
    describe('WHEN switching to a new organization', () => {
      it('THEN should set the organization id via the reactive var', async () => {
        const client = createMockClient()

        await switchCurrentOrganization(client, 'org-new-123')

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith('org-new-123')
      })

      it('THEN should clear the client store before updating the organization id', async () => {
        const client = createMockClient()
        const callOrder: string[] = []

        ;(client.clearStore as jest.Mock).mockImplementation(async () => {
          callOrder.push('clearStore')
        })
        mockSetCurrentOrganizationId.mockImplementation(() => {
          callOrder.push('setCurrentOrganizationId')
        })

        await switchCurrentOrganization(client, 'org-456')

        expect(callOrder).toEqual(['clearStore', 'setCurrentOrganizationId'])
      })
    })
  })
})

describe('onLogIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGetCurrentOrganizationId.mockReturnValue(null)
  })

  describe('GIVEN no previous organization stored', () => {
    describe('WHEN login succeeds with accessible organizations', () => {
      it('THEN should set the first accessible organization id via the reactive var', async () => {
        const client = createMockClient({
          data: {
            currentUser: {
              id: 'user-1',
              organizations: [
                createMockOrg({ id: 'org-a', name: 'Alpha Corp' }),
                createMockOrg({ id: 'org-b', name: 'Beta Inc' }),
              ],
            },
          },
        })

        await onLogIn(client, 'token-123')

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith('org-a')
      })
    })
  })

  describe('GIVEN a previous organization stored via reactive var', () => {
    describe('WHEN the previous org is still accessible', () => {
      it('THEN should keep the previous organization', async () => {
        mockGetCurrentOrganizationId.mockReturnValue('org-prev')

        const client = createMockClient({
          data: {
            currentUser: {
              id: 'user-1',
              organizations: [
                createMockOrg({ id: 'org-prev', name: 'Previous Org' }),
                createMockOrg({ id: 'org-other', name: 'Other Org' }),
              ],
            },
          },
        })

        await onLogIn(client, 'token-123')

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith('org-prev')
      })
    })

    describe('WHEN the previous org is no longer accessible', () => {
      it('THEN should clear the previous org and fall back to the first accessible one', async () => {
        mockGetCurrentOrganizationId.mockReturnValue('org-revoked')

        const client = createMockClient({
          data: {
            currentUser: {
              id: 'user-1',
              organizations: [
                createMockOrg({
                  id: 'org-revoked',
                  name: 'Revoked Org',
                  accessibleByCurrentSession: false,
                }),
                createMockOrg({ id: 'org-fallback', name: 'Fallback Org' }),
              ],
            },
          },
        })

        await onLogIn(client, 'token-123')

        // First call: clears the revoked org
        expect(mockSetCurrentOrganizationId).toHaveBeenNthCalledWith(1, null)
        // Second call: sets the fallback org
        expect(mockSetCurrentOrganizationId).toHaveBeenNthCalledWith(2, 'org-fallback')
      })
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN an error occurs during login', () => {
      it('THEN should clear the organization id via the reactive var and show a toast', async () => {
        const client = createMockClient()

        ;(client.query as jest.Mock).mockRejectedValue(new Error('Network error'))

        await onLogIn(client, 'token-123')

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith(null)
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })
})
