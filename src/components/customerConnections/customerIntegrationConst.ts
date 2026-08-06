import { IntegrationTypeEnum, ProviderTypeEnum } from '~/generated/graphql'

import { ConnectionCategory } from './types'

/**
 * Reserved code of the null-provider manual payment connection. The backend
 * also prepends a NON-persisted manual placeholder (id "<customerId>-manual")
 * to `paymentProviderCustomers` when the customer has no persisted manual row.
 */
export const MANUAL_CONNECTION_CODE = 'manual'

/** Category of each integration-customer type (payment providers are not integrations) */
export const INTEGRATION_TYPE_TO_CATEGORY: Partial<
  Record<IntegrationTypeEnum, ConnectionCategory>
> = {
  [IntegrationTypeEnum.Netsuite]: ConnectionCategory.Accounting,
  [IntegrationTypeEnum.Xero]: ConnectionCategory.Accounting,
  [IntegrationTypeEnum.Anrok]: ConnectionCategory.Tax,
  [IntegrationTypeEnum.Avalara]: ConnectionCategory.Tax,
  [IntegrationTypeEnum.Hubspot]: ConnectionCategory.Crm,
  [IntegrationTypeEnum.Salesforce]: ConnectionCategory.Crm,
}

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
