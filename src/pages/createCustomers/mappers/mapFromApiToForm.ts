import {
  AddCustomerDrawerFragment,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  ProviderPaymentMethodsEnum,
} from '~/generated/graphql'

import { BillingEntityItem } from './types'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchemaConst'

export const mapFromApiToForm = (
  customer: AddCustomerDrawerFragment | undefined,
  defaultBillingEntity: BillingEntityItem | undefined,
): CreateCustomerDefaultValues => {
  const getCustomerProviderMethod = () => {
    if (!customer?.providerCustomer?.providerPaymentMethods?.length) {
      return customer?.currency === CurrencyEnum.Eur
        ? { [ProviderPaymentMethodsEnum.Card]: true, [ProviderPaymentMethodsEnum.SepaDebit]: true }
        : { [ProviderPaymentMethodsEnum.Card]: true }
    }
    return customer?.providerCustomer?.providerPaymentMethods.reduce(
      (acc, method) => {
        acc[method] = true
        return acc
      },
      {} as Record<ProviderPaymentMethodsEnum, boolean>,
    )
  }

  // Should only have one between xero and netsuite
  const accountingProvider =
    [customer?.xeroCustomer, customer?.netsuiteCustomer].find(Boolean) || undefined

  // Should only have one between hubspot and salesforce
  const crmProvider =
    [customer?.hubspotCustomer, customer?.salesforceCustomer].find(Boolean) || undefined

  // Should only have one between anrok and avalara
  const taxProvider =
    [customer?.anrokCustomer, customer?.avalaraCustomer].find(Boolean) || undefined

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
    accountingProviderCode: accountingProvider?.integrationCode ?? '',
    accountingCustomer: {
      accountingCustomerId: accountingProvider?.externalCustomerId ?? '',
      syncWithProvider: accountingProvider?.syncWithProvider ?? false,
      subsidiaryId:
        accountingProvider &&
        'subsidiaryId' in accountingProvider &&
        typeof accountingProvider.subsidiaryId === 'string'
          ? accountingProvider.subsidiaryId
          : undefined,
    },
    crmProviderCode: crmProvider?.integrationCode ?? '',
    crmCustomer: {
      crmCustomerId: crmProvider?.externalCustomerId ?? '',
      syncWithProvider: crmProvider?.syncWithProvider ?? false,
    },
    taxProviderCode: taxProvider?.integrationCode ?? '',
    taxCustomer: {
      taxCustomerId: taxProvider?.externalCustomerId ?? '',
      syncWithProvider: taxProvider?.syncWithProvider ?? false,
    },
    paymentProviderCode: customer?.paymentProviderCode ?? '',
    paymentProviderCustomer: {
      providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? '',
      syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
      providerPaymentMethods: getCustomerProviderMethod(),
    },
    metadata: customer?.metadata?.map((meta) => ({ key: meta.key, value: meta.value })) ?? [],
    billingEntityCode: customer?.billingEntity?.code ?? defaultBillingEntity?.value ?? undefined,
  }
}
