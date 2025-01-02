import { FormikProps } from 'formik'

import {
  AnrokIntegration,
  CreateCustomerInput,
  GetAccountingIntegrationsForExternalAppsAccordionQuery,
  GetCrmIntegrationsForExternalAppsAccordionQuery,
  GetTaxIntegrationsForExternalAppsAccordionQuery,
  HubspotIntegration,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  SalesforceIntegration,
  UpdateCustomerInput,
  XeroIntegration,
} from '~/generated/graphql'

type SupportedIntegration =
  | NetsuiteIntegration
  | XeroIntegration
  | AnrokIntegration
  | HubspotIntegration
  | SalesforceIntegration

const integrationTypeToTypename: Partial<Record<IntegrationTypeEnum, string>> = {
  // Account integrations
  [IntegrationTypeEnum.Netsuite]: 'NetsuiteIntegration',
  [IntegrationTypeEnum.Xero]: 'XeroIntegration',
  // Tax integrations
  [IntegrationTypeEnum.Anrok]: 'AnrokIntegration',
  // CRM integrations
  [IntegrationTypeEnum.Hubspot]: 'HubspotIntegration',
  [IntegrationTypeEnum.Salesforce]: 'SalesforceIntegration',
}

export const getIntegration = <T extends SupportedIntegration>({
  integrationType,
  formikProps,
  allIntegrationsData,
}: {
  integrationType: IntegrationTypeEnum
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  allIntegrationsData?:
    | GetAccountingIntegrationsForExternalAppsAccordionQuery
    | GetTaxIntegrationsForExternalAppsAccordionQuery
    | GetCrmIntegrationsForExternalAppsAccordionQuery
}) => {
  // Check if the customer already has an integration of the same type
  const hadInitialIntegrationCustomer = !!formikProps.initialValues.integrationCustomers?.find(
    (i) => i.integrationType === integrationType,
  )

  // Get the selected integration and its index in the integrationCustomers array
  const selectedIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === integrationType,
    ) || 0
  const selectedIntegration = formikProps.values.integrationCustomers?.[selectedIntegrationIndex]
  const integrationPointerInIntegrationCustomer = `integrationCustomers.${selectedIntegrationIndex}`

  // Get all integrations of the same type
  const allIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === integrationTypeToTypename[integrationType],
  ) as T[] | undefined

  // Get the selected integration settings
  const selectedIntegrationSettings = allIntegrations?.find(
    (i) => i.code === selectedIntegration?.integrationCode,
  ) as T

  return {
    hadInitialIntegrationCustomer,
    selectedIntegration,
    allIntegrations,
    selectedIntegrationSettings,
    integrationPointerInIntegrationCustomer,
  }
}

export const scrollToIntegration = (selector: string) => {
  return setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement

    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.click()
  }, 1)
}
