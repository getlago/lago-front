import {
  AddCustomerDrawerFragment,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  ProviderPaymentMethodsEnum,
} from '~/generated/graphql'

import { BillingEntityItem } from './types'
import { CreateCustomerDefaultValues } from './validationSchema'

export const getDefaultValues = (
  customer: AddCustomerDrawerFragment | undefined,
  defaultBillingEntity: BillingEntityItem | undefined,
): CreateCustomerDefaultValues => {
  const getCustomerProviderMethod = () => {
    if (!customer?.providerCustomer?.providerPaymentMethods?.length) {
      return customer?.currency !== CurrencyEnum.Eur
        ? [ProviderPaymentMethodsEnum.Card]
        : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit]
    }
    return customer?.providerCustomer?.providerPaymentMethods
  }

  return {
    customerType: customer?.customerType ?? null,
    // is partner is only used for display purpose and should not be sent to API
    isPartner: customer?.accountType === CustomerAccountTypeEnum.Partner,
    accountType:
      customer?.accountType === CustomerAccountTypeEnum.Partner
        ? CustomerAccountTypeEnum.Partner
        : null,
    name: customer?.name ?? '',
    firstname: customer?.firstname ?? '',
    lastname: customer?.lastname ?? '',
    externalId: customer?.externalId ?? '',
    externalSalesforceId: customer?.externalSalesforceId ?? '',
    legalName: customer?.legalName ?? '',
    legalNumber: customer?.legalNumber ?? '',
    taxIdentificationNumber: customer?.taxIdentificationNumber ?? '',
    currency: customer?.currency ?? null,
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    addressLine1: customer?.addressLine1 ?? '',
    addressLine2: customer?.addressLine2 ?? '',
    state: customer?.state ?? '',
    country: customer?.country ?? null,
    city: customer?.city ?? '',
    zipcode: customer?.zipcode ?? '',
    shippingAddress: customer?.shippingAddress ?? {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipcode: '',
      country: customer?.shippingAddress?.country ?? null,
    },
    timezone: customer?.timezone ?? null,
    url: customer?.url ?? '',
    integrationCustomers: [
      ...(!!customer?.netsuiteCustomer ? [customer?.netsuiteCustomer] : []),
      ...(!!customer?.avalaraCustomer ? [customer?.avalaraCustomer] : []),
      ...(!!customer?.anrokCustomer ? [customer?.anrokCustomer] : []),
      ...(!!customer?.xeroCustomer ? [customer?.xeroCustomer] : []),
      ...(!!customer?.hubspotCustomer ? [customer?.hubspotCustomer] : []),
      ...(!!customer?.salesforceCustomer ? [customer?.salesforceCustomer] : []),
    ],
    paymentProviderCode: customer?.paymentProviderCode ?? '',
    providerCustomer: {
      providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? '',
      syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
      providerPaymentMethods: getCustomerProviderMethod(),
    },
    paymentProvider: customer?.paymentProvider ?? null,
    metadata: customer?.metadata?.map((meta) => ({ key: meta.key, value: meta.value })) ?? [],
    billingEntityCode: customer?.billingEntity?.code ?? defaultBillingEntity?.value ?? null,
  }
}
