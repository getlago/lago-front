import {
  INTEGRATION_TYPE_TO_CATEGORY,
  MANUAL_CONNECTION_CODE,
} from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  AddCustomerDrawerFragment,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  ProviderPaymentMethodsEnum,
} from '~/generated/graphql'

import { BillingEntityItem } from './types'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchema'

type FormPaymentConnections = NonNullable<CreateCustomerDefaultValues['paymentProviderCustomers']>
type FormIntegrationConnections = NonNullable<CreateCustomerDefaultValues['integrationCustomers']>

const getProviderPaymentMethodsRecord = (
  providerPaymentMethods: ProviderPaymentMethodsEnum[] | null | undefined,
  currency: CurrencyEnum | null | undefined,
): Partial<Record<ProviderPaymentMethodsEnum, boolean>> => {
  if (!providerPaymentMethods?.length) {
    return currency === CurrencyEnum.Eur
      ? { [ProviderPaymentMethodsEnum.Card]: true, [ProviderPaymentMethodsEnum.SepaDebit]: true }
      : { [ProviderPaymentMethodsEnum.Card]: true }
  }

  return providerPaymentMethods.reduce(
    (acc, method) => {
      acc[method] = true
      return acc
    },
    {} as Record<ProviderPaymentMethodsEnum, boolean>,
  )
}

const mapPaymentProviderCustomers = (
  customer: AddCustomerDrawerFragment | undefined,
): FormPaymentConnections => {
  if (!customer) return []

  const connections: FormPaymentConnections = (customer.paymentProviderCustomers ?? [])
    // The backend prepends a NON-persisted manual placeholder (id
    // "<customerId>-manual") when no manual row is persisted: echoing it back
    // would silently create a manual connection on the next save
    .filter((connection) => connection.id !== `${customer.id}-manual`)
    .map((connection) => {
      // A persisted manual row stays in the model (hidden from the UI) so its
      // id round-trips and the diff-by-id reconciliation leaves it untouched
      if (connection.code === MANUAL_CONNECTION_CODE) {
        return {
          id: connection.id,
          code: connection.code,
          isDefault: connection.isDefault,
        }
      }

      return {
        id: connection.id,
        code: connection.code ?? undefined,
        isDefault: connection.isDefault,
        // The ProviderCustomer type carries no provider identity: with the
        // one-per-type cap it comes from the customer's top-level fields
        providerCode: customer.paymentProviderCode ?? '',
        providerType: customer.paymentProvider ?? undefined,
        providerCustomerId: connection.providerCustomerId ?? '',
        syncWithProvider: connection.syncWithProvider ?? false,
        providerPaymentMethods: getProviderPaymentMethodsRecord(
          connection.providerPaymentMethods,
          customer.currency,
        ),
      }
    })

  const hasProviderConnection = connections.some(
    (connection) => connection.code !== MANUAL_CONNECTION_CODE,
  )

  // Cashfree/Flutterwave never get a connection row: they have no provider
  // customer to map, so the backend creates none and the customer-level
  // scalars are the connection's only record. Rebuilding an id-less row from
  // them keeps the connection visible and re-emitted — without it, the next
  // unrelated customer edit would send `paymentProvider: null` and destroy it.
  if (!hasProviderConnection && customer.paymentProvider && customer.paymentProviderCode) {
    connections.push({
      providerCode: customer.paymentProviderCode,
      providerType: customer.paymentProvider,
      providerCustomerId: '',
      syncWithProvider: false,
      providerPaymentMethods: getProviderPaymentMethodsRecord(undefined, customer.currency),
    })
  }

  return connections
}

const mapIntegrationCustomers = (
  customer: AddCustomerDrawerFragment | undefined,
): FormIntegrationConnections => {
  return (customer?.integrationCustomers ?? []).flatMap((integrationCustomer) => {
    const category = integrationCustomer.integrationType
      ? INTEGRATION_TYPE_TO_CATEGORY[integrationCustomer.integrationType]
      : undefined

    if (!category || category === ConnectionCategory.Payment) return []

    return [
      {
        id: integrationCustomer.id,
        category,
        providerCode: integrationCustomer.integrationCode ?? '',
        providerType: integrationCustomer.integrationType ?? undefined,
        externalCustomerId: integrationCustomer.externalCustomerId ?? '',
        syncWithProvider: integrationCustomer.syncWithProvider ?? false,
        ...('subsidiaryId' in integrationCustomer &&
        typeof integrationCustomer.subsidiaryId === 'string'
          ? { subsidiaryId: integrationCustomer.subsidiaryId }
          : {}),
        ...('targetedObject' in integrationCustomer && integrationCustomer.targetedObject
          ? { targetedObject: integrationCustomer.targetedObject }
          : {}),
      },
    ]
  })
}

export const mapFromApiToForm = (
  customer: AddCustomerDrawerFragment | undefined,
  defaultBillingEntity: BillingEntityItem | undefined,
): CreateCustomerDefaultValues => {
  const compareBillingAddressWithShippingAddress = () => {
    if (!customer) return false
    const billingAddress = [
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.state,
      customer.zipcode,
      customer.country,
    ]
    const shippingAddress = [
      customer.shippingAddress?.addressLine1,
      customer.shippingAddress?.addressLine2,
      customer.shippingAddress?.city,
      customer.shippingAddress?.state,
      customer.shippingAddress?.zipcode,
      customer.shippingAddress?.country,
    ]

    return billingAddress.every((value, index) => value === shippingAddress[index])
  }

  return {
    customerType: customer?.customerType ?? undefined,
    // is partner is only used for display purpose and should not be sent to API
    isPartner: customer?.accountType === CustomerAccountTypeEnum.Partner,
    name: customer?.name ?? '',
    firstname: customer?.firstname ?? '',
    lastname: customer?.lastname ?? '',
    externalId: customer?.externalId ?? '',
    externalSalesforceId: customer?.externalSalesforceId ?? '',
    legalName: customer?.legalName ?? '',
    legalNumber: customer?.legalNumber ?? '',
    taxIdentificationNumber: customer?.taxIdentificationNumber ?? '',
    currency: customer?.currency ?? undefined,
    phone: customer?.phone ?? '',
    email: customer?.email ?? undefined,
    billingAddress: {
      addressLine1: customer?.addressLine1 ?? '',
      addressLine2: customer?.addressLine2 ?? '',
      state: customer?.state ?? '',
      country: customer?.country ?? null,
      city: customer?.city ?? '',
      zipcode: customer?.zipcode ?? '',
    },
    isShippingEqualBillingAddress: compareBillingAddressWithShippingAddress(),
    shippingAddress: {
      addressLine1: customer?.shippingAddress?.addressLine1 ?? '',
      addressLine2: customer?.shippingAddress?.addressLine2 ?? '',
      city: customer?.shippingAddress?.city ?? '',
      state: customer?.shippingAddress?.state ?? '',
      zipcode: customer?.shippingAddress?.zipcode ?? '',
      country: customer?.shippingAddress?.country ?? null,
    },
    timezone: customer?.timezone ?? undefined,
    url: customer?.url ?? undefined,
    integrationCustomers: mapIntegrationCustomers(customer),
    paymentProviderCustomers: mapPaymentProviderCustomers(customer),
    metadata:
      customer?.metadata?.map((meta) => ({
        id: meta.id,
        key: meta.key,
        value: meta.value,
        displayInInvoice: meta.displayInInvoice ?? false,
      })) ?? [],
    billingEntityCode: customer?.billingEntity?.code ?? defaultBillingEntity?.value ?? undefined,
  }
}
