import { ReactNode } from 'react'

import { Pagination } from '~/components/designSystem/Pagination'
import { CollectionMetadata } from '~/generated/graphql'

interface PaginatedContentProps {
  /** Pagination metadata returned by the list query (only `currentPage`/`totalPages` are used) */
  metadata?: Pick<CollectionMetadata, 'currentPage' | 'totalPages'> | null
  /** Called with the target page when the user navigates */
  onPageChange: (page: number) => void
  /** Disables the controls while a page is being fetched */
  loading?: boolean
  children: ReactNode
}

/**
 * Wraps content that needs numbered pagination — the pagination counterpart of
 * `InfiniteScroll`. Renders the children, then a `Pagination` control pinned to the
 * bottom of the scroll area, so every paginated list gets the same predictable
 * placement without repeating layout code at each call site.
 *
 * @example
 * <PaginatedContent
 *   metadata={data?.customers?.metadata}
 *   loading={loading}
 *   onPageChange={(page) => fetchMore({ variables: { page } })}
 * >
 *   <Table ... />
 * </PaginatedContent>
 */
export const PaginatedContent = ({
  metadata,
  onPageChange,
  loading,
  children,
}: PaginatedContentProps) => {
  return (
    <>
      {children}

      <Pagination
        className="sticky bottom-0 z-10 border-t border-grey-300 bg-white"
        currentPage={metadata?.currentPage ?? 1}
        totalPages={metadata?.totalPages ?? 0}
        disabled={loading}
        onPageChange={onPageChange}
      />
    </>
  )
}
