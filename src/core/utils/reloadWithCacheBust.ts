const CACHE_BUST_PARAM = '_r'

/**
 * Reload the current document with a unique URL.
 *
 * A soft `window.location.reload()` does not bypass the HTTP cache, so after a
 * deploy it can serve the very same stale `index.html` that references chunk
 * filenames which no longer exist. Navigating to a URL the cache has never seen
 * forces a fresh document request.
 */
export const reloadWithCacheBust = (): void => {
  const url = new URL(window.location.href)

  url.searchParams.set(CACHE_BUST_PARAM, Date.now().toString())
  window.location.replace(url.toString())
}
