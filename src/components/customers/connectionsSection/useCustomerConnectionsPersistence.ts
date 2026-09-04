import { gql, useApolloClient } from '@apollo/client'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { useSetConnectionAsDefault } from '~/components/customerConnections/useSetConnectionAsDefault'
import {
  getIntegrationCustomerForCategory,
  getProviderPaymentConnection,
} from '~/components/customers/connectionsSection/utils'
import { addToast } from '~/core/apolloClient'
import {
  INTEGRATION_POLLING_INTERVAL,
  MAX_INTEGRATION_POLLING_ATTEMPTS,
} from '~/core/constants/integrationPolling'
import {
  AddCustomerDrawerFragment,
  GetCustomerDocument,
  GetCustomerQuery,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  useClearCustomerPaymentProviderMutation,
  useCreateCustomerIntegrationConnectionMutation,
  useCreateCustomerPaymentConnectionMutation,
  useDestroyCustomerIntegrationConnectionMutation,
  useDestroyCustomerPaymentConnectionMutation,
  useUpdateCustomerIntegrationConnectionMutation,
  useUpdateCustomerPaymentConnectionMutation,
} from '~/generated/graphql'

gql`
  mutation createCustomerPaymentConnection($input: CreatePaymentProviderCustomerInput!) {
    createPaymentProviderCustomer(input: $input) {
      id
    }
  }

  mutation updateCustomerPaymentConnection($input: UpdatePaymentProviderCustomerInput!) {
    updatePaymentProviderCustomer(input: $input) {
      id
    }
  }

  mutation destroyCustomerPaymentConnection($input: DestroyPaymentProviderCustomerInput!) {
    destroyPaymentProviderCustomer(input: $input) {
      id
    }
  }

  mutation createCustomerIntegrationConnection($input: CreateIntegrationCustomerInput!) {
    createIntegrationCustomer(input: $input) {
      __typename
    }
  }

  mutation updateCustomerIntegrationConnection($input: UpdateIntegrationCustomerInput!) {
    updateIntegrationCustomer(input: $input) {
      __typename
    }
  }

  mutation destroyCustomerIntegrationConnection($input: DestroyIntegrationCustomerInput!) {
    destroyIntegrationCustomer(input: $input) {
      id
    }
  }

  # Fallback only: removing a payment connection that has no provider-customer
  # link (nothing for the dedicated destroy to target) is only expressible
  # through the customer's explicit-null removal semantics
  mutation clearCustomerPaymentProvider($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
    }
  }
`

const getEnabledPaymentMethods = (
  providerPaymentMethods: ConnectionFormValues['providerPaymentMethods'],
): ProviderPaymentMethodsEnum[] =>
  Object.entries(providerPaymentMethods || {}).reduce((acc, [method, isEnabled]) => {
    if (isEnabled) acc.push(method as ProviderPaymentMethodsEnum)

    return acc
  }, [] as ProviderPaymentMethodsEnum[])

type UseCustomerConnectionsPersistenceProps = {
  customer: AddCustomerDrawerFragment
  connectionOptions: ReturnType<typeof useConnectionOptions>
}

type UseCustomerConnectionsPersistenceReturn = {
  saveConnection: (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    utils: { isEdition: boolean },
  ) => Promise<boolean>
  deleteConnection: (category: ConnectionCategory) => Promise<boolean>
  setConnectionAsDefault: (row: CustomerConnectionRow) => Promise<boolean>
}

/**
 * Immediate-save persistence for the customer-information connections view,
 * on the dedicated per-connection mutations: one connection, one call, its
 * own id. Editing keeps the link and updates it in place; switching to
 * another provider of the same category destroys the old link and creates a
 * new one (the update mutations expose no provider/code change).
 *
 * The mutations return the connection object, not the customer, so the
 * page's normalized cache does not pick the change up on its own: every
 * write is followed by a silent standalone customer query. Never refetch the
 * page's ACTIVE getCustomer observer instead (notifyOnNetworkStatusChange +
 * network-only would flip it to loading → the whole section unmounts, losing
 * the selection).
 */
export const useCustomerConnectionsPersistence = ({
  customer,
  connectionOptions,
}: UseCustomerConnectionsPersistenceProps): UseCustomerConnectionsPersistenceReturn => {
  const client = useApolloClient()

  const [createPaymentConnection] = useCreateCustomerPaymentConnectionMutation()
  const [updatePaymentConnection] = useUpdateCustomerPaymentConnectionMutation()
  const [destroyPaymentConnection] = useDestroyCustomerPaymentConnectionMutation()
  const [createIntegrationConnection] = useCreateCustomerIntegrationConnectionMutation()
  const [updateIntegrationConnection] = useUpdateCustomerIntegrationConnectionMutation()
  const [destroyIntegrationConnection] = useDestroyCustomerIntegrationConnectionMutation()
  const [clearPaymentProvider] = useClearCustomerPaymentProviderMutation()
  const { setConnectionAsDefault: setAsDefault } = useSetConnectionAsDefault()

  /**
   * Silent standalone customer read after a write. Integration customers are
   * created asynchronously by the backend, so the first read can still miss a
   * link that was just saved: `isSettled` retries the read on the same budget
   * as the customer-details post-edit poll until the expected state shows up.
   */
  const refreshCustomer = async (
    isSettled?: (refreshed: GetCustomerQuery['customer']) => boolean,
  ): Promise<void> => {
    for (let attempt = 0; attempt < MAX_INTEGRATION_POLLING_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, INTEGRATION_POLLING_INTERVAL))
      }

      try {
        const { data } = await client.query<GetCustomerQuery>({
          query: GetCustomerDocument,
          variables: { id: customer.id },
          fetchPolicy: 'network-only',
        })

        if (!isSettled || isSettled(data.customer)) return
      } catch {
        // Consistency refresh only — the write outcome is reported separately
        return
      }
    }
  }

  /**
   * True only when the mutation returned its payload. Apollo THROWS on
   * network and GraphQL errors (default errorPolicy) — without the catch a
   * failure would bubble as an unhandled rejection from the delete
   * confirmation dialog. No toast here: the global error link already
   * surfaces non-silenced errors.
   */
  const runMutation = async <TData>(
    mutate: () => Promise<{ data?: TData | null; errors?: readonly unknown[] }>,
    getPayload: (data: TData) => unknown,
  ): Promise<boolean> => {
    try {
      const { data, errors } = await mutate()

      return !errors?.length && !!data && !!getPayload(data)
    } catch {
      return false
    }
  }

  /** The org integration behind a category slot's connection code */
  const resolveOrgIntegration = (
    category: Exclude<ConnectionCategory, ConnectionCategory.Payment>,
    code: string,
  ): { id: string } | undefined => {
    const pools = {
      [ConnectionCategory.Accounting]: connectionOptions.allAccountingIntegrations,
      [ConnectionCategory.Tax]: connectionOptions.allTaxIntegrations,
      [ConnectionCategory.Crm]: connectionOptions.allCrmIntegrations,
    }

    return pools[category].find((integration) => integration.code === code)
  }

  const savePaymentConnection = async (values: ConnectionFormValues): Promise<boolean> => {
    const paymentProvider = (values.providerType as ProviderTypeEnum) || undefined

    // The create mutation pairs the code with its provider type — without a
    // resolved type the input cannot be built. Abort instead of guessing.
    if (!paymentProvider || !values.providerCode) {
      addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

      return false
    }

    const existingId = getProviderPaymentConnection(customer)?.id
    const isSameConnection = customer.paymentProviderCode === values.providerCode

    if (existingId && isSameConnection) {
      return runMutation(
        () =>
          updatePaymentConnection({
            variables: {
              input: {
                id: existingId,
                providerCustomerId: values.externalCustomerId || null,
                syncWithProvider: values.syncWithProvider ?? false,
                providerPaymentMethods: getEnabledPaymentMethods(values.providerPaymentMethods),
              },
            },
          }),
        (data) => data.updatePaymentProviderCustomer,
      )
    }

    // Provider switch: the old link goes first (along with its saved payment
    // methods — replacing the provider always had that effect), then the new
    // connection is created
    if (existingId) {
      const destroyed = await runMutation(
        () => destroyPaymentConnection({ variables: { input: { id: existingId } } }),
        (data) => data.destroyPaymentProviderCustomer,
      )

      if (!destroyed) return false
    }

    return runMutation(
      () =>
        createPaymentConnection({
          variables: {
            input: {
              customerId: customer.id,
              paymentProvider,
              paymentProviderCode: values.providerCode,
              providerCustomerId: values.externalCustomerId || null,
              syncWithProvider: values.syncWithProvider ?? false,
              providerPaymentMethods: getEnabledPaymentMethods(values.providerPaymentMethods),
            },
          },
        }),
      (data) => data.createPaymentProviderCustomer,
    )
  }

  const saveIntegrationConnection = async (
    category: Exclude<ConnectionCategory, ConnectionCategory.Payment>,
    values: ConnectionFormValues,
  ): Promise<boolean> => {
    const orgIntegration = values.providerCode
      ? resolveOrgIntegration(category, values.providerCode)
      : undefined

    // The create mutation targets the org integration by id; an unresolvable
    // code (org lists still loading, or the integration was deleted) cannot
    // be saved.
    if (!orgIntegration) {
      addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

      return false
    }

    const existing = getIntegrationCustomerForCategory(customer, category)
    const isSameConnection = existing?.integrationCode === values.providerCode

    const linkInput = {
      externalCustomerId: values.externalCustomerId || null,
      syncWithProvider: values.syncWithProvider ?? false,
      ...(category === ConnectionCategory.Accounting && values.subsidiaryId
        ? { subsidiaryId: values.subsidiaryId }
        : {}),
      ...(category === ConnectionCategory.Crm && values.targetedObject
        ? { targetedObject: values.targetedObject }
        : {}),
    }

    if (existing?.id && isSameConnection) {
      const existingId = existing.id

      return runMutation(
        () =>
          updateIntegrationConnection({
            variables: { input: { id: existingId, ...linkInput } },
          }),
        (data) => data.updateIntegrationCustomer,
      )
    }

    // Provider switch within the category: destroy the old link, then create
    // the new one (the update mutation cannot re-target another integration)
    if (existing?.id) {
      const existingId = existing.id
      const destroyed = await runMutation(
        () => destroyIntegrationConnection({ variables: { input: { id: existingId } } }),
        (data) => data.destroyIntegrationCustomer,
      )

      if (!destroyed) return false
    }

    return runMutation(
      () =>
        createIntegrationConnection({
          variables: {
            input: {
              customerId: customer.id,
              integrationId: orgIntegration.id,
              ...linkInput,
            },
          },
        }),
      (data) => data.createIntegrationCustomer,
    )
  }

  const saveConnection = async (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    { isEdition }: { isEdition: boolean },
  ): Promise<boolean> => {
    const succeeded =
      category === ConnectionCategory.Payment
        ? await savePaymentConnection(values)
        : await saveIntegrationConnection(category, values)

    // The link the write was supposed to leave behind — an integration
    // customer is created asynchronously, so the refresh waits for it instead
    // of leaving the new row out until a manual reload
    const isSavedLinkVisible = (refreshed: GetCustomerQuery['customer']): boolean =>
      !refreshed ||
      getIntegrationCustomerForCategory(refreshed, category)?.integrationCode ===
        values.providerCode

    // Refresh even on failure: a provider switch may have landed its destroy
    // half, and the section must show the real state
    await refreshCustomer(
      succeeded && category !== ConnectionCategory.Payment ? isSavedLinkVisible : undefined,
    )

    if (succeeded) {
      addToast({
        severity: 'success',
        translateKey: isEdition
          ? 'text_1785247393299xtb455zm7fk' // Connection successfully updated
          : 'text_178524739329876cmfq664cm', // Connection successfully added
      })
    }

    return succeeded
  }

  const deleteConnection = async (category: ConnectionCategory): Promise<boolean> => {
    const existingId =
      category === ConnectionCategory.Payment
        ? getProviderPaymentConnection(customer)?.id
        : getIntegrationCustomerForCategory(customer, category)?.id

    // A payment connection can exist on paymentProvider/paymentProviderCode
    // with no provider-customer link (Cashfree/Flutterwave, or sync off with
    // no external id) — its row is still listed, so it must stay deletable:
    // clear the customer's payment provider directly (explicit nulls are the
    // removal semantics; omitted fields stay untouched).
    // paymentProviderCode must be nulled explicitly: the backend only clears
    // it on its own when the customer HAD a provider customer, which is
    // exactly what this branch does not have — it would otherwise survive the
    // removal as a dangling code.
    if (category === ConnectionCategory.Payment && !existingId) {
      const cleared = await runMutation(
        () =>
          clearPaymentProvider({
            variables: {
              input: {
                id: customer.id,
                externalId: customer.externalId,
                paymentProvider: null,
                paymentProviderCode: null,
                providerCustomer: null,
              },
            },
          }),
        (data) => data.updateCustomer,
      )

      if (!cleared) return false

      await refreshCustomer()
      addToast({ severity: 'success', translateKey: 'text_661ff6e56ef7e1b7c542b2f9' })

      return true
    }

    // Nothing to destroy: the link never made it to the backend (or the
    // fragment is stale) — surface an error instead of a silent no-op
    if (!existingId) {
      addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

      return false
    }

    const succeeded =
      category === ConnectionCategory.Payment
        ? await runMutation(
            () => destroyPaymentConnection({ variables: { input: { id: existingId } } }),
            (data) => data.destroyPaymentProviderCustomer,
          )
        : await runMutation(
            () => destroyIntegrationConnection({ variables: { input: { id: existingId } } }),
            (data) => data.destroyIntegrationCustomer,
          )

    if (!succeeded) return false

    await refreshCustomer()
    addToast({ severity: 'success', translateKey: 'text_661ff6e56ef7e1b7c542b2f9' })

    return true
  }

  const setConnectionAsDefault = async (row: CustomerConnectionRow): Promise<boolean> => {
    const succeeded = await setAsDefault({
      category: row.category,
      connectionId: row.connectionId,
    })

    if (succeeded) await refreshCustomer()

    return succeeded
  }

  return { saveConnection, deleteConnection, setConnectionAsDefault }
}
