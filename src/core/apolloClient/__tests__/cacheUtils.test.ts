import { switchCurrentOrganization } from '../cacheUtils'

const mockSetCurrentOrganizationId = jest.fn()

jest.mock('../reactiveVars', () => ({
  addToast: jest.fn(),
  AUTH_TOKEN_LS_KEY: 'auth_token',
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  getCurrentOrganizationId: jest.fn(),
  setCurrentOrganizationId: (...args: unknown[]) => mockSetCurrentOrganizationId(...args),
  resetLocationHistoryVar: jest.fn(),
  updateAuthTokenVar: jest.fn(),
  updateCustomerPortalTokenVar: jest.fn(),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const createMockClient = () =>
  ({
    stop: jest.fn(),
    clearStore: jest.fn().mockResolvedValue(undefined),
  }) as unknown as Parameters<typeof switchCurrentOrganization>[0]

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
