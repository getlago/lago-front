/**
 * Early Jest Setup - Runs before any test imports
 *
 * This file configures console suppression BEFORE any libraries are imported,
 * so we can intercept warnings from libraries that cache console references.
 */

/**
 * Patterns to suppress in test console output.
 * Each pattern is an array of strings that must ALL be present in the message.
 */
const SUPPRESSED_PATTERNS: string[][] = [
  // Apollo Client 4.0 deprecation warnings
  ['MockedProvider', 'addTypename', 'deprecated'],
  ['InMemoryCache', 'addTypename', 'deprecated'],
  ['useLazyQuery', 'variables', 'deprecated'],
  ['cache.diff', 'canonizeResults', 'deprecated'],
  ['ApolloLink', 'onError', 'deprecated'],

  // React Router v7 future flag warnings
  ['React Router Future Flag Warning', 'v7_startTransition'],
  ['React Router Future Flag Warning', 'v7_relativeSplatPath'],

  // GraphQL fragment duplicate warnings (test environment artifact)
  ['Warning: fragment with name', 'already exists'],

  // React act() warnings - often false positives in async tests
  // May need more checking on this one to avoid missing real warnings
  ['not wrapped in act'],
]

/**
 * Check if console args should be suppressed based on known noise patterns.
 *
 * Note: Console messages may come as printf-style format strings with multiple args,
 * e.g., console.warn("[%s]: `%s` is deprecated", "InMemoryCache", "addTypename")
 * So we need to check ALL arguments, not just the first one.
 */
function shouldSuppressWarning(args: unknown[]): boolean {
  const fullMessage = args.map(String).join(' ')
  return SUPPRESSED_PATTERNS.some((pattern) => pattern.every((term) => fullMessage.includes(term)))
}

// Store original methods before any library can cache them
const originalWarn = console.warn.bind(console)
const originalError = console.error.bind(console)

// Replace console methods
console.warn = (...args: unknown[]) => {
  if (shouldSuppressWarning(args)) return
  originalWarn(...args)
}

console.error = (...args: unknown[]) => {
  if (shouldSuppressWarning(args)) return
  originalError(...args)
}
