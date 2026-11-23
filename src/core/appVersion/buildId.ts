// Shared by the Vite plugin (Node, at build time) and the app (browser, at runtime).
// Keep it free of browser globals at module level.

export const BUILD_ID_META_NAME = 'lago-build-id'
export const BUILT_AT_META_NAME = 'lago-built-at'
export const BUILD_ID_FILE_NAME = 'version.json'

export const BUILD_ID_LENGTH = 16
// A request that never settles would block every later check.
export const FETCH_TIMEOUT_MS = 10 * 1000

const BUILD_ID_PATTERN = new RegExp(`^[0-9a-f]{${BUILD_ID_LENGTH}}$`)

export type Build = {
  id: string
  builtAt: number
}

export const isBuildId = (value: unknown): value is string =>
  typeof value === 'string' && BUILD_ID_PATTERN.test(value)

const isBuiltAt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

const toBuild = (id: unknown, builtAt: unknown): Build | null =>
  isBuildId(id) && isBuiltAt(builtAt) ? { id, builtAt } : null

const readMeta = (name: string) =>
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.getAttribute('content')

// Only a production build writes the meta tags, so the dev server and tests get null.
export const getRunningBuild = (): Build | null =>
  toBuild(readMeta(BUILD_ID_META_NAME), Number(readMeta(BUILT_AT_META_NAME)))

// Any answer that is not a valid build (network error, 404, the SPA fallback serving
// index.html) means "unknown": never report a new version on a guess.
export const fetchDeployedBuild = async (): Promise<Build | null> => {
  try {
    // Resolved against <base href>, so an install served under a subpath reads its own file.
    const url = new URL(BUILD_ID_FILE_NAME, document.baseURI)

    // The query string gets past proxies that would cache the file despite its headers.
    url.searchParams.set('t', Date.now().toString())

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!response.ok) return null

    const body: unknown = await response.json()

    if (typeof body !== 'object' || body === null) return null

    return toBuild('buildId' in body ? body.buildId : null, 'builtAt' in body ? body.builtAt : null)
  } catch {
    return null
  }
}
