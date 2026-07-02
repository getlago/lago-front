/**
 * Pagination constants shared by the `Pagination` design-system component and every
 * paginated list. Kept in a dependency-free module (no component imports) so hooks and
 * non-component code can import the page-size defaults without pulling in the DS/router
 * import chain.
 */
export const DEFAULT_PAGE_SIZE = 20

export const PAGE_SIZE_OPTIONS = [20, 50, 100]
