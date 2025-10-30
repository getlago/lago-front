import { CustomerMainInfosFragment } from '~/generated/graphql'

export const createMockCustomerDetails = (
  overrides: Partial<CustomerMainInfosFragment> = {},
): CustomerMainInfosFragment => {
  return {
    name: 'John Doe',
    firstname: 'Jonathan',
    lastname: 'Doe',
    customerType: 'Individual',
    addressLine1: 'Via Toledo',
    city: 'Napoli',
    country: 'Italy',
    metadata: [
      { id: '1', key: 'Custom Field 1', value: 'Value 1' },
      { id: '2', key: 'Custom Field 2', value: 'Value 2' },
    ],
    billingEntity: { name: 'Entity 1', code: 'E1' },
    externalId: 'EXT123',
    externalSalesforceId: 'SF123',
    currency: 'EUR',
    legalName: 'Napoli Legal Name',
    legalNumber: '123456789',
    taxIdentificationNumber: 'IT123456789',
    email: 'john.doe@example.com',
    url: 'https://example.com',
    phone: '+390812345678',
    addressLine2: 'Apartment 5B',
    state: 'Campania',
    zipcode: '80100',
    shippingAddress: {
      addressLine1: 'Corso Umberto I',
      addressLine2: 'Building A',
      city: 'Napoli',
      state: 'Campania',
      country: 'Italy',
      zipcode: '80133',
    },
    ...overrides,
  } as unknown as CustomerMainInfosFragment
}
