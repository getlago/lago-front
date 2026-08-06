import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  AddCustomerDrawerFragment,
  CountryCode,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  CustomerTypeEnum,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'

import {
  CreateCustomerDefaultValues,
  emptyCreateCustomerDefaultValues,
} from '../../formInitialization/validationSchema'
import { mapFromApiToForm } from '../mapFromApiToForm'
import { mapFromFormToApi } from '../mapFromFormToApi'
import { BillingEntityItem } from '../types'

const CUSTOMER_ID = 'customer-1'
const MANUAL_PLACEHOLDER_ID = `${CUSTOMER_ID}-manual`
const PERSISTED_MANUAL_ID = 'a3f6c1d2-1111-4a2b-9c3d-000000000001'
const PERSISTED_PAYMENT_ID = 'a3f6c1d2-2222-4a2b-9c3d-000000000002'

const mockDefaultBillingEntity: BillingEntityItem = {
  label: 'Default Entity',
  value: 'default-entity',
  isDefault: true,
}

const buildCustomer = (
  overrides: Partial<AddCustomerDrawerFragment> = {},
): AddCustomerDrawerFragment => ({
  __typename: 'Customer',
  id: CUSTOMER_ID,
  customerType: CustomerTypeEnum.Company,
  accountType: CustomerAccountTypeEnum.Customer,
  name: 'Acme Corporation',
  firstname: 'John',
  lastname: 'Doe',
  externalId: 'ext-123',
  externalSalesforceId: 'sf-456',
  legalName: 'Acme Corporation Inc.',
  legalNumber: 'LN-789',
  taxIdentificationNumber: 'TIN-012',
  currency: CurrencyEnum.Usd,
  phone: '+1-555-0123',
  email: 'john@example.com',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  state: 'CA',
  country: CountryCode.Us,
  city: 'San Francisco',
  zipcode: '94105',
  shippingAddress: null,
  timezone: TimezoneEnum.TzAmericaLosAngeles,
  url: 'https://example.com',
  paymentProvider: undefined,
  paymentProviderCode: undefined,
  paymentProviderCustomers: [],
  integrationCustomers: [],
  metadata: [],
  billingEntity: {
    __typename: 'BillingEntity',
    id: 'billing-entity-1',
    code: 'default-entity',
    name: 'Default Entity',
    euTaxManagement: false,
  },
  canEditAttributes: true,
  applicableTimezone: TimezoneEnum.TzAmericaLosAngeles,
  ...overrides,
})

describe('mapFromFormToApi', () => {
  describe('GIVEN basic customer form values', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should map every basic field and emit both connection arrays', () => {
        const formValues: CreateCustomerDefaultValues = {
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          name: 'John Doe',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          currency: CurrencyEnum.Usd,
          timezone: TimezoneEnum.TzAmericaNewYork,
          url: 'https://example.com',
          legalName: 'John Doe Inc.',
          legalNumber: '123456789',
        }

        const result = mapFromFormToApi(formValues)

        expect(result).toEqual({
          externalId: 'customer-123',
          name: 'John Doe',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          currency: CurrencyEnum.Usd,
          timezone: TimezoneEnum.TzAmericaNewYork,
          url: 'https://example.com',
          legalName: 'John Doe Inc.',
          legalNumber: '123456789',
          accountType: CustomerAccountTypeEnum.Customer,
          customerType: undefined,
          externalSalesforceId: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipcode: '',
          country: null,
          shippingAddress: null,
          paymentProvider: null,
          paymentProviderCode: null,
          paymentProviderCustomers: [],
          integrationCustomers: [],
          metadata: [],
          billingEntityCode: undefined,
          taxIdentificationNumber: '',
        })
      })

      it('THEN should not emit the legacy providerCustomer object', () => {
        const formValues: CreateCustomerDefaultValues = {
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              id: PERSISTED_PAYMENT_ID,
              code: 'stripe_1',
              isDefault: true,
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: 'cus_stripe123',
              syncWithProvider: true,
              providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
            },
          ],
        }

        const result = mapFromFormToApi(formValues)

        expect(result).not.toHaveProperty('providerCustomer')
      })

      // The customer-level scalars remain the only provider identity available
      // on read, and the backend assigns them from these keys even when the
      // array is sent — so they must mirror the array's provider row
      it('THEN should mirror the provider row in the customer-level payment scalars', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              id: PERSISTED_PAYMENT_ID,
              code: 'stripe_1',
              isDefault: true,
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: 'cus_stripe123',
            },
          ],
        })

        expect(result.paymentProvider).toBe(ProviderTypeEnum.Stripe)
        expect(result.paymentProviderCode).toBe('stripe_1')
      })

      it('THEN should null the customer-level payment scalars when the provider connection is removed', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [],
        })

        expect(result.paymentProvider).toBeNull()
        expect(result.paymentProviderCode).toBeNull()
      })

      it('THEN should null the customer-level payment scalars when only a manual row remains', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            { id: 'manual-row-id', code: MANUAL_CONNECTION_CODE, isDefault: true },
          ],
        })

        expect(result.paymentProvider).toBeNull()
        expect(result.paymentProviderCode).toBeNull()
      })

      it('THEN should re-point the customer-level payment scalars to the new provider on a switch', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          // A switch drops the old row's id, so the backend creates a new link
          paymentProviderCustomers: [
            {
              providerCode: 'adyen_1',
              providerType: ProviderTypeEnum.Adyen,
              providerCustomerId: 'cus_adyen',
            },
          ],
        })

        expect(result.paymentProvider).toBe(ProviderTypeEnum.Adyen)
        expect(result.paymentProviderCode).toBe('adyen_1')
      })

      // Cashfree/Flutterwave never have a provider customer id, so the backend
      // creates no connection row: the customer-level scalars are the only
      // record of the connection and must still be sent
      it('THEN should still emit the customer-level payment scalars for a provider with no customer mapping', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'cashfree_1',
              providerType: ProviderTypeEnum.Cashfree,
              providerCustomerId: '',
              syncWithProvider: false,
            },
          ],
        })

        expect(result.paymentProvider).toBe(ProviderTypeEnum.Cashfree)
        expect(result.paymentProviderCode).toBe('cashfree_1')
      })

      it('THEN should map the partner account type when isPartner is true', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'partner-123',
          isPartner: true,
          customerType: CustomerTypeEnum.Company,
        })

        expect(result.accountType).toBe(CustomerAccountTypeEnum.Partner)
        expect(result.customerType).toBe(CustomerTypeEnum.Company)
      })

      it('THEN should map the customer account type when isPartner is false', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          isPartner: false,
        })

        expect(result.accountType).toBe(CustomerAccountTypeEnum.Customer)
      })
    })
  })

  describe('GIVEN email form values', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should trim a single email address', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          email: ' john@example.com ',
        })

        expect(result.email).toBe('john@example.com')
      })

      it('THEN should trim and join a comma-separated list of email addresses', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          email: 'contact@acme.com, billing@acme.com',
        })

        expect(result.email).toBe('contact@acme.com,billing@acme.com')
      })

      it('THEN should keep an undefined email undefined', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          email: undefined,
        })

        expect(result.email).toBeUndefined()
      })
    })
  })

  describe('GIVEN a billing address', () => {
    describe('WHEN mapping it to the mutation input', () => {
      it('THEN should flatten the complete billing address onto the input', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          billingAddress: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            zipcode: '10001',
            country: CountryCode.Us,
          },
        })

        expect(result.addressLine1).toBe('123 Main St')
        expect(result.addressLine2).toBe('Apt 4B')
        expect(result.city).toBe('New York')
        expect(result.state).toBe('NY')
        expect(result.zipcode).toBe('10001')
        expect(result.country).toBe(CountryCode.Us)
      })

      it('THEN should leave the address fields undefined when the billing address is undefined', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          billingAddress: undefined,
        })

        expect(result.addressLine1).toBeUndefined()
        expect(result.addressLine2).toBeUndefined()
        expect(result.city).toBeUndefined()
        expect(result.state).toBeUndefined()
        expect(result.zipcode).toBeUndefined()
        expect(result.country).toBeNull()
      })

      it('THEN should map an undefined billing country to null so the combobox can be cleared', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          billingAddress: {
            addressLine1: '123 Main St',
            addressLine2: '',
            city: 'New York',
            state: 'NY',
            zipcode: '10001',
            country: undefined,
          },
        })

        expect(result.country).toBeNull()
      })
    })
  })

  describe('GIVEN a shipping address', () => {
    describe('WHEN mapping it to the mutation input', () => {
      it('THEN should map the shipping address as a nested object', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          shippingAddress: {
            addressLine1: '456 Oak Ave',
            addressLine2: 'Suite 200',
            city: 'Los Angeles',
            state: 'CA',
            zipcode: '90210',
            country: CountryCode.Us,
          },
        })

        expect(result.shippingAddress).toEqual({
          addressLine1: '456 Oak Ave',
          addressLine2: 'Suite 200',
          city: 'Los Angeles',
          state: 'CA',
          zipcode: '90210',
          country: CountryCode.Us,
        })
      })

      it('THEN should map an undefined shipping country to null so the combobox can be cleared', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          shippingAddress: {
            addressLine1: '456 Oak Ave',
            addressLine2: '',
            city: 'Los Angeles',
            state: 'CA',
            zipcode: '90210',
            country: undefined,
          },
        })

        expect(result.shippingAddress?.country).toBeNull()
      })

      it('THEN should null the whole shipping address when every field is empty', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          shippingAddress: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipcode: '',
            country: null,
          },
        })

        expect(result.shippingAddress).toBeNull()
      })
    })
  })

  describe('GIVEN payment connection form rows', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should map a provider row keeping its id and the enabled payment methods', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              id: PERSISTED_PAYMENT_ID,
              code: 'stripe_1',
              isDefault: true,
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: 'cus_stripe123',
              syncWithProvider: true,
              providerPaymentMethods: {
                [ProviderPaymentMethodsEnum.Card]: true,
                [ProviderPaymentMethodsEnum.SepaDebit]: false,
                [ProviderPaymentMethodsEnum.UsBankAccount]: true,
              },
            },
          ],
        })

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: PERSISTED_PAYMENT_ID,
            code: 'stripe_1',
            isDefault: true,
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            providerCustomerId: 'cus_stripe123',
            providerPaymentMethods: [
              ProviderPaymentMethodsEnum.Card,
              ProviderPaymentMethodsEnum.UsBankAccount,
            ],
            syncWithProvider: true,
          },
        ])
      })

      it('THEN should default the row code to the provider code when the row has none', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
            },
          ],
        })

        expect(result.paymentProviderCustomers?.[0]?.code).toBe('stripe_1')
        expect(result.paymentProviderCustomers?.[0]?.isDefault).toBe(false)
      })

      it('THEN should null an empty providerCustomerId', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: '',
            },
          ],
        })

        expect(result.paymentProviderCustomers?.[0]?.providerCustomerId).toBeNull()
      })

      it('THEN should emit an empty payment methods array when none is enabled', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe_1',
              providerType: ProviderTypeEnum.Stripe,
              providerPaymentMethods: {},
            },
          ],
        })

        expect(result.paymentProviderCustomers?.[0]?.providerPaymentMethods).toEqual([])
      })

      it('THEN should emit an empty array when the customer has no payment connection', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          paymentProviderCustomers: [],
        })

        expect(result.paymentProviderCustomers).toEqual([])
      })
    })
  })

  describe('GIVEN integration connection form rows', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should map one input item per category keeping every id', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          integrationCustomers: [
            {
              id: 'anrok-1',
              category: ConnectionCategory.Tax,
              providerCode: 'anrok_1',
              providerType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'tax-123',
              syncWithProvider: true,
            },
            {
              id: 'netsuite-1',
              category: ConnectionCategory.Accounting,
              providerCode: 'netsuite_1',
              providerType: IntegrationTypeEnum.Netsuite,
              externalCustomerId: 'accounting-123',
              syncWithProvider: false,
              subsidiaryId: 'subsidiary-1',
            },
            {
              id: 'hubspot-1',
              category: ConnectionCategory.Crm,
              providerCode: 'hubspot_1',
              providerType: IntegrationTypeEnum.Hubspot,
              externalCustomerId: 'crm-123',
              syncWithProvider: true,
              targetedObject: HubspotTargetedObjectsEnum.Companies,
            },
          ],
        })

        expect(result.integrationCustomers).toEqual([
          {
            id: 'anrok-1',
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'tax-123',
            syncWithProvider: true,
          },
          {
            id: 'netsuite-1',
            integrationCode: 'netsuite_1',
            integrationType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'accounting-123',
            syncWithProvider: false,
            subsidiaryId: 'subsidiary-1',
          },
          {
            id: 'hubspot-1',
            integrationCode: 'hubspot_1',
            integrationType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'crm-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          },
        ])
      })

      it('THEN should emit an empty array when the customer has no integration connection', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          integrationCustomers: [],
        })

        expect(result.integrationCustomers).toEqual([])
      })
    })
  })

  describe('GIVEN metadata form values', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should map every metadata row and default displayInInvoice to false', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          metadata: [
            { key: 'department', value: 'Engineering', displayInInvoice: true, id: 'meta-1' },
            { key: 'project', value: 'Project X', displayInInvoice: false, id: 'meta-2' },
            { key: 'manager', value: 'John Smith', id: 'meta-3' },
          ],
        })

        expect(result.metadata).toEqual([
          { key: 'department', value: 'Engineering', displayInInvoice: true, id: 'meta-1' },
          { key: 'project', value: 'Project X', displayInInvoice: false, id: 'meta-2' },
          { key: 'manager', value: 'John Smith', displayInInvoice: false, id: 'meta-3' },
        ])
      })

      it('THEN should keep undefined metadata undefined', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          // @ts-expect-error Testing undefined metadata even tho it should be an empty array
          metadata: undefined,
        })

        expect(result.metadata).toBeUndefined()
      })
    })
  })

  describe('GIVEN a billing entity code', () => {
    describe('WHEN mapping it to the mutation input', () => {
      it('THEN should forward the billing entity code', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'customer-123',
          billingEntityCode: 'entity-1',
        })

        expect(result.billingEntityCode).toBe('entity-1')
      })
    })
  })

  describe('GIVEN edge-case form values', () => {
    describe('WHEN mapping them to the mutation input', () => {
      it('THEN should map minimal form data', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'minimal-123',
        })

        expect(result.externalId).toBe('minimal-123')
        expect(result.accountType).toBe(CustomerAccountTypeEnum.Customer)
        expect(result.paymentProviderCustomers).toEqual([])
        expect(result.integrationCustomers).toEqual([])
      })

      it('THEN should forward empty strings as-is', () => {
        const result = mapFromFormToApi({
          ...emptyCreateCustomerDefaultValues,
          externalId: 'empty-test-123',
          name: '',
          email: '',
          phone: '',
          url: '',
        })

        expect(result.name).toBe('')
        expect(result.email).toBe('')
        expect(result.phone).toBe('')
        expect(result.url).toBe('')
      })
    })
  })

  describe('GIVEN a customer edited through the form', () => {
    describe('WHEN piping it through mapFromApiToForm then mapFromFormToApi', () => {
      it('THEN should round-trip the persisted payment connection id from API to form to API', () => {
        const customer = buildCustomer({
          currency: CurrencyEnum.Eur,
          paymentProvider: ProviderTypeEnum.Stripe,
          paymentProviderCode: 'stripe_1',
          paymentProviderCustomers: [
            {
              __typename: 'ProviderCustomer',
              id: PERSISTED_PAYMENT_ID,
              code: 'stripe_1',
              isDefault: true,
              providerCustomerId: 'cus_12345',
              syncWithProvider: true,
              providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
            },
          ],
        })

        const formValues = mapFromApiToForm(customer, mockDefaultBillingEntity)

        expect(formValues.paymentProviderCustomers?.[0]?.id).toBe(PERSISTED_PAYMENT_ID)

        const result = mapFromFormToApi(formValues)

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: PERSISTED_PAYMENT_ID,
            code: 'stripe_1',
            isDefault: true,
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            providerCustomerId: 'cus_12345',
            providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
            syncWithProvider: true,
          },
        ])
      })

      it('THEN should drop the non-persisted manual placeholder and never echo it into the mutation input', () => {
        const customer = buildCustomer({
          paymentProviderCustomers: [
            {
              __typename: 'ProviderCustomer',
              id: MANUAL_PLACEHOLDER_ID,
              code: 'manual',
              isDefault: false,
            },
          ],
        })

        const formValues = mapFromApiToForm(customer, mockDefaultBillingEntity)

        expect(formValues.paymentProviderCustomers).toEqual([])

        const result = mapFromFormToApi(formValues)

        expect(result.paymentProviderCustomers).toEqual([])
      })

      it('THEN should round-trip a persisted manual row as an id, a manual type, a manual code and isDefault', () => {
        const customer = buildCustomer({
          paymentProviderCustomers: [
            {
              __typename: 'ProviderCustomer',
              id: PERSISTED_MANUAL_ID,
              code: 'manual',
              isDefault: true,
            },
          ],
        })

        const formValues = mapFromApiToForm(customer, mockDefaultBillingEntity)

        expect(formValues.paymentProviderCustomers).toEqual([
          { id: PERSISTED_MANUAL_ID, code: 'manual', isDefault: true },
        ])

        const result = mapFromFormToApi(formValues)

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: PERSISTED_MANUAL_ID,
            type: 'manual',
            code: 'manual',
            isDefault: true,
          },
        ])
      })

      it('THEN should round-trip the integration connection id for each category through the array', () => {
        const customer = buildCustomer({
          integrationCustomers: [
            {
              __typename: 'NetsuiteCustomer',
              id: 'netsuite-1',
              integrationCode: 'netsuite_1',
              integrationType: IntegrationTypeEnum.Netsuite,
              externalCustomerId: 'netsuite-123',
              syncWithProvider: true,
              subsidiaryId: 'subsidiary-1',
            },
            {
              __typename: 'AnrokCustomer',
              id: 'anrok-1',
              integrationCode: 'anrok_1',
              integrationType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'anrok-123',
              syncWithProvider: false,
            },
            {
              __typename: 'HubspotCustomer',
              id: 'hubspot-1',
              integrationCode: 'hubspot_1',
              integrationType: IntegrationTypeEnum.Hubspot,
              externalCustomerId: 'hubspot-123',
              syncWithProvider: true,
              targetedObject: HubspotTargetedObjectsEnum.Contacts,
            },
          ],
        })

        const formValues = mapFromApiToForm(customer, mockDefaultBillingEntity)

        expect(
          formValues.integrationCustomers?.map((connection) => [
            connection.category,
            connection.id,
          ]),
        ).toEqual([
          [ConnectionCategory.Accounting, 'netsuite-1'],
          [ConnectionCategory.Tax, 'anrok-1'],
          [ConnectionCategory.Crm, 'hubspot-1'],
        ])

        const result = mapFromFormToApi(formValues)

        expect(result.integrationCustomers).toEqual([
          {
            id: 'netsuite-1',
            integrationCode: 'netsuite_1',
            integrationType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'netsuite-123',
            syncWithProvider: true,
            subsidiaryId: 'subsidiary-1',
          },
          {
            id: 'anrok-1',
            integrationCode: 'anrok_1',
            integrationType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok-123',
            syncWithProvider: false,
          },
          {
            id: 'hubspot-1',
            integrationCode: 'hubspot_1',
            integrationType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'hubspot-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Contacts,
          },
        ])
      })

      // The provider switch itself is performed by the connection drawer, the
      // only writer of these arrays: it drops the id of the row it replaces.
      // The mapper's contract is to faithfully omit an id the form row lacks.
      it('THEN should omit the id when the form row has none after a provider switch', () => {
        const customer = buildCustomer({
          paymentProvider: ProviderTypeEnum.Stripe,
          paymentProviderCode: 'stripe_1',
          paymentProviderCustomers: [
            {
              __typename: 'ProviderCustomer',
              id: PERSISTED_PAYMENT_ID,
              code: 'stripe_1',
              isDefault: true,
              providerCustomerId: 'cus_12345',
              syncWithProvider: false,
              providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
            },
          ],
          integrationCustomers: [
            {
              __typename: 'AnrokCustomer',
              id: 'anrok-1',
              integrationCode: 'anrok_1',
              integrationType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'anrok-123',
              syncWithProvider: false,
            },
          ],
        })

        const formValues = mapFromApiToForm(customer, mockDefaultBillingEntity)

        const switchedFormValues: CreateCustomerDefaultValues = {
          ...formValues,
          paymentProviderCustomers: formValues.paymentProviderCustomers?.map((connection) => ({
            ...connection,
            id: undefined,
            code: undefined,
            providerCode: 'gocardless_1',
            providerType: ProviderTypeEnum.Gocardless,
          })),
          integrationCustomers: formValues.integrationCustomers?.map((connection) => ({
            ...connection,
            id: undefined,
            providerCode: 'avalara_1',
            providerType: IntegrationTypeEnum.Avalara,
          })),
        }

        const result = mapFromFormToApi(switchedFormValues)

        expect(result.paymentProviderCustomers?.[0]?.id).toBeUndefined()
        expect(result.paymentProviderCustomers?.[0]?.paymentProviderCode).toBe('gocardless_1')
        expect(result.paymentProviderCustomers?.[0]?.paymentProvider).toBe(
          ProviderTypeEnum.Gocardless,
        )
        expect(result.paymentProviderCustomers?.[0]?.code).toBe('gocardless_1')

        expect(result.integrationCustomers?.[0]?.id).toBeUndefined()
        expect(result.integrationCustomers?.[0]?.integrationCode).toBe('avalara_1')
        expect(result.integrationCustomers?.[0]?.integrationType).toBe(IntegrationTypeEnum.Avalara)
      })
    })
  })
})
