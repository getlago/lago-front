import { gql, useApolloClient } from '@apollo/client'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { getIntegrationCustomerForCategory } from '~/components/customers/connectionsSection/utils'
import { addToast } from '~/core/apolloClient'
import {
  AddCustomerDrawerFragment,
  GetCustomerDocument,
  GetCustomerQuery,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
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

  const refreshCustomer = async (): Promise<void> => {
    try {
      await client.query<GetCustomerQuery>({
        query: GetCustomerDocument,
        variables: { id: customer.id },
        fetchPolicy: 'network-only',
      })
    } catch {
      // Consistency refresh only — the write outcome is reported separately
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

    const existingId = customer.providerCustomer?.id
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

    // Refresh even on failure: a provider switch may have landed its destroy
    // half, and the section must show the real state
    await refreshCustomer()

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
        ? customer.providerCustomer?.id
        : getIntegrationCustomerForCategory(customer, category)?.id

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

  return { saveConnection, deleteConnection }
}
