import { FetchResult } from '@apollo/client'

import { addToast, envGlobalVar } from '~/core/apolloClient'
import { LagoGQLError } from '~/core/apolloClient/errorUtils'

export const hasNonEuEligibilityError = (results: FetchResult[]): boolean => {
  return results.some((res) =>
    res.errors?.some((err) => {
      const details = (err.extensions as LagoGQLError['extensions'])?.details

      return details?.['euTaxManagement']?.includes('billing_entity_must_be_in_eu')
    }),
  )
}

// QuickBooks sandbox and production companies live in two Nango integrations.
export const getQuickbooksNangoIntegrationKey = (sandbox?: boolean | null): string =>
  sandbox ? 'quickbooks-sandbox' : 'quickbooks'

export const QUICKBOOKS_LOGIN_ERROR_KEY = 'text_62b31e1f6a5b8b1b745ece48'
export const QUICKBOOKS_POPUP_BLOCKED_KEY = 'text_179551691521620hug8ug71y'

const getAuthErrorType = (error: unknown): string | undefined =>
  error instanceof Error && 'type' in error && typeof error.type === 'string'
    ? error.type
    : undefined

// Opens the QuickBooks login for a Nango connection and resolves whether it succeeded. Closing the
// window is not an error, a blocked window asks for pop-ups, any other failure gets the error toast.
export const authorizeQuickbooksConnection = async ({
  sandbox,
  connectionId,
}: {
  sandbox?: boolean | null
  connectionId: string
}): Promise<boolean> => {
  try {
    const Nango = (await import('@nangohq/frontend')).default
    const nango = new Nango({ publicKey: envGlobalVar().nangoPublicKey })

    await nango.auth(getQuickbooksNangoIntegrationKey(sandbox), connectionId)

    return true
  } catch (error) {
    const type = getAuthErrorType(error)

    if (type === 'blocked_by_browser') {
      addToast({ severity: 'danger', translateKey: QUICKBOOKS_POPUP_BLOCKED_KEY })
    } else if (type !== 'window_closed') {
      addToast({ severity: 'danger', translateKey: QUICKBOOKS_LOGIN_ERROR_KEY })
    }

    return false
  }
}
