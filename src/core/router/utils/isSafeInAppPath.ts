/**
 * True only for absolute paths that stay on the app's own origin.
 *
 * The `URL` check alone is not enough, in two ways a reader cannot see:
 * `new URL('customers', origin)` is same-origin, so the leading-slash
 * requirement is what rejects relative values; and `/acme/\evil.com` resolves
 * same-origin too, while a browser normalises the `\` to `/` when it loads the
 * href. A legitimate in-app path never contains a raw backslash.
 */
export const isSafeInAppPath = (path: string): boolean => {
  if (typeof path !== 'string') return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('\\')) return false

  try {
    return new URL(path, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}
