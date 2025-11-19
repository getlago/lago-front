import {
  AnrokIntegration,
  AvalaraIntegration,
  CreateCustomerInput,
  CustomerAccountTypeEnum,
  GetAccountingIntegrationsForExternalAppsAccordionQuery,
  GetCrmIntegrationsForExternalAppsAccordionQuery,
  GetTaxIntegrationsForExternalAppsAccordionQuery,
  HubspotIntegration,
  IntegrationCustomerInput,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  SalesforceIntegration,
  UpdateCustomerInput,
  XeroIntegration,
} from '~/generated/graphql'
import { getAllIntegrationForAnIntegrationType } from '~/pages/createCustomers/common/getAllIntegrationForAnIntegrationType'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchema'

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

  const getIntegrationCustomers = (): Array<IntegrationCustomerInput> | undefined => {
    const taxProviderCode = values.taxProviderCode
    const accountingProviderCode = values.accountingProviderCode
    const crmProviderCode = values.crmProviderCode

    if (!taxProviderCode && !accountingProviderCode && !crmProviderCode) {
      return undefined
    }

    // We need to do it this way because of strange typing coming from back
    const taxIntegrations = [
      ...(getAllIntegrationForAnIntegrationType<AnrokIntegration>({
        integrationType: IntegrationTypeEnum.Anrok,
        allIntegrationsData: taxProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<AvalaraIntegration>({
        integrationType: IntegrationTypeEnum.Avalara,
        allIntegrationsData: taxProviders,
      }) || []),
    ]

    const accountingIntegrations = [
      ...(getAllIntegrationForAnIntegrationType<NetsuiteIntegration>({
        integrationType: IntegrationTypeEnum.Netsuite,
        allIntegrationsData: accountingProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<XeroIntegration>({
        integrationType: IntegrationTypeEnum.Xero,
        allIntegrationsData: accountingProviders,
      }) || []),
    ]

    const crmIntegrations = [
      ...(getAllIntegrationForAnIntegrationType<HubspotIntegration>({
        integrationType: IntegrationTypeEnum.Hubspot,
        allIntegrationsData: crmProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<SalesforceIntegration>({
        integrationType: IntegrationTypeEnum.Salesforce,
        allIntegrationsData: crmProviders,
      }) || []),
    ]

    const taxProvider = taxIntegrations.find((integration) => integration.code === taxProviderCode)
    const accountingProvider = accountingIntegrations.find(
      (integration) => integration.code === accountingProviderCode,
    )
    const crmProvider = crmIntegrations.find((integration) => integration.code === crmProviderCode)

    if (!taxProvider && !accountingProvider && !crmProvider) {
      return undefined
    }

    const subsidiaryObject = values.accountingCustomer?.subsidiaryId
      ? { subsidiaryId: values.accountingCustomer?.subsidiaryId }
      : {}

    const targetObject = values.crmCustomer?.targetedObject
      ? { targetedObject: values.crmCustomer?.targetedObject }
      : {}

    return [
      ...(taxProvider
        ? [
            {
              integrationCode: taxProvider.code,
              integrationType: taxProvider.__typename
                ?.toLowerCase()
                .replace('integration', '') as IntegrationTypeEnum,
              syncWithProvider: values.taxCustomer?.syncWithProvider,
              externalCustomerId: values.taxCustomer?.taxCustomerId,
            },
          ]
        : []),
      ...(accountingProvider
        ? [
            {
              integrationCode: accountingProvider.code,
              integrationType: accountingProvider.__typename
                ?.toLowerCase()
                .replace('integration', '') as IntegrationTypeEnum,
              syncWithProvider: values.accountingCustomer?.syncWithProvider,
              externalCustomerId: values.accountingCustomer?.accountingCustomerId,
              ...subsidiaryObject,
            },
          ]
        : []),
      ...(crmProvider
        ? [
            {
              integrationCode: crmProvider.code,
              integrationType: crmProvider.__typename
                ?.toLowerCase()
                .replace('integration', '') as IntegrationTypeEnum,
              syncWithProvider: values.crmCustomer?.syncWithProvider,
              externalCustomerId: values.crmCustomer?.crmCustomerId,
              ...targetObject,
            },
          ]
        : []),
    ]
  }

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
    integrationCustomers: getIntegrationCustomers(),
  }
}
