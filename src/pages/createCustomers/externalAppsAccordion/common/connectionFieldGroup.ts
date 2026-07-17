/**
 * Shared value shape for the per-provider connection field groups.
 *
 * Each provider content component is a `withFieldGroup` bound to this
 * single-connection subtree with RELATIVE paths. The mount site decides where
 * the subtree lives in the host form via the `fields` mapping, e.g. on the
 * customer form today (`taxCustomer.taxCustomerId`) or on a standalone
 * single-connection drawer form later — the group itself is form-agnostic.
 */
export type ConnectionFieldGroupValues = {
  externalCustomerId: string | undefined
  syncWithProvider: boolean | undefined
}

export const connectionFieldGroupDefaultValues: ConnectionFieldGroupValues = {
  externalCustomerId: '',
  syncWithProvider: false,
}
