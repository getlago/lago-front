import {
  AddCustomerDrawerFragment,
  AnrokIntegration,
  AvalaraIntegration,
  GetAccountingIntegrationsForExternalAppsAccordionQuery,
  GetCrmIntegrationsForExternalAppsAccordionQuery,
  GetTaxIntegrationsForExternalAppsAccordionQuery,
  HubspotIntegration,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  SalesforceIntegration,
  XeroIntegration,
} from '~/generated/graphql'
import { getAllIntegrationForAnIntegrationType } from '~/pages/createCustomers/common/getAllIntegrationForAnIntegrationType'

type SupportedIntegration =
  | AnrokIntegration
  | AvalaraIntegration
  | HubspotIntegration
  | NetsuiteIntegration
  | SalesforceIntegration
  | XeroIntegration

type IntegrationCustomers =
  | AddCustomerDrawerFragment['xeroCustomer']
  | AddCustomerDrawerFragment['netsuiteCustomer']
  | AddCustomerDrawerFragment['anrokCustomer']
  | AddCustomerDrawerFragment['avalaraCustomer']
  | AddCustomerDrawerFragment['hubspotCustomer']
  | AddCustomerDrawerFragment['salesforceCustomer']

export const getIntegration = <T extends SupportedIntegration>({
  integrationType,
  integrationCustomers,
  allIntegrationsData,
}: {
  integrationType: IntegrationTypeEnum
  integrationCustomers: Array<IntegrationCustomers> | undefined
  allIntegrationsData?:
    | GetAccountingIntegrationsForExternalAppsAccordionQuery
    | GetTaxIntegrationsForExternalAppsAccordionQuery
    | GetCrmIntegrationsForExternalAppsAccordionQuery
}) => {
  // Check if the customer already has an integration of the same type
  const hadInitialIntegrationCustomer = !!integrationCustomers?.find(
    (i) => i?.integrationType === integrationType,
  )

  return {
    hadInitialIntegrationCustomer,
    allIntegrations: getAllIntegrationForAnIntegrationType<T>({
      integrationType,
      allIntegrationsData,
    }),
  }
}
