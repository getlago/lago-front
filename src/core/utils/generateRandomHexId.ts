/**
 * Generates a cryptographically random, lowercase hex string (2 chars per byte).
 *
 * Built on `crypto.getRandomValues` instead of `crypto.randomUUID` so it also
 * works on insecure origins (plain-HTTP self-hosted deployments), where
 * `randomUUID` is not exposed (https://github.com/getlago/lago/issues/752).
 * The default 16 bytes (128 bits) make collisions practically impossible.
 */
export const generateRandomHexId = (byteLength: number = 16): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(byteLength)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
