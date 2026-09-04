import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import {
  CreateCustomerInput,
  CustomerAccountTypeEnum,
  PaymentProviderCustomerInput,
  ProviderPaymentMethodsEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'

import { getIntegrationCustomers } from './getIntegrationCustomers'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchema'

type FormPaymentConnection = NonNullable<
  CreateCustomerDefaultValues['paymentProviderCustomers']
>[number]

const getEnabledProviderPaymentMethods = (
  providerPaymentMethods: Partial<Record<ProviderPaymentMethodsEnum, boolean>> | undefined,
): Array<ProviderPaymentMethodsEnum> => {
  return Object.entries(providerPaymentMethods || {}).reduce((acc, [method, isEnabled]) => {
    if (isEnabled) {
      acc.push(method as ProviderPaymentMethodsEnum)
    }
    return acc
  }, [] as Array<ProviderPaymentMethodsEnum>)
}

/** The provider-backed payment connection in the form, if any (never the manual row) */
const getProviderPaymentConnection = (
  values: CreateCustomerDefaultValues,
): FormPaymentConnection | undefined =>
  values.paymentProviderCustomers?.find((connection) => connection.code !== MANUAL_CONNECTION_CODE)

/**
 * The backend reconciles the array declaratively: rows omitted (matched by id)
 * are destroyed, rows with an id are updated in place, rows without are
 * created. Every persisted connection in the form model MUST therefore keep
 * its id — a provider row sent without it gets destroyed and recreated.
 */
const getPaymentProviderCustomers = (
  values: CreateCustomerDefaultValues,
): Array<PaymentProviderCustomerInput> => {
  // The manual connection is never submitted while the customer is capped at one
  // connection per type: the backend only persists a manual row when it receives
  // one, so leaving it out keeps today's payment behaviour untouched. Nothing is
  // destroyed by the omission either — the row the backend prepends to the read
  // payload is a non-persisted placeholder. Submitting it, together with the
  // default flag, belongs to the multi-connection phase.
  return (values.paymentProviderCustomers ?? [])
    .filter((connection) => connection.code !== MANUAL_CONNECTION_CODE)
    .map((connection) => ({
      id: connection.id,
      code: connection.code || null,
      // Omitted rather than blanked when unresolved: the backend writes every
      // key it receives onto the row, so an empty value would wipe the
      // provider of an existing connection
      ...(connection.providerType ? { paymentProvider: connection.providerType } : {}),
      ...(connection.providerCode ? { paymentProviderCode: connection.providerCode } : {}),
      providerCustomerId: connection.providerCustomerId || null,
      providerPaymentMethods: getEnabledProviderPaymentMethods(connection.providerPaymentMethods),
      syncWithProvider: connection.syncWithProvider ?? false,
    }))
}

export const mapFromFormToApi = (
  values: CreateCustomerDefaultValues,
): CreateCustomerInput | UpdateCustomerInput => {
  const formattedEmail = values.email
    ?.split(',')
    .map((mail) => mail.trim())
    .join(',')

  const providerPaymentConnection = getProviderPaymentConnection(values)

  return {
    email: formattedEmail,
    accountType: values.isPartner
      ? CustomerAccountTypeEnum.Partner
      : CustomerAccountTypeEnum.Customer,
    customerType: values.customerType,
    name: values.name,
    firstname: values.firstname,
    lastname: values.lastname,
    externalId: values.externalId,
    externalSalesforceId: values.externalSalesforceId,
    legalName: values.legalName,
    legalNumber: values.legalNumber,
    currency: values.currency,
    phone: values.phone,
    addressLine1: values.billingAddress?.addressLine1,
    addressLine2: values.billingAddress?.addressLine2,
    city: values.billingAddress?.city,
    state: values.billingAddress?.state,
    zipcode: values.billingAddress?.zipcode,
    country: values.billingAddress?.country ?? null,
    shippingAddress:
      values.shippingAddress && Object.values(values.shippingAddress).some((value) => !!value)
        ? { ...values.shippingAddress, country: values.shippingAddress.country ?? null }
        : null,
    timezone: values.timezone,
    url: values.url,
    // The customer-level provider scalars stay the source of provider identity
    // on read (`ProviderCustomer` carries none), and the backend assigns them
    // from these keys whether or not the array is sent. They must therefore
    // mirror the array's provider row: an explicit `null` on removal both
    // clears the code and discards the old link, and a switch re-points them
    // (the backend only self-assigns them when they are still blank).
    paymentProvider: providerPaymentConnection?.providerType ?? null,
    paymentProviderCode: providerPaymentConnection?.providerCode ?? null,
    paymentProviderCustomers: getPaymentProviderCustomers(values),
    metadata: values.metadata?.map((meta) => ({
      id: meta.id,
      key: meta.key,
      value: meta.value,
      displayInInvoice: meta.displayInInvoice || false,
    })),
    billingEntityCode: values.billingEntityCode,
    integrationCustomers: getIntegrationCustomers(values.integrationCustomers),
    taxIdentificationNumber: values.taxIdentificationNumber,
  }
}
