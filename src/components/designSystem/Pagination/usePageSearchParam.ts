import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useNavigate } from '~/core/router'

/** URL query-string key holding the current page. Bare `page` for a single list on a route;
 *  `${prefix}_page` when several paginated lists share one route (mirrors the filter prefix
 *  scheme). Page 1 is represented by the absence of the key, keeping the URL clean. */
const buildPageKey = (prefix?: string) => (prefix ? `${prefix}_page` : 'page')

/**
 * Persists the current page in the URL so it survives refresh / is deep-linkable, mirroring how
 * the Filters system already stores its state in the query string.
 *
 * Returns the current 1-based `page` (parsed + guarded from the URL) and `goToPage`, which writes
 * the page back to the URL (`replace` so paging doesn't spam browser history). Feed `page` into
 * the list query's `page` variable and pass `goToPage` as `PaginatedContent`'s `onPageChange`.
 *
 * Page reset on filter change is handled centrally in `useFilters`; search / page-size changes
 * reset it at the call site (`goToPage(1)`).
 *
 * @param prefix — required only when multiple paginated lists live on the same route, to keep
 *   their page params distinct (e.g. `draft_page` / `finalized_page`).
 */
export const usePageSearchParam = (prefix?: string) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const key = buildPageKey(prefix)

  const parsed = Number(searchParams.get(key))
  const page = Number.isInteger(parsed) && parsed > 1 ? parsed : 1

  const goToPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams)

      if (nextPage > 1) {
        next.set(key, String(nextPage))
      } else {
        next.delete(key)
      }

      // Object `to` (search only) keeps the current path and is left untouched by the slug-aware
      // wrapper; `replace` avoids a history entry per page click.
      navigate({ search: next.toString() }, { replace: true })
    },
    [searchParams, navigate, key],
  )

  return { page, goToPage }
}
