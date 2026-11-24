import { useId, useRef } from 'react'

import { authorizeQuickbooksConnection } from './utils'

type AuthorizedConnection = { connectionId: string; sandbox: boolean }

// The QuickBooks login of a new connection. A login is kept until `reset`, so a create refused for
// a form reason is submitted again with the same connection instead of asking to log in again.
export const useQuickbooksAuthorization = () => {
  const componentId = useId()
  const authorizedRef = useRef<AuthorizedConnection | null>(null)

  const reset = () => {
    authorizedRef.current = null
  }

  // Resolves the connection id, or null when no login happened.
  const authorize = async (sandbox: boolean): Promise<string | null> => {
    if (authorizedRef.current?.sandbox === sandbox) return authorizedRef.current.connectionId

    const connectionId = `quickbooks-${componentId.replaceAll(':', '')}-${Date.now()}`

    if (!(await authorizeQuickbooksConnection({ sandbox, connectionId }))) return null

    authorizedRef.current = { connectionId, sandbox }

    return connectionId
  }

  return { authorize, reset }
}
