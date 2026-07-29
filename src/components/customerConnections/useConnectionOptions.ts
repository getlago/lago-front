import { useMemo } from 'react'

import { paymentAvatarMapping } from '~/components/avatarMappings'
import { ConnectionComboBoxDataItem } from '~/components/customerConnections/ConnectionComboBox'
import { getAllIntegrationForAnIntegrationType } from '~/components/customerConnections/getAllIntegrationForAnIntegrationType'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useAccountingProviders } from '~/components/customerConnections/useAccountingProviders'
import { useCrmProviders } from '~/components/customerConnections/useCrmProviders'
import { usePaymentProviders } from '~/components/customerConnections/usePaymentProviders'
import { useTaxProviders } from '~/components/customerConnections/useTaxProviders'
import {
  AnrokIntegration,
  AvalaraIntegration,
  HubspotIntegration,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  PaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery,
  ProviderTypeEnum,
  SalesforceIntegration,
  XeroIntegration,
} from '~/generated/graphql'

type UseConnectionOptionsReturn = {
  connectionOptions: Partial<Record<ConnectionCategory, ConnectionComboBoxDataItem[]>>
  paymentProviders: PaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery | undefined
  getPaymentProvider: (code: string | undefined) => ProviderTypeEnum | null
  allAccountingIntegrations: (NetsuiteIntegration | XeroIntegration)[]
  allTaxIntegrations: (AnrokIntegration | AvalaraIntegration)[]
  allCrmIntegrations: (HubspotIntegration | SalesforceIntegration)[]
  isLoading: boolean
}

/**
 * Org-level connection options shared by every surface mounting the customer
 * connection drawer (customer create/edit accordion, customer information
 * master-detail): the four provider/integration queries, flattened per-type
 * integration lists and the drawer's provider-select options.
 */
export const useConnectionOptions = (): UseConnectionOptionsReturn => {
  const { paymentProviders, getPaymentProvider, isLoadingPaymentProviders } = usePaymentProviders()
  const { accountingProviders, isLoadingAccountProviders } = useAccountingProviders()
  const { taxProviders, isLoadingTaxProviders } = useTaxProviders()
  const { crmProviders, isLoadingCrmProviders } = useCrmProviders()

  const allAccountingIntegrations = useMemo(
    () => [
      ...(getAllIntegrationForAnIntegrationType<NetsuiteIntegration>({
        integrationType: IntegrationTypeEnum.Netsuite,
        allIntegrationsData: accountingProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<XeroIntegration>({
        integrationType: IntegrationTypeEnum.Xero,
        allIntegrationsData: accountingProviders,
      }) || []),
    ],
    [accountingProviders],
  )

  const allTaxIntegrations = useMemo(
    () => [
      ...(getAllIntegrationForAnIntegrationType<AnrokIntegration>({
        integrationType: IntegrationTypeEnum.Anrok,
        allIntegrationsData: taxProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<AvalaraIntegration>({
        integrationType: IntegrationTypeEnum.Avalara,
        allIntegrationsData: taxProviders,
      }) || []),
    ],
    [taxProviders],
  )

  const allCrmIntegrations = useMemo(
    () => [
      ...(getAllIntegrationForAnIntegrationType<HubspotIntegration>({
        integrationType: IntegrationTypeEnum.Hubspot,
        allIntegrationsData: crmProviders,
      }) || []),
      ...(getAllIntegrationForAnIntegrationType<SalesforceIntegration>({
        integrationType: IntegrationTypeEnum.Salesforce,
        allIntegrationsData: crmProviders,
      }) || []),
    ],
    [crmProviders],
  )

  const connectionOptions: Partial<Record<ConnectionCategory, ConnectionComboBoxDataItem[]>> =
    useMemo(
      () => ({
        [ConnectionCategory.Payment]: (paymentProviders?.paymentProviders?.collection || []).map(
          (provider) => ({
            value: provider.code,
            label: provider.name,
            subLabel: provider.code,
            group: provider.__typename.toLocaleLowerCase().replace('provider', ''),
            icon: paymentAvatarMapping[
              provider.__typename.toLocaleLowerCase().replace('provider', '') as ProviderTypeEnum
            ],
          }),
        ),
        [ConnectionCategory.Accounting]: allAccountingIntegrations.map((integration) => ({
          value: integration.code,
          label: integration.name,
          subLabel: integration.code,
          group: integration.__typename?.replace('Integration', '') || '',
        })),
        [ConnectionCategory.Tax]: allTaxIntegrations.map((integration) => ({
          value: integration.code,
          label: integration.name,
          subLabel: integration.code,
          group: integration.__typename?.replace('Integration', '') || '',
        })),
        [ConnectionCategory.Crm]: allCrmIntegrations.map((integration) => ({
          value: integration.code,
          label: integration.name,
          subLabel: integration.code,
          group: integration.__typename?.replace('Integration', '') || '',
        })),
      }),
      [
        paymentProviders?.paymentProviders?.collection,
        allAccountingIntegrations,
        allTaxIntegrations,
        allCrmIntegrations,
      ],
    )

  return {
    connectionOptions,
    paymentProviders,
    getPaymentProvider,
    allAccountingIntegrations,
    allTaxIntegrations,
    allCrmIntegrations,
    isLoading:
      isLoadingPaymentProviders ||
      isLoadingAccountProviders ||
      isLoadingTaxProviders ||
      isLoadingCrmProviders,
  }
}
