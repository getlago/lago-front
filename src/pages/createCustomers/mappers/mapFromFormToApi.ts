import {
  CreateCustomerInput,
  CustomerAccountTypeEnum,
  GetAccountingIntegrationsForExternalAppsAccordionQuery,
  GetCrmIntegrationsForExternalAppsAccordionQuery,
  GetTaxIntegrationsForExternalAppsAccordionQuery,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'

import { getIntegrationCustomers } from './getIntegrationCustomers'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchemaConst'

type AdditionalData = {
  paymentProvider?: ProviderTypeEnum
  taxProviders?: GetTaxIntegrationsForExternalAppsAccordionQuery
  crmProviders?: GetCrmIntegrationsForExternalAppsAccordionQuery
  accountingProviders?: GetAccountingIntegrationsForExternalAppsAccordionQuery
}

export const mapFromFormToApi = (
  values: CreateCustomerDefaultValues,
  { paymentProvider, taxProviders, crmProviders, accountingProviders }: AdditionalData,
): CreateCustomerInput | UpdateCustomerInput => {
  const formattedEmail = values.email
    ?.split(',')
    .map((mail) => mail.trim())
    .join(',')

  const getProviderPaymentMethods = (): Array<ProviderPaymentMethodsEnum> => {
    return Object.entries(values.paymentProviderCustomer?.providerPaymentMethods || {}).reduce(
      (acc, [method, isEnabled]) => {
        if (isEnabled) {
          acc.push(method as ProviderPaymentMethodsEnum)
        }
        return acc
      },
      [] as Array<ProviderPaymentMethodsEnum>,
    )
  }

  const integrationCustomers = getIntegrationCustomers({
    taxProviderCode: values.taxProviderCode,
    accountingProviderCode: values.accountingProviderCode,
    crmProviderCode: values.crmProviderCode,
    taxProviders,
    accountingProviders,
    crmProviders,
    accountingCustomer: values.accountingCustomer,
    crmCustomer: values.crmCustomer,
    taxCustomer: values.taxCustomer,
  })

  return {
    email: formattedEmail,
    // onSave check this value. We need to define were we put default values
    accountType: values.isPartner ? CustomerAccountTypeEnum.Partner : null,
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
    country: values.billingAddress?.country,
    shippingAddress: values.shippingAddress,
    timezone: values.timezone,
    url: values.url,
    paymentProvider,
    paymentProviderCode: values.paymentProviderCode,
    providerCustomer: {
      providerCustomerId: values.paymentProviderCustomer?.providerCustomerId,
      syncWithProvider: values.paymentProviderCustomer?.syncWithProvider,
      providerPaymentMethods: getProviderPaymentMethods(),
    },
    metadata: values.metadata?.map((meta) => ({
      key: meta.key,
      value: meta.value,
      displayInInvoice: meta.displayInInvoice || false,
    })),
    billingEntityCode: values.billingEntityCode,
    integrationCustomers,
    taxIdentificationNumber: values.taxIdentificationNumber,
  }
}
