// Shared by the Vite plugin (Node, at build time) and the app (browser, at runtime).
// Keep it free of browser globals at module level.

export const BUILD_ID_META_NAME = 'lago-build-id'
export const BUILD_ID_FILE_NAME = 'version.json'

export const BUILD_ID_LENGTH = 16

const BUILD_ID_PATTERN = new RegExp(`^[0-9a-f]{${BUILD_ID_LENGTH}}$`)

export const isBuildId = (value: unknown): value is string =>
  typeof value === 'string' && BUILD_ID_PATTERN.test(value)

// Only a production build writes the meta tag, so the dev server and tests get null.
export const getRunningBuildId = (): string | null => {
  const content = document
    .querySelector<HTMLMetaElement>(`meta[name="${BUILD_ID_META_NAME}"]`)
    ?.getAttribute('content')

  return isBuildId(content) ? content : null
}

// Any answer that is not a valid build id (network error, 404, the SPA fallback serving
// index.html) means "unknown": never report a new version on a guess.
export const fetchDeployedBuildId = async (): Promise<string | null> => {
  try {
    // Resolved against <base href>, so an install served under a subpath reads its own file.
    const url = new URL(BUILD_ID_FILE_NAME, document.baseURI)

    // The query string gets past proxies that would cache the file despite its headers.
    url.searchParams.set('t', Date.now().toString())

    const response = await fetch(url.toString(), { cache: 'no-store', credentials: 'same-origin' })

    if (!response.ok) return null

    const body: unknown = await response.json()
    const buildId =
      typeof body === 'object' && body !== null && 'buildId' in body ? body.buildId : null

    return isBuildId(buildId) ? buildId : null
  } catch {
    return null
  }
}
