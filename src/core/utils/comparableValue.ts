/**
 * Recursively drops `__typename` and sorts object keys so two values produced by
 * the same serialization compare equal regardless of key order / `__typename`.
 */
export const sortedWithoutTypename = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortedWithoutTypename)

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== '__typename')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, sortedWithoutTypename(entry)]),
    )
  }

  return value
}

/**
 * A stable string form of `value`, suitable for equality checks between two
 * values that describe the same thing but were built by different code paths.
 *
 * On top of key order and `__typename`, the `JSON.stringify` also erases
 * explicitly-`undefined` keys — which is what makes a value rebuilt from a
 * stored JSON payload (where those keys were dropped on write) compare equal to
 * a freshly built one (where they are present and `undefined`).
 */
export const comparable = (value: unknown): string => JSON.stringify(sortedWithoutTypename(value))
