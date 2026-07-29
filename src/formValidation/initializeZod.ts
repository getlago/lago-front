import { z } from 'zod'

/**
 * Translation key displayed for any Zod issue that does not define its own message.
 *
 * Without it, Zod falls back to its built-in English strings ("Too small: expected
 * string to have >=1 characters"), which are not translation keys and therefore leak
 * raw into the UI.
 */
export const DEFAULT_ZOD_ERROR_MESSAGE = 'text_17853320146634gaqpptxi0y'

/**
 * Registers the default error message used by every Zod schema of the app.
 *
 * Messages set explicitly on a schema still win, so only validations left without a
 * message fall back to {@link DEFAULT_ZOD_ERROR_MESSAGE}.
 *
 * Exported so a test can re-register the config after resetting it; app code gets it
 * from the module-level call below.
 */
export const initializeZod = (): void => {
  z.config({ customError: () => DEFAULT_ZOD_ERROR_MESSAGE })
}

// Registered on import rather than from an init function: schemas are declared at module
// load all over the app, so importing this module for its side effect (see `App.tsx`) is
// what guarantees the default is in place before anything parses — with no entry point
// left to forget the call.
initializeZod()
