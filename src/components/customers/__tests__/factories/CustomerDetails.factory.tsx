import {
  CustomerMainInfosFragment,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
} from '~/generated/graphql'

export const createMockCustomerDetails = (
  overrides: Partial<CustomerMainInfosFragment> = {},
): CustomerMainInfosFragment => {
  return {
    __typename: 'Customer',
    id: 'cust_001',
    name: 'John Doe',
    firstname: 'Jonathan',
    lastname: 'Doe',
    customerType: 'Individual',
    addressLine1: 'Via Toledo',
    addressLine2: 'Apartment 5B',
    city: 'Napoli',
    state: 'Campania',
    country: 'IT',
    zipcode: '80100',
    url: 'https://example.com',
    phone: '+390812345678',
    email: 'john.doe@example.com',
    externalId: 'EXT123',
    externalSalesforceId: 'SF123',
    legalName: 'Napoli Legal Name',
    legalNumber: '123456789',
    taxIdentificationNumber: 'IT123456789',
    currency: 'EUR',
    paymentProvider: 'stripe',
    paymentProviderCode: 'stripe',
    timezone: 'Europe/Rome',
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'billing-entity-1',
      name: 'Entity 1',
      code: 'E1',
    },
    metadata: [
      { __typename: 'CustomerMetadata', id: '1', key: 'Custom Field 1', value: 'Value 1' },
      { __typename: 'CustomerMetadata', id: '2', key: 'Custom Field 2', value: 'Value 2' },
    ],
    shippingAddress: {
      __typename: 'CustomerAddress',
      addressLine1: 'Corso Umberto I',
      addressLine2: 'Building A',
      city: 'Napoli',
      state: 'Campania',
      country: 'IT',
      zipcode: '80133',
    },
    // One connection per category (the cap of this milestone): tax, accounting, CRM
    integrationCustomers: [
      {
        __typename: 'AnrokCustomer',
        id: 'anrok_001',
        integrationId: 'AnrokIntegration',
        integrationType: IntegrationTypeEnum.Anrok,
        integrationCode: 'anrok',
        externalCustomerId: 'ext_anrok_001',
      },
      {
        __typename: 'NetsuiteCustomer',
        id: 'netsuite_001',
        integrationId: 'NetsuiteIntegration',
        integrationType: IntegrationTypeEnum.Netsuite,
        integrationCode: 'netsuite',
        externalCustomerId: 'ext_netsuite_001',
      },
      {
        __typename: 'HubspotCustomer',
        id: 'hubspot_001',
        integrationId: 'HubspotIntegration',
        integrationType: IntegrationTypeEnum.Hubspot,
        integrationCode: 'hubspot',
        externalCustomerId: 'ext_hubspot_001',
        targetedObject: 'COMPANY',
      },
    ],
    paymentProviderCustomers: [
      {
        __typename: 'ProviderCustomer',
        id: 'prov_cust_001',
        code: 'stripe',
        isDefault: true,
        providerCustomerId: 'ProviderCustomer',
        providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
      },
    ],
    ...overrides,
  } as unknown as CustomerMainInfosFragment
}
