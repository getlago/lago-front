import { ConnectionCategory } from '~/components/customerConnections/types'

/**
 * Stable row key of a customer connection. Shared by every surface listing
 * connections (customer create/edit, customer information master-detail) so a
 * row built from one source can be addressed from another — the information
 * view selects the freshly-saved row by rebuilding its id.
 */
export const getConnectionRowId = (category: ConnectionCategory, code: string): string =>
  `${category}-${code}`
