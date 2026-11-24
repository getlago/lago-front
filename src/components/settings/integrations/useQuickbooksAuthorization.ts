import { useId, useRef } from 'react'

import { addToast, envGlobalVar } from '~/core/apolloClient'

import { getQuickbooksNangoIntegrationKey } from './utils'

export const QUICKBOOKS_LOGIN_ERROR_KEY = 'text_1749562792335fy21gc3sxn0'
export const QUICKBOOKS_POPUP_BLOCKED_KEY = 'text_179551691521620hug8ug71y'

type AuthorizedConnection = { connectionId: string; sandbox: boolean }

const getAuthErrorType = (error: unknown): string | undefined =>
  error instanceof Error && 'type' in error && typeof error.type === 'string'
    ? error.type
    : undefined

// The QuickBooks login through Nango. A login is kept until `reset`, so a create refused for a
// form reason is submitted again with the same connection instead of asking to log in again.
export const useQuickbooksAuthorization = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()
  const authorizedRef = useRef<AuthorizedConnection | null>(null)

  const reset = () => {
    authorizedRef.current = null
  }

  // Resolves the connection id, or null when no login happened: closing the window is not an
  // error, and a blocked window asks for pop-ups.
  const authorize = async (sandbox: boolean): Promise<string | null> => {
    if (authorizedRef.current?.sandbox === sandbox) return authorizedRef.current.connectionId

    const connectionId = `quickbooks-${componentId.replaceAll(':', '')}-${Date.now()}`

    try {
      const Nango = (await import('@nangohq/frontend')).default
      const nango = new Nango({ publicKey: nangoPublicKey })

      await nango.auth(getQuickbooksNangoIntegrationKey(sandbox), connectionId)
    } catch (error) {
      const type = getAuthErrorType(error)

      if (type === 'blocked_by_browser') {
        addToast({ severity: 'danger', translateKey: QUICKBOOKS_POPUP_BLOCKED_KEY })
      } else if (type !== 'window_closed') {
        addToast({ severity: 'danger', translateKey: QUICKBOOKS_LOGIN_ERROR_KEY })
      }

      return null
    }

    authorizedRef.current = { connectionId, sandbox }

    return connectionId
  }

  return { authorize, reset }
}
