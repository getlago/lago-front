import { ConnectionsInput } from '~/generated/graphql'

import { SelectedConnection } from './types'

type FormConnections = {
  paymentConnection?: SelectedConnection
  accountingConnection?: SelectedConnection
  crmConnection?: SelectedConnection
  taxConnection?: SelectedConnection
}

// An omitted category keeps whatever the backend stored, so an untouched choice must not
// produce a `connections` key at all: `inherit` would destroy the existing override row.
export const formatConnections = (
  { paymentConnection, accountingConnection, crmConnection, taxConnection }: FormConnections,
  isMultiConnectionEnabled: boolean,
): { connections?: ConnectionsInput } => {
  if (!isMultiConnectionEnabled) return {}

  const connections: ConnectionsInput = {
    ...(paymentConnection ? { payment: paymentConnection } : {}),
    ...(accountingConnection ? { accounting: accountingConnection } : {}),
    ...(crmConnection ? { crm: crmConnection } : {}),
    ...(taxConnection ? { tax: taxConnection } : {}),
  }

  return Object.keys(connections).length ? { connections } : {}
}
