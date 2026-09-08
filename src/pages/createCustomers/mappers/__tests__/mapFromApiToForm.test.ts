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

import { mapFromApiToForm } from '../mapFromApiToForm'
import { mapFromFormToApi } from '../mapFromFormToApi'
import { BillingEntityItem } from '../types'

const CUSTOMER_ID = 'customer-1'
const MANUAL_PLACEHOLDER_ID = `${CUSTOMER_ID}-manual`

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
  customerType: CustomerTypeEnum.Individual,
  accountType: CustomerAccountTypeEnum.Customer,
  name: 'John Doe',
  firstname: 'John',
  lastname: 'Doe',
  externalId: 'ext-123',
  externalSalesforceId: 'sf-456',
  legalName: 'John Doe LLC',
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
  shippingAddress: {
    addressLine1: '456 Oak Ave',
    addressLine2: 'Apt 2B',
    city: 'Oakland',
    state: 'CA',
    zipcode: '94610',
    country: CountryCode.Us,
  },
  timezone: TimezoneEnum.TzAmericaLosAngeles,
  url: 'https://example.com',
  paymentProvider: undefined,
  paymentProviderCode: undefined,
  paymentProviderCustomers: [],
  integrationCustomers: [],
  metadata: [
    { key: 'department', value: 'engineering', displayInInvoice: true, id: 'meta-1' },
    { key: 'priority', value: 'high', displayInInvoice: false, id: 'meta-2' },
  ],
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

describe('mapFromApiToForm', () => {
  describe('GIVEN no customer', () => {
    describe('WHEN no default billing entity is provided', () => {
      it('THEN should return the empty form defaults with both connection arrays empty', () => {
        const result = mapFromApiToForm(undefined, undefined)

        expect(result).toEqual({
          customerType: undefined,
          isPartner: false,
          name: '',
          firstname: '',
          lastname: '',
          externalId: '',
          externalSalesforceId: '',
          legalName: '',
          legalNumber: '',
          taxIdentificationNumber: '',
          currency: undefined,
          phone: '',
          email: undefined,
          billingAddress: {
            addressLine1: '',
            addressLine2: '',
            state: '',
            country: null,
            city: '',
            zipcode: '',
          },
          isShippingEqualBillingAddress: false,
          shippingAddress: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipcode: '',
            country: null,
          },
          timezone: undefined,
          url: undefined,
          integrationCustomers: [],
          paymentProviderCustomers: [],
          metadata: [],
          billingEntityCode: undefined,
        })
      })
    })

    describe('WHEN a default billing entity is provided', () => {
      it('THEN should fall back to the default billing entity code', () => {
        const result = mapFromApiToForm(undefined, mockDefaultBillingEntity)

        expect(result).toEqual(
          expect.objectContaining({
            billingEntityCode: 'default-entity',
          }),
        )
      })
    })
  })

  describe('GIVEN a customer with basic information', () => {
    describe('WHEN mapping it to the form model', () => {
      it('THEN should map every basic field and leave the connection arrays empty', () => {
        const result = mapFromApiToForm(buildCustomer(), mockDefaultBillingEntity)

        expect(result).toEqual({
          customerType: CustomerTypeEnum.Individual,
          isPartner: false,
          name: 'John Doe',
          firstname: 'John',
          lastname: 'Doe',
          externalId: 'ext-123',
          externalSalesforceId: 'sf-456',
          legalName: 'John Doe LLC',
          legalNumber: 'LN-789',
          taxIdentificationNumber: 'TIN-012',
          currency: CurrencyEnum.Usd,
          phone: '+1-555-0123',
          email: 'john@example.com',
          billingAddress: {
            addressLine1: '123 Main St',
            addressLine2: 'Suite 100',
            state: 'CA',
            country: CountryCode.Us,
            city: 'San Francisco',
            zipcode: '94105',
          },
          isShippingEqualBillingAddress: false,
          shippingAddress: {
            addressLine1: '456 Oak Ave',
            addressLine2: 'Apt 2B',
            city: 'Oakland',
            state: 'CA',
            zipcode: '94610',
            country: CountryCode.Us,
          },
          timezone: TimezoneEnum.TzAmericaLosAngeles,
          url: 'https://example.com',
          integrationCustomers: [],
          paymentProviderCustomers: [],
          metadata: [
            { key: 'department', value: 'engineering', displayInInvoice: true, id: 'meta-1' },
            { key: 'priority', value: 'high', displayInInvoice: false, id: 'meta-2' },
          ],
          billingEntityCode: 'default-entity',
        })
      })

      it('THEN should flag isPartner when the account type is Partner', () => {
        const result = mapFromApiToForm(
          buildCustomer({ accountType: CustomerAccountTypeEnum.Partner }),
          mockDefaultBillingEntity,
        )

        expect(result.isPartner).toBe(true)
      })

      it('THEN should prefer the customer billing entity code over the default one', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            billingEntity: {
              __typename: 'BillingEntity',
              id: 'billing-entity-1',
              code: 'custom-entity',
              name: 'Custom Entity',
              euTaxManagement: false,
            },
          }),
          mockDefaultBillingEntity,
        )

        expect(result.billingEntityCode).toBe('custom-entity')
      })

      it('THEN should flag isShippingEqualBillingAddress when both addresses match', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            shippingAddress: {
              addressLine1: '123 Main St',
              addressLine2: 'Suite 100',
              city: 'San Francisco',
              state: 'CA',
              zipcode: '94105',
              country: CountryCode.Us,
            },
          }),
          mockDefaultBillingEntity,
        )

        expect(result.isShippingEqualBillingAddress).toBe(true)
      })
    })
  })

  describe('GIVEN a customer with a provider payment connection', () => {
    describe('WHEN mapping it to the form model', () => {
      it('THEN should map the row with the provider identity taken from the customer top-level fields', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: 'stripe_1',
                isDefault: true,
                providerCustomerId: 'cus_12345',
                syncWithProvider: true,
                providerPaymentMethods: [
                  ProviderPaymentMethodsEnum.Card,
                  ProviderPaymentMethodsEnum.SepaDebit,
                ],
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: 'provider-connection-1',
            code: 'stripe_1',
            isDefault: true,
            providerCode: 'stripe_1',
            providerType: ProviderTypeEnum.Stripe,
            providerCustomerId: 'cus_12345',
            syncWithProvider: true,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
              [ProviderPaymentMethodsEnum.SepaDebit]: true,
            },
          },
        ])
      })

      it('THEN should default the payment methods to card and sepa debit for a EUR customer', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            currency: CurrencyEnum.Eur,
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: 'stripe_1',
                isDefault: true,
                providerPaymentMethods: [],
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers?.[0]?.providerPaymentMethods).toEqual({
          [ProviderPaymentMethodsEnum.Card]: true,
          [ProviderPaymentMethodsEnum.SepaDebit]: true,
        })
      })

      it('THEN should default the payment methods to card only for a non-EUR customer', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            currency: CurrencyEnum.Usd,
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: 'stripe_1',
                isDefault: true,
                providerPaymentMethods: null,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers?.[0]?.providerPaymentMethods).toEqual({
          [ProviderPaymentMethodsEnum.Card]: true,
        })
      })

      it('THEN should fall back to empty strings and false for the nullable row fields', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: null,
            paymentProviderCode: null,
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: null,
                isDefault: false,
                providerCustomerId: null,
                syncWithProvider: null,
                providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: 'provider-connection-1',
            code: undefined,
            isDefault: false,
            providerCode: '',
            providerType: undefined,
            providerCustomerId: '',
            syncWithProvider: false,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
            },
          },
        ])
      })
    })
  })

  describe('GIVEN a customer whose payment connections contain the non-persisted manual placeholder', () => {
    describe('WHEN mapping it to the form model', () => {
      it('THEN should drop the placeholder and keep only the persisted provider row', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: MANUAL_PLACEHOLDER_ID,
                code: 'lago_manual',
                isDefault: false,
              },
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: 'stripe_1',
                isDefault: true,
                providerCustomerId: 'cus_12345',
                syncWithProvider: false,
                providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toHaveLength(1)
        expect(result.paymentProviderCustomers?.[0]?.id).toBe('provider-connection-1')
      })
    })
  })

  // Cashfree/Flutterwave have no provider customer to map, so the backend never
  // creates a connection row: the customer-level scalars are the only record of
  // the connection and the form must rebuild a row from them
  describe('GIVEN a payment connection that exists only on the customer-level scalars', () => {
    const cashfreeCustomer = () =>
      buildCustomer({
        currency: CurrencyEnum.Usd,
        paymentProvider: ProviderTypeEnum.Cashfree,
        paymentProviderCode: 'cashfree_1',
        paymentProviderCustomers: [
          {
            __typename: 'ProviderCustomer',
            id: MANUAL_PLACEHOLDER_ID,
            code: 'lago_manual',
            isDefault: false,
          },
        ],
      })

    describe('WHEN mapping it to the form model', () => {
      it('THEN should rebuild an id-less provider row from the scalars', () => {
        const result = mapFromApiToForm(cashfreeCustomer(), mockDefaultBillingEntity)

        expect(result.paymentProviderCustomers).toEqual([
          {
            providerCode: 'cashfree_1',
            providerType: ProviderTypeEnum.Cashfree,
            providerCustomerId: '',
            syncWithProvider: false,
            providerPaymentMethods: { [ProviderPaymentMethodsEnum.Card]: true },
          },
        ])
      })

      it('THEN should keep the connection alive across an unrelated edit', () => {
        const formValues = mapFromApiToForm(cashfreeCustomer(), mockDefaultBillingEntity)

        const input = mapFromFormToApi({ ...formValues, name: 'A brand new name' })

        expect(input.paymentProvider).toBe(ProviderTypeEnum.Cashfree)
        expect(input.paymentProviderCode).toBe('cashfree_1')
      })
    })

    describe('WHEN a real provider connection row is also present', () => {
      it('THEN should not rebuild a second row', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'provider-connection-1',
                code: 'stripe_1',
                isDefault: true,
                providerCustomerId: 'cus_12345',
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toHaveLength(1)
        expect(result.paymentProviderCustomers?.[0]?.id).toBe('provider-connection-1')
      })
    })

    describe('WHEN the customer has no payment connection at all', () => {
      it('THEN should leave the payment array empty', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: null,
            paymentProviderCode: null,
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: MANUAL_PLACEHOLDER_ID,
                code: 'lago_manual',
                isDefault: false,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toEqual([])
      })
    })
  })

  describe('GIVEN a customer with a persisted manual payment connection', () => {
    describe('WHEN mapping it to the form model', () => {
      it('THEN should keep only the id, code and isDefault of the manual row', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'a3f6c1d2-1111-4a2b-9c3d-000000000001',
                code: 'lago_manual',
                isDefault: true,
                providerCustomerId: 'should-be-ignored',
                syncWithProvider: true,
                providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers).toEqual([
          {
            id: 'a3f6c1d2-1111-4a2b-9c3d-000000000001',
            code: 'lago_manual',
            isDefault: true,
          },
        ])
      })
    })
  })

  describe('GIVEN a customer with integration connections', () => {
    describe('WHEN mapping them to the form model', () => {
      it('THEN should map an Anrok connection to the tax category', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                integrationCode: 'anrok_1',
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: 'anrok-123',
                syncWithProvider: true,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: 'anrok_1',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'anrok-123',
            syncWithProvider: true,
          },
        ])
      })

      it('THEN should map an Avalara connection to the tax category', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AvalaraCustomer',
                id: 'avalara-1',
                integrationCode: 'avalara_1',
                integrationType: IntegrationTypeEnum.Avalara,
                externalCustomerId: 'avalara-456',
                syncWithProvider: false,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'avalara-1',
            category: ConnectionCategory.Tax,
            providerCode: 'avalara_1',
            providerType: IntegrationTypeEnum.Avalara,
            externalCustomerId: 'avalara-456',
            syncWithProvider: false,
          },
        ])
      })

      it('THEN should map a NetSuite connection to the accounting category with its subsidiaryId', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'NetsuiteCustomer',
                id: 'netsuite-1',
                integrationCode: 'netsuite_1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: 'netsuite-456',
                syncWithProvider: false,
                subsidiaryId: 'subsidiary-789',
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'netsuite-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'netsuite_1',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'netsuite-456',
            syncWithProvider: false,
            subsidiaryId: 'subsidiary-789',
          },
        ])
      })

      it('THEN should map a Xero connection to the accounting category', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'XeroCustomer',
                id: 'xero-1',
                integrationCode: 'xero_1',
                integrationType: IntegrationTypeEnum.Xero,
                externalCustomerId: 'xero-123',
                syncWithProvider: true,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'xero-1',
            category: ConnectionCategory.Accounting,
            providerCode: 'xero_1',
            providerType: IntegrationTypeEnum.Xero,
            externalCustomerId: 'xero-123',
            syncWithProvider: true,
          },
        ])
      })

      it('THEN should map a HubSpot connection to the CRM category with its targetedObject', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
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
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'hubspot-1',
            category: ConnectionCategory.Crm,
            providerCode: 'hubspot_1',
            providerType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'hubspot-123',
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Contacts,
          },
        ])
      })

      it('THEN should map a Salesforce connection to the CRM category', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'SalesforceCustomer',
                id: 'salesforce-1',
                integrationCode: 'salesforce_1',
                integrationType: IntegrationTypeEnum.Salesforce,
                externalCustomerId: 'salesforce-456',
                syncWithProvider: false,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'salesforce-1',
            category: ConnectionCategory.Crm,
            providerCode: 'salesforce_1',
            providerType: IntegrationTypeEnum.Salesforce,
            externalCustomerId: 'salesforce-456',
            syncWithProvider: false,
          },
        ])
      })

      it('THEN should keep one row per category when accounting, tax and CRM are all connected', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                integrationCode: 'anrok_1',
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: 'anrok-123',
                syncWithProvider: true,
              },
              {
                __typename: 'NetsuiteCustomer',
                id: 'netsuite-1',
                integrationCode: 'netsuite_1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: 'netsuite-456',
                syncWithProvider: false,
                subsidiaryId: 'subsidiary-789',
              },
              {
                __typename: 'HubspotCustomer',
                id: 'hubspot-1',
                integrationCode: 'hubspot_1',
                integrationType: IntegrationTypeEnum.Hubspot,
                externalCustomerId: 'hubspot-123',
                syncWithProvider: true,
                targetedObject: HubspotTargetedObjectsEnum.Companies,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers?.map((connection) => connection.category)).toEqual([
          ConnectionCategory.Tax,
          ConnectionCategory.Accounting,
          ConnectionCategory.Crm,
        ])
        expect(result.integrationCustomers?.map((connection) => connection.id)).toEqual([
          'anrok-1',
          'netsuite-1',
          'hubspot-1',
        ])
      })

      it('THEN should fall back to empty strings and false for the nullable integration fields', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                integrationCode: null,
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: null,
                syncWithProvider: null,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([
          {
            id: 'anrok-1',
            category: ConnectionCategory.Tax,
            providerCode: '',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: '',
            syncWithProvider: false,
          },
        ])
      })

      it('THEN should drop a connection without an integration type', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                integrationCode: 'anrok_1',
                integrationType: null,
                externalCustomerId: 'anrok-123',
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([])
      })

      it('THEN should drop a connection whose integration type maps to no category', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                integrationCode: 'anrok_1',
                integrationType: IntegrationTypeEnum.LifetimeUsage,
                externalCustomerId: 'anrok-123',
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers).toEqual([])
      })

      it('THEN should ignore a non-string subsidiaryId', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'NetsuiteCustomer',
                id: 'netsuite-1',
                integrationCode: 'netsuite_1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: 'netsuite-123',
                syncWithProvider: true,
                // @ts-expect-error Simulates a payload where subsidiaryId is not a string
                subsidiaryId: 123,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers?.[0]).not.toHaveProperty('subsidiaryId')
      })

      it('THEN should omit subsidiaryId when the property is absent', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'NetsuiteCustomer',
                id: 'netsuite-1',
                integrationCode: 'netsuite_1',
                integrationType: IntegrationTypeEnum.Netsuite,
                externalCustomerId: 'netsuite-123',
                syncWithProvider: true,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers?.[0]).not.toHaveProperty('subsidiaryId')
      })

      it('THEN should omit targetedObject when it is null', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            integrationCustomers: [
              {
                __typename: 'HubspotCustomer',
                id: 'hubspot-1',
                integrationCode: 'hubspot_1',
                integrationType: IntegrationTypeEnum.Hubspot,
                externalCustomerId: 'hubspot-123',
                syncWithProvider: true,
                targetedObject: null,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.integrationCustomers?.[0]).not.toHaveProperty('targetedObject')
      })
    })
  })

  describe('GIVEN a customer without a shipping address', () => {
    describe('WHEN the shipping address is undefined', () => {
      it('THEN should map an empty shipping address', () => {
        const result = mapFromApiToForm(
          buildCustomer({ shippingAddress: undefined }),
          mockDefaultBillingEntity,
        )

        expect(result.shippingAddress).toEqual({
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipcode: '',
          country: null,
        })
      })
    })

    describe('WHEN the shipping address is null', () => {
      it('THEN should map an empty shipping address', () => {
        const result = mapFromApiToForm(
          buildCustomer({ shippingAddress: null }),
          mockDefaultBillingEntity,
        )

        expect(result.shippingAddress).toEqual({
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipcode: '',
          country: null,
        })
      })
    })
  })

  describe('GIVEN a customer without metadata', () => {
    describe('WHEN the metadata is undefined', () => {
      it('THEN should map an empty metadata array', () => {
        const result = mapFromApiToForm(
          buildCustomer({ metadata: undefined }),
          mockDefaultBillingEntity,
        )

        expect(result.metadata).toEqual([])
      })
    })

    describe('WHEN the metadata is null', () => {
      it('THEN should map an empty metadata array', () => {
        const result = mapFromApiToForm(buildCustomer({ metadata: null }), mockDefaultBillingEntity)

        expect(result.metadata).toEqual([])
      })
    })

    describe('WHEN the metadata is an empty array', () => {
      it('THEN should map an empty metadata array', () => {
        const result = mapFromApiToForm(buildCustomer({ metadata: [] }), mockDefaultBillingEntity)

        expect(result.metadata).toEqual([])
      })
    })
  })

  describe('GIVEN a customer with every connection category and complete information', () => {
    describe('WHEN mapping it to the form model', () => {
      it('THEN should map the whole form model including both connection arrays', () => {
        const customer = buildCustomer({
          customerType: CustomerTypeEnum.Company,
          accountType: CustomerAccountTypeEnum.Partner,
          name: 'Complete Customer',
          firstname: 'Complete',
          lastname: 'Customer',
          externalId: 'ext-complete',
          externalSalesforceId: 'sf-complete',
          legalName: 'Complete Customer Inc',
          legalNumber: 'CC-123',
          taxIdentificationNumber: 'TIN-456',
          currency: CurrencyEnum.Eur,
          phone: '+33-1-23-45-67-89',
          email: 'complete@example.com',
          addressLine1: '123 Complete St',
          addressLine2: 'Floor 5',
          state: 'Paris',
          country: CountryCode.Fr,
          city: 'Paris',
          zipcode: '75001',
          shippingAddress: {
            addressLine1: '456 Shipping Ave',
            addressLine2: 'Warehouse B',
            city: 'Lyon',
            state: 'Rhône',
            zipcode: '69001',
            country: CountryCode.Fr,
          },
          timezone: TimezoneEnum.TzEuropeParis,
          url: 'https://complete.example.com',
          paymentProvider: ProviderTypeEnum.Stripe,
          paymentProviderCode: 'stripe_complete',
          paymentProviderCustomers: [
            {
              __typename: 'ProviderCustomer',
              id: MANUAL_PLACEHOLDER_ID,
              code: 'lago_manual',
              isDefault: false,
            },
            {
              __typename: 'ProviderCustomer',
              id: 'provider-connection-complete',
              code: 'stripe_complete',
              isDefault: true,
              providerCustomerId: 'cus_complete',
              syncWithProvider: true,
              providerPaymentMethods: [
                ProviderPaymentMethodsEnum.Card,
                ProviderPaymentMethodsEnum.SepaDebit,
              ],
            },
          ],
          integrationCustomers: [
            {
              __typename: 'XeroCustomer',
              id: 'xero-1',
              integrationCode: 'xero_complete',
              integrationType: IntegrationTypeEnum.Xero,
              externalCustomerId: 'xero-complete',
              syncWithProvider: true,
            },
            {
              __typename: 'HubspotCustomer',
              id: 'hubspot-1',
              integrationCode: 'hubspot_complete',
              integrationType: IntegrationTypeEnum.Hubspot,
              externalCustomerId: 'hubspot-complete',
              syncWithProvider: false,
              targetedObject: HubspotTargetedObjectsEnum.Companies,
            },
            {
              __typename: 'AnrokCustomer',
              id: 'anrok-1',
              integrationCode: 'anrok_complete',
              integrationType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'anrok-complete',
              syncWithProvider: true,
            },
          ],
          billingEntity: {
            __typename: 'BillingEntity',
            id: 'billing-entity-1',
            code: 'complete-entity',
            name: 'Complete Entity',
            euTaxManagement: false,
          },
          metadata: [
            { key: 'segment', value: 'enterprise', displayInInvoice: true, id: 'meta-1' },
            { key: 'region', value: 'europe', displayInInvoice: false, id: 'meta-2' },
            { key: 'account_manager', value: 'alice.smith', displayInInvoice: false, id: 'meta-3' },
          ],
        })

        const result = mapFromApiToForm(customer, mockDefaultBillingEntity)

        expect(result).toEqual({
          customerType: CustomerTypeEnum.Company,
          isPartner: true,
          name: 'Complete Customer',
          firstname: 'Complete',
          lastname: 'Customer',
          externalId: 'ext-complete',
          externalSalesforceId: 'sf-complete',
          legalName: 'Complete Customer Inc',
          legalNumber: 'CC-123',
          taxIdentificationNumber: 'TIN-456',
          currency: CurrencyEnum.Eur,
          phone: '+33-1-23-45-67-89',
          email: 'complete@example.com',
          billingAddress: {
            addressLine1: '123 Complete St',
            addressLine2: 'Floor 5',
            state: 'Paris',
            country: CountryCode.Fr,
            city: 'Paris',
            zipcode: '75001',
          },
          isShippingEqualBillingAddress: false,
          shippingAddress: {
            addressLine1: '456 Shipping Ave',
            addressLine2: 'Warehouse B',
            city: 'Lyon',
            state: 'Rhône',
            zipcode: '69001',
            country: CountryCode.Fr,
          },
          timezone: TimezoneEnum.TzEuropeParis,
          url: 'https://complete.example.com',
          integrationCustomers: [
            {
              id: 'xero-1',
              category: ConnectionCategory.Accounting,
              providerCode: 'xero_complete',
              providerType: IntegrationTypeEnum.Xero,
              externalCustomerId: 'xero-complete',
              syncWithProvider: true,
            },
            {
              id: 'hubspot-1',
              category: ConnectionCategory.Crm,
              providerCode: 'hubspot_complete',
              providerType: IntegrationTypeEnum.Hubspot,
              externalCustomerId: 'hubspot-complete',
              syncWithProvider: false,
              targetedObject: HubspotTargetedObjectsEnum.Companies,
            },
            {
              id: 'anrok-1',
              category: ConnectionCategory.Tax,
              providerCode: 'anrok_complete',
              providerType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'anrok-complete',
              syncWithProvider: true,
            },
          ],
          paymentProviderCustomers: [
            {
              id: 'provider-connection-complete',
              code: 'stripe_complete',
              isDefault: true,
              providerCode: 'stripe_complete',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: 'cus_complete',
              syncWithProvider: true,
              providerPaymentMethods: {
                [ProviderPaymentMethodsEnum.Card]: true,
                [ProviderPaymentMethodsEnum.SepaDebit]: true,
              },
            },
          ],
          metadata: [
            { key: 'segment', value: 'enterprise', displayInInvoice: true, id: 'meta-1' },
            { key: 'region', value: 'europe', displayInInvoice: false, id: 'meta-2' },
            { key: 'account_manager', value: 'alice.smith', displayInInvoice: false, id: 'meta-3' },
          ],
          billingEntityCode: 'complete-entity',
        })
      })
    })
  })
  describe('GIVEN connections carrying a persisted code', () => {
    describe('WHEN mapping them to the form model', () => {
      it('THEN should keep the code of both the payment and the integration connection', () => {
        const result = mapFromApiToForm(
          buildCustomer({
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'pc-1',
                code: 'payment-eu',
                isDefault: true,
                providerCustomerId: 'cus_123',
                syncWithProvider: false,
                providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
              },
            ],
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                code: 'tax-eu',
                integrationCode: 'anrok_1',
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: 'anrok-123',
                syncWithProvider: true,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        expect(result.paymentProviderCustomers?.[0]).toEqual(
          expect.objectContaining({ code: 'payment-eu' }),
        )
        expect(result.integrationCustomers?.[0]).toEqual(
          expect.objectContaining({ code: 'tax-eu' }),
        )
      })
    })

    describe('WHEN piping the form model back to the mutation input', () => {
      it('THEN should round-trip both codes untouched', () => {
        const formValues = mapFromApiToForm(
          buildCustomer({
            paymentProvider: ProviderTypeEnum.Stripe,
            paymentProviderCode: 'stripe_1',
            paymentProviderCustomers: [
              {
                __typename: 'ProviderCustomer',
                id: 'pc-1',
                code: 'payment-eu',
                isDefault: true,
                providerCustomerId: 'cus_123',
                syncWithProvider: false,
                providerPaymentMethods: [ProviderPaymentMethodsEnum.Card],
              },
            ],
            integrationCustomers: [
              {
                __typename: 'AnrokCustomer',
                id: 'anrok-1',
                code: 'tax-eu',
                integrationCode: 'anrok_1',
                integrationType: IntegrationTypeEnum.Anrok,
                externalCustomerId: 'anrok-123',
                syncWithProvider: true,
              },
            ],
          }),
          mockDefaultBillingEntity,
        )

        const result = mapFromFormToApi(formValues)

        expect(result.paymentProviderCustomers?.[0]).toEqual(
          expect.objectContaining({ code: 'payment-eu' }),
        )
        expect(result.integrationCustomers?.[0]).toEqual(
          expect.objectContaining({ code: 'tax-eu' }),
        )
      })
    })
  })
})
