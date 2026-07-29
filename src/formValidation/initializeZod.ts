import { z } from 'zod'

/**
 * Translation key displayed for any Zod issue that does not define its own message.
 *
 * Without it, Zod falls back to its built-in English strings ("Too small: expected
 * string to have >=1 characters"), which are not translation keys and therefore leak
 * raw into the UI.
 */
export const DEFAULT_ZOD_ERROR_MESSAGE = 'text_624ea7c29103fd010732ab7d'

/**
 * Registers the default error message used by every Zod schema of the app.
 *
 * Messages set explicitly on a schema still win, so only validations left without a
 * message fall back to {@link DEFAULT_ZOD_ERROR_MESSAGE}.
 */
export const initializeZod = (): void => {
  z.config({ customError: () => DEFAULT_ZOD_ERROR_MESSAGE })
}
