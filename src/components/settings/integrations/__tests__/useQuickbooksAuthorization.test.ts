import { act, renderHook } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'

import { useQuickbooksAuthorization } from '../useQuickbooksAuthorization'
import { QUICKBOOKS_LOGIN_ERROR_KEY, QUICKBOOKS_POPUP_BLOCKED_KEY } from '../utils'

const mockNangoAuth = jest.fn()

jest.mock('@nangohq/frontend', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ auth: mockNangoAuth })),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const authError = (type: string) => Object.assign(new Error(type), { type })

const authorize = async (sandbox: boolean) => {
  const { result } = renderHook(() => useQuickbooksAuthorization())
  let connectionId: string | null = null

  await act(async () => {
    connectionId = await result.current.authorize(sandbox)
  })

  return { result, connectionId }
}

describe('useQuickbooksAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNangoAuth.mockResolvedValue({})
  })

  describe('GIVEN a successful login', () => {
    it('THEN logs in to the Nango integration of the environment and returns the connection', async () => {
      const { connectionId } = await authorize(true)

      expect(mockNangoAuth).toHaveBeenCalledWith('quickbooks-sandbox', connectionId)
      expect(connectionId).toMatch(/^quickbooks-/)
    })

    it('THEN reuses the login for the same environment and logs in again after a reset', async () => {
      const { result, connectionId } = await authorize(false)
      let again: string | null = null

      await act(async () => {
        again = await result.current.authorize(false)
      })

      expect(again).toBe(connectionId)
      expect(mockNangoAuth).toHaveBeenCalledTimes(1)

      act(() => result.current.reset())
      await act(async () => {
        await result.current.authorize(false)
      })

      expect(mockNangoAuth).toHaveBeenCalledTimes(2)
    })

    it('THEN logs in again when the environment changes', async () => {
      const { result } = await authorize(false)

      await act(async () => {
        await result.current.authorize(true)
      })

      expect(mockNangoAuth).toHaveBeenLastCalledWith('quickbooks-sandbox', expect.any(String))
    })
  })

  describe('GIVEN the login window is closed', () => {
    it('THEN returns no connection and shows no toast', async () => {
      mockNangoAuth.mockRejectedValueOnce(authError('window_closed'))

      const { connectionId } = await authorize(false)

      expect(connectionId).toBeNull()
      expect(addToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the browser blocks the login window', () => {
    it('THEN asks to allow pop-ups', async () => {
      mockNangoAuth.mockRejectedValueOnce(authError('blocked_by_browser'))

      const { connectionId } = await authorize(false)

      expect(connectionId).toBeNull()
      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        translateKey: QUICKBOOKS_POPUP_BLOCKED_KEY,
      })
    })
  })

  describe('GIVEN the login fails otherwise', () => {
    it('THEN shows the login error', async () => {
      mockNangoAuth.mockRejectedValueOnce(new Error('Network error'))

      const { connectionId } = await authorize(false)

      expect(connectionId).toBeNull()
      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        translateKey: QUICKBOOKS_LOGIN_ERROR_KEY,
      })
    })
  })
})
