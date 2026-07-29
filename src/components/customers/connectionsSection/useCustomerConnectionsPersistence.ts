import { useApolloClient } from '@apollo/client'

import { ConnectionFormValues } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  FragmentIntegrationCustomer,
  getIntegrationCustomerForCategory,
  INTEGRATION_CATEGORIES,
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
  IntegrationCustomerInput,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
  useUpdateCustomerMutation,
} from '~/generated/graphql'

// Verbatim fragment → input mapping: the untouched categories MUST be echoed
// with their persisted ids — the backend destroys every integration customer
// whose id is missing from a submitted integrationCustomers list
// (IntegrationCustomers::CreateOrUpdateBatchService#sanitize_integration_customers).
const toIntegrationInput = (
  integrationCustomer: FragmentIntegrationCustomer,
): IntegrationCustomerInput => ({
  id: integrationCustomer.id,
  integrationCode: integrationCustomer.integrationCode,
  integrationType: integrationCustomer.integrationType,
  syncWithProvider: integrationCustomer.syncWithProvider,
  externalCustomerId: integrationCustomer.externalCustomerId,
  ...('subsidiaryId' in integrationCustomer && integrationCustomer.subsidiaryId
    ? { subsidiaryId: integrationCustomer.subsidiaryId }
    : {}),
  ...('targetedObject' in integrationCustomer && integrationCustomer.targetedObject
    ? { targetedObject: integrationCustomer.targetedObject }
    : {}),
})

/**
 * The full-replace integrationCustomers list: every untouched category echoed
 * verbatim from the customer fragment, the changed category replaced by
 * `editedEntry` (or dropped on delete when null).
 */
const buildIntegrationCustomersInput = (
  customer: AddCustomerDrawerFragment,
  changedCategory: ConnectionCategory,
  editedEntry: IntegrationCustomerInput | null,
): IntegrationCustomerInput[] =>
  INTEGRATION_CATEGORIES.flatMap((category) => {
    if (category === changedCategory) return editedEntry ? [editedEntry] : []

    const existing = getIntegrationCustomerForCategory(customer, category)

    return existing ? [toIntegrationInput(existing)] : []
  })

const getEnabledPaymentMethods = (
  providerPaymentMethods: ConnectionFormValues['providerPaymentMethods'],
): ProviderPaymentMethodsEnum[] =>
  Object.entries(providerPaymentMethods || {}).reduce((acc, [method, isEnabled]) => {
    if (isEnabled) acc.push(method as ProviderPaymentMethodsEnum)

    return acc
  }, [] as ProviderPaymentMethodsEnum[])

type UseCustomerConnectionsPersistenceProps = {
  customer: AddCustomerDrawerFragment
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
 * Immediate-save persistence for the customer-information connections view.
 *
 * Bridge strategy: every add/edit/delete goes through the existing
 * updateCustomer mutation with a MINIMAL input — base `{ id, externalId }`
 * (externalId is the only other required field; omitted fields are left
 * untouched by the backend) plus only the payment keys or the rebuilt
 * integrationCustomers list. The dedicated per-connection mutations later
 * replace this hook without touching the view.
 */
export const useCustomerConnectionsPersistence = ({
  customer,
}: UseCustomerConnectionsPersistenceProps): UseCustomerConnectionsPersistenceReturn => {
  const client = useApolloClient()

  // The mutation response carries the full connection fragment, so the
  // normalized cache updates the page on its own. Never refetch the page's
  // ACTIVE getCustomer observer (notifyOnNetworkStatusChange + network-only
  // would flip it to loading → the whole section unmounts, losing the
  // selection). A standalone client.query writes the fresh customer into the
  // cache and broadcasts it silently instead.
  const refreshCustomer = async (): Promise<AddCustomerDrawerFragment | undefined> => {
    try {
      const { data } = await client.query<GetCustomerQuery>({
        query: GetCustomerDocument,
        variables: { id: customer.id },
        fetchPolicy: 'network-only',
      })

      return (data?.customer as AddCustomerDrawerFragment | null) ?? undefined
    } catch {
      // Consistency refresh only — the mutation itself already succeeded
      return undefined
    }
  }

  const hasIntegrationCode = (
    refreshed: AddCustomerDrawerFragment | undefined,
    integrationCode: string,
  ): boolean =>
    !!refreshed &&
    INTEGRATION_CATEGORIES.some(
      (category) =>
        getIntegrationCustomerForCategory(refreshed, category)?.integrationCode === integrationCode,
    )

  const [updateCustomer] = useUpdateCustomerMutation()

  // Bounded background poll until the async-created link lands on the customer
  const pollForIntegrationCode = async (integrationCode: string): Promise<void> => {
    for (let attempt = 0; attempt < MAX_INTEGRATION_POLLING_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, INTEGRATION_POLLING_INTERVAL))

      if (hasIntegrationCode(await refreshCustomer(), integrationCode)) return
    }
  }

  const runUpdate = async (
    input: Omit<UpdateCustomerInput, 'id' | 'externalId'>,
  ): Promise<boolean> => {
    const { errors } = await updateCustomer({
      variables: {
        input: {
          id: customer.id,
          // Only required UpdateCustomerInput field besides id; the backend
          // applies it solely on editable customers, echoing it back is a no-op
          externalId: customer.externalId,
          ...input,
        },
      },
    })

    return !errors?.length
  }

  const saveConnection = async (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    { isEdition }: { isEdition: boolean },
  ): Promise<boolean> => {
    let succeeded = false

    if (category === ConnectionCategory.Payment) {
      const paymentProvider = (values.providerType as ProviderTypeEnum) || undefined

      // Without the provider type the input would either corrupt the provider
      // pairing (code without provider) or — with an explicit null — DELETE
      // the connection (backend removal semantics). Abort instead.
      if (!paymentProvider || !values.providerCode) {
        addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

        return false
      }

      succeeded = await runUpdate({
        paymentProvider,
        paymentProviderCode: values.providerCode,
        // Same rule as the create/edit mapper: no mapping and no sync → null
        // (Cashfree/Flutterwave have no provider-side customer)
        providerCustomer:
          values.externalCustomerId || values.syncWithProvider
            ? {
                providerCustomerId: values.externalCustomerId,
                syncWithProvider: values.syncWithProvider ?? false,
                providerPaymentMethods: getEnabledPaymentMethods(values.providerPaymentMethods),
              }
            : null,
      })

      if (succeeded) void refreshCustomer()
    } else {
      if (!values.providerCode) {
        addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

        return false
      }

      const existing = getIntegrationCustomerForCategory(customer, category)
      // Keep the link id only when the connection is unchanged: on a provider
      // switch the backend must create a new link instead of updating the old
      const isSameConnection = existing?.integrationCode === values.providerCode

      succeeded = await runUpdate({
        integrationCustomers: buildIntegrationCustomersInput(customer, category, {
          id: isSameConnection ? existing?.id : undefined,
          integrationCode: values.providerCode,
          integrationType: (values.providerType as IntegrationTypeEnum) || undefined,
          syncWithProvider: values.syncWithProvider ?? false,
          externalCustomerId: values.externalCustomerId ?? '',
          ...(category === ConnectionCategory.Accounting && values.subsidiaryId
            ? { subsidiaryId: values.subsidiaryId }
            : {}),
          ...(category === ConnectionCategory.Crm && values.targetedObject
            ? { targetedObject: values.targetedObject }
            : {}),
        }),
      })

      if (succeeded) {
        if (isSameConnection) {
          void refreshCustomer()
        } else {
          // A NEW link is created asynchronously backend-side — the mutation
          // response cannot carry it yet: refresh once, then keep polling in
          // the background (silently, no loading state) until it shows up
          const refreshed = await refreshCustomer()

          if (!hasIntegrationCode(refreshed, values.providerCode)) {
            void pollForIntegrationCode(values.providerCode)
          }
        }
      }
    }

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
    const succeeded =
      category === ConnectionCategory.Payment
        ? // Removal semantics: the key must be PRESENT and null. The backend
          // also clears the code and destroys the customer's payment methods.
          await runUpdate({ paymentProvider: null, providerCustomer: null })
        : await runUpdate({
            integrationCustomers: buildIntegrationCustomersInput(customer, category, null),
          })

    if (succeeded) {
      void refreshCustomer()
      addToast({ severity: 'success', translateKey: 'text_661ff6e56ef7e1b7c542b2f9' })
    }

    return succeeded
  }

  return { saveConnection, deleteConnection }
}
