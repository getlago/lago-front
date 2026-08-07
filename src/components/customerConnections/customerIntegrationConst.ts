import { IntegrationTypeEnum, ProviderTypeEnum } from '~/generated/graphql'

/**
 * Payment providers with no provider-customer mapping: they neither accept an
 * existing provider customer id nor sync one back, so the id is always empty
 * for them and every surface dealing with it has to skip them.
 */
export const PROVIDERS_WITHOUT_CUSTOMER_MAPPING: ReadonlySet<ProviderTypeEnum> = new Set([
  ProviderTypeEnum.Cashfree,
  ProviderTypeEnum.Flutterwave,
])

export const integrationTypeToTypename: Partial<Record<IntegrationTypeEnum, string>> = {
  // Account integrations
  [IntegrationTypeEnum.Netsuite]: 'NetsuiteIntegration',
  [IntegrationTypeEnum.Xero]: 'XeroIntegration',
  // Tax integrations
  [IntegrationTypeEnum.Anrok]: 'AnrokIntegration',
  [IntegrationTypeEnum.Avalara]: 'AvalaraIntegration',
  // CRM integrations
  [IntegrationTypeEnum.Hubspot]: 'HubspotIntegration',
  [IntegrationTypeEnum.Salesforce]: 'SalesforceIntegration',
}
