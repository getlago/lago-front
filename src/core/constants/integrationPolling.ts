/**
 * The backend creates integration customers asynchronously (perform_later), so
 * a read right after the mutation may not include a freshly added link yet.
 * Shared by the customer-details post-edit poll and the connections
 * immediate-save refresh.
 */
export const INTEGRATION_POLLING_INTERVAL = 1000
export const MAX_INTEGRATION_POLLING_ATTEMPTS = 3
