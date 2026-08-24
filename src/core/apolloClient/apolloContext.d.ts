import { PspErrorCode } from '~/core/apolloClient/errorUtils'
import { LagoApiError } from '~/generated/graphql'

/**
 * The keys the global error link (`src/core/apolloClient/init.ts`) reads off an
 * operation's context to decide whether an error is expected. Apollo declares
 * `DefaultContext extends Record<string, any>`, so without this augmentation a
 * misspelled or mistyped key compiles silently — which is how 15 call sites came
 * to pass a `LagoApiError` to `silentError`, a boolean, and thereby silence
 * *every* error on those operations instead of the one code they meant.
 */
declare module '@apollo/client' {
  interface DefaultContext {
    /** Silences every error on the operation. Use `silentErrorCodes` unless that is really what you want. */
    silentError?: boolean
    /** Silences only the errors whose top-level `extensions.code` is listed here. */
    silentErrorCodes?: Array<LagoApiError | PspErrorCode>
    /** Silences only the errors carrying one of these codes in `extensions.details`. */
    silentErrorDetails?: string[]
  }
}
