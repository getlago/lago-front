import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  CountryCode,
  CurrencyEnum,
  CustomerTypeEnum,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'

import { validationSchema } from '../validationSchema'

describe('validationSchema', () => {
  describe('basic fields', () => {
    it('validates a minimal valid customer', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('requires externalId to be non-empty', () => {
      const result = validationSchema.safeParse({
        externalId: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['externalId'])
        expect(result.error.issues[0].message).toBe('text_1763633700902rull0etxlje')
      }
    })

    it('validates optional string fields', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        name: 'Acme Corp',
        firstname: 'John',
        lastname: 'Doe',
        legalName: 'Acme Corporation Ltd',
        legalNumber: '12345678',
        taxIdentificationNumber: 'TAX123456',
        phone: '+1234567890',
        externalSalesforceId: 'SF-123',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('validates customerType enum', () => {
      const validResult = validationSchema.safeParse({
        externalId: 'customer-123',
        customerType: CustomerTypeEnum.Company,
        metadata: [],
      })

      expect(validResult.success).toBe(true)

      const invalidResult = validationSchema.safeParse({
        externalId: 'customer-123',
        customerType: 'INVALID_TYPE',
      })

      expect(invalidResult.success).toBe(false)
    })

    it('validates currency enum', () => {
      const validResult = validationSchema.safeParse({
        externalId: 'customer-123',
        currency: CurrencyEnum.Usd,
        metadata: [],
      })

      expect(validResult.success).toBe(true)

      const invalidResult = validationSchema.safeParse({
        externalId: 'customer-123',
        currency: 'INVALID_CURRENCY',
        metadata: [],
      })

      expect(invalidResult.success).toBe(false)
    })

    it('validates timezone enum', () => {
      const validResult = validationSchema.safeParse({
        externalId: 'customer-123',
        timezone: TimezoneEnum.TzUtc,
        metadata: [],
      })

      expect(validResult.success).toBe(true)
    })

    it('validates isPartner boolean', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        isPartner: true,
        metadata: [],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('email validation', () => {
    it('accepts a valid single email', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        email: 'john@example.com',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('accepts multiple comma-separated valid emails', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        email: 'john@example.com, jane@example.com, bob@test.org',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('rejects invalid email format', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        email: 'not-an-email',
        metadata: [],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('text_620bc4d4269a55014d493fc3')
      }
    })

    it('rejects when one email in comma-separated list is invalid', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        email: 'john@example.com, invalid-email, jane@test.org',
        metadata: [],
      })

      expect(result.success).toBe(false)
    })
  })

  describe('url validation', () => {
    it('accepts a valid URL', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        url: 'https://example.com',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('rejects an invalid URL', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        url: 'not-a-url',
        metadata: [],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('text_1764239804026ca61hwr3pp9')
      }
    })
  })

  describe('address validation', () => {
    it('validates billingAddress with all fields', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        billingAddress: {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zipcode: '10001',
          country: CountryCode.Us,
        },
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('validates shippingAddress with all fields', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        shippingAddress: {
          addressLine1: '456 Oak Ave',
          addressLine2: 'Suite 100',
          city: 'Los Angeles',
          state: 'CA',
          zipcode: '90001',
          country: CountryCode.Us,
        },
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('accepts null country in address', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        billingAddress: {
          addressLine1: '123 Main St',
          addressLine2: '',
          city: 'City',
          state: 'State',
          zipcode: '12345',
          country: null,
        },
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('accepts undefined country in address (cleared combobox)', () => {
      const billingResult = validationSchema.safeParse({
        externalId: 'customer-123',
        billingAddress: {
          addressLine1: '123 Main St',
          addressLine2: '',
          city: 'City',
          state: 'State',
          zipcode: '12345',
          country: undefined,
        },
        metadata: [],
      })

      expect(billingResult.success).toBe(true)

      const shippingResult = validationSchema.safeParse({
        externalId: 'customer-123',
        shippingAddress: {
          addressLine1: '456 Oak Ave',
          addressLine2: '',
          city: 'City',
          state: 'State',
          zipcode: '12345',
          country: undefined,
        },
        metadata: [],
      })

      expect(shippingResult.success).toBe(true)
    })

    it('validates isShippingEqualBillingAddress flag', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        isShippingEqualBillingAddress: true,
        metadata: [],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('GIVEN the integrationCustomers array', () => {
    describe('WHEN the array is omitted or empty', () => {
      it('THEN should accept the customer (the array is optional)', () => {
        const omittedResult = validationSchema.safeParse({
          externalId: 'customer-123',
          metadata: [],
        })

        expect(omittedResult.success).toBe(true)

        const emptyResult = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [],
          metadata: [],
        })

        expect(emptyResult.success).toBe(true)
      })
    })

    describe('WHEN a row carries a connection code', () => {
      it('THEN should keep it on the parsed row', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              id: 'anrok-connection-id',
              code: 'tax-eu',
              category: ConnectionCategory.Tax,
              providerCode: 'anrok-eu',
              providerType: IntegrationTypeEnum.Anrok,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
        expect(result.data?.integrationCustomers?.[0]?.code).toBe('tax-eu')
      })

      it('THEN should accept a row without a code, the field being optional', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              category: ConnectionCategory.Tax,
              providerCode: 'anrok-eu',
              providerType: IntegrationTypeEnum.Anrok,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN a row is provided for each integration category', () => {
      it('THEN should accept an accounting row', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              id: 'netsuite-connection-id',
              category: ConnectionCategory.Accounting,
              providerCode: 'netsuite-eu',
              providerType: IntegrationTypeEnum.Netsuite,
              externalCustomerId: 'ACC-CUST-001',
              syncWithProvider: true,
              subsidiaryId: 'SUB-123',
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })

      it('THEN should accept a tax row', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              id: 'anrok-connection-id',
              category: ConnectionCategory.Tax,
              providerCode: 'anrok-eu',
              providerType: IntegrationTypeEnum.Anrok,
              externalCustomerId: 'TAX-CUST-001',
              syncWithProvider: false,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })

      it('THEN should accept a CRM row', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              id: 'hubspot-connection-id',
              category: ConnectionCategory.Crm,
              providerCode: 'hubspot-eu',
              providerType: IntegrationTypeEnum.Hubspot,
              externalCustomerId: 'CRM-CUST-001',
              syncWithProvider: false,
              targetedObject: HubspotTargetedObjectsEnum.Companies,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })

      it('THEN should accept one row per category at once', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            { category: ConnectionCategory.Accounting, providerType: IntegrationTypeEnum.Xero },
            { category: ConnectionCategory.Tax, providerType: IntegrationTypeEnum.Avalara },
            { category: ConnectionCategory.Crm, providerType: IntegrationTypeEnum.Salesforce },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN a row has no category', () => {
      it('THEN should reject the row and point the issue at the category', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              providerCode: 'anrok-eu',
              providerType: IntegrationTypeEnum.Anrok,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['integrationCustomers', 0, 'category'])
        }
      })
    })

    describe('WHEN a row uses the payment category', () => {
      it('THEN should reject it (payment connections live in their own array)', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              category: ConnectionCategory.Payment,
              providerCode: 'stripe-eu',
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['integrationCustomers', 0, 'category'])
        }
      })
    })

    describe('WHEN a row carries an unknown provider type', () => {
      it('THEN should reject it', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [
            {
              category: ConnectionCategory.Tax,
              providerType: 'INVALID_INTEGRATION',
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(false)
      })
    })

    describe('WHEN only the category is provided', () => {
      it('THEN should accept the row (the other rules are owned by the connection drawer)', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          integrationCustomers: [{ category: ConnectionCategory.Accounting }],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the paymentProviderCustomers array', () => {
    describe('WHEN the array is omitted or empty', () => {
      it('THEN should accept the customer (the array is optional)', () => {
        const omittedResult = validationSchema.safeParse({
          externalId: 'customer-123',
          metadata: [],
        })

        expect(omittedResult.success).toBe(true)

        const emptyResult = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [],
          metadata: [],
        })

        expect(emptyResult.success).toBe(true)
      })
    })

    describe('WHEN a provider-backed row is provided', () => {
      it('THEN should accept the full row shape', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              id: 'payment-connection-id',
              code: 'stripe',
              isDefault: true,
              providerCode: 'stripe-eu',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: 'PAY-CUST-001',
              syncWithProvider: false,
              providerPaymentMethods: {
                [ProviderPaymentMethodsEnum.Card]: true,
                [ProviderPaymentMethodsEnum.SepaDebit]: false,
              },
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })

      it('THEN should accept providers without a provider customer mapping', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'cashfree-eu',
              providerType: ProviderTypeEnum.Cashfree,
              syncWithProvider: false,
            },
            {
              providerCode: 'flutterwave-eu',
              providerType: ProviderTypeEnum.Flutterwave,
              syncWithProvider: false,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN a persisted manual row is provided', () => {
      it('THEN should accept the identity-only shape it round-trips with', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            { id: 'manual-connection-id', code: 'lago_manual', isDefault: false },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN the payment methods are empty or missing', () => {
      it('THEN should accept the row (the rule is owned by the connection drawer)', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe-eu',
              providerType: ProviderTypeEnum.Stripe,
              providerCustomerId: '',
              syncWithProvider: true,
              providerPaymentMethods: {},
            },
            {
              providerCode: 'adyen-eu',
              providerType: ProviderTypeEnum.Adyen,
              syncWithProvider: true,
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN a row carries an unknown provider type', () => {
      it('THEN should reject it', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe-eu',
              providerType: 'INVALID_PROVIDER',
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(false)
      })
    })

    describe('WHEN a payment method flag is not a boolean', () => {
      it('THEN should reject it', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          paymentProviderCustomers: [
            {
              providerCode: 'stripe-eu',
              providerType: ProviderTypeEnum.Stripe,
              providerPaymentMethods: {
                [ProviderPaymentMethodsEnum.Card]: 'yes',
              },
            },
          ],
          metadata: [],
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN the connection slot fields replaced by the two arrays', () => {
    describe('WHEN the schema shape is inspected', () => {
      it('THEN should no longer declare any of the removed slot fields', () => {
        expect(Object.keys(validationSchema.shape)).toEqual(
          expect.not.arrayContaining([
            'paymentProviderCode',
            'paymentProviderCustomer',
            'accountingProviderCode',
            'accountingCustomer',
            'taxProviderCode',
            'taxCustomer',
            'crmProviderCode',
            'crmCustomer',
          ]),
        )
        expect(Object.keys(validationSchema.shape)).toEqual(
          expect.arrayContaining(['paymentProviderCustomers', 'integrationCustomers']),
        )
      })
    })

    describe('WHEN a payload still carries the removed slot fields', () => {
      it('THEN should strip them from the parsed values', () => {
        const result = validationSchema.safeParse({
          externalId: 'customer-123',
          metadata: [],
          paymentProviderCode: 'PAY-PROVIDER-001',
          paymentProviderCustomer: { providerCustomerId: 'PAY-CUST-001' },
          accountingProviderCode: 'ACC-PROVIDER-001',
          accountingCustomer: { accountingCustomerId: 'ACC-CUST-001' },
          taxProviderCode: 'TAX-PROVIDER-001',
          taxCustomer: { taxCustomerId: 'TAX-CUST-001' },
          crmProviderCode: 'CRM-PROVIDER-001',
          crmCustomer: { crmCustomerId: 'CRM-CUST-001' },
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).not.toHaveProperty('paymentProviderCode')
          expect(result.data).not.toHaveProperty('paymentProviderCustomer')
          expect(result.data).not.toHaveProperty('accountingProviderCode')
          expect(result.data).not.toHaveProperty('accountingCustomer')
          expect(result.data).not.toHaveProperty('taxProviderCode')
          expect(result.data).not.toHaveProperty('taxCustomer')
          expect(result.data).not.toHaveProperty('crmProviderCode')
          expect(result.data).not.toHaveProperty('crmCustomer')
        }
      })
    })
  })

  describe('metadata validation', () => {
    it('accepts valid metadata', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [
          { key: 'department', value: 'Engineering', displayInInvoice: true },
          { key: 'region', value: 'US-West' },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('accepts empty metadata array', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })

    it('rejects metadata with duplicate keys', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [
          { key: 'department', value: 'Engineering' },
          { key: 'department', value: 'Sales' },
        ],
      })

      expect(result.success).toBe(false)
    })

    it('rejects metadata with empty key', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [{ key: '', value: 'some value' }],
      })

      expect(result.success).toBe(false)
    })

    it('rejects metadata with empty value', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        metadata: [{ key: 'somekey', value: '' }],
      })

      expect(result.success).toBe(false)
    })
  })

  describe('billing entity', () => {
    it('validates billingEntityCode', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        billingEntityCode: 'BILLING-ENTITY-001',
        metadata: [],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('complex customer scenarios', () => {
    it('validates a fully populated customer', () => {
      const result = validationSchema.safeParse({
        customerType: CustomerTypeEnum.Company,
        isPartner: false,
        name: 'Acme Corporation',
        firstname: 'John',
        lastname: 'Doe',
        externalId: 'acme-corp-001',
        externalSalesforceId: 'SF-ACME-001',
        legalName: 'Acme Corporation Ltd',
        legalNumber: '12345678',
        taxIdentificationNumber: 'TAX-12345678',
        currency: CurrencyEnum.Usd,
        phone: '+1234567890',
        email: 'john@acme.com, jane@acme.com',
        billingAddress: {
          addressLine1: '123 Main St',
          addressLine2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          zipcode: '10001',
          country: CountryCode.Us,
        },
        isShippingEqualBillingAddress: false,
        shippingAddress: {
          addressLine1: '456 Oak Ave',
          addressLine2: 'Building B',
          city: 'Los Angeles',
          state: 'CA',
          zipcode: '90001',
          country: CountryCode.Us,
        },
        timezone: TimezoneEnum.TzUtc,
        url: 'https://acme.com',
        integrationCustomers: [
          {
            id: 'accounting-connection-id',
            category: ConnectionCategory.Accounting,
            providerCode: 'ACC-001',
            providerType: IntegrationTypeEnum.Netsuite,
            externalCustomerId: 'ACC-CUST-001',
            syncWithProvider: false,
            subsidiaryId: 'SUB-001',
          },
          {
            id: 'tax-connection-id',
            category: ConnectionCategory.Tax,
            providerCode: 'TAX-001',
            providerType: IntegrationTypeEnum.Anrok,
            externalCustomerId: 'TAX-CUST-001',
            syncWithProvider: false,
          },
          {
            id: 'crm-connection-id',
            category: ConnectionCategory.Crm,
            providerCode: 'CRM-001',
            providerType: IntegrationTypeEnum.Hubspot,
            externalCustomerId: 'CRM-CUST-001',
            syncWithProvider: false,
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          },
        ],
        paymentProviderCustomers: [
          { id: 'manual-connection-id', code: 'lago_manual', isDefault: false },
          {
            id: 'payment-connection-id',
            code: 'stripe',
            isDefault: true,
            providerCode: 'PAY-001',
            providerType: ProviderTypeEnum.Stripe,
            providerCustomerId: 'PAY-CUST-001',
            syncWithProvider: false,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
              [ProviderPaymentMethodsEnum.SepaDebit]: true,
              [ProviderPaymentMethodsEnum.UsBankAccount]: false,
            },
          },
        ],
        metadata: [
          { key: 'department', value: 'Engineering', displayInInvoice: true },
          { key: 'region', value: 'US-West', displayInInvoice: false },
        ],
        billingEntityCode: 'BILLING-001',
      })

      expect(result.success).toBe(true)
    })

    it('validates a customer with sync enabled for all connections', () => {
      const result = validationSchema.safeParse({
        externalId: 'customer-123',
        integrationCustomers: [
          {
            category: ConnectionCategory.Accounting,
            providerCode: 'ACC-001',
            providerType: IntegrationTypeEnum.Netsuite,
            syncWithProvider: true,
            subsidiaryId: 'SUB-001',
          },
          {
            category: ConnectionCategory.Tax,
            providerCode: 'TAX-001',
            providerType: IntegrationTypeEnum.Anrok,
            syncWithProvider: true,
          },
          {
            category: ConnectionCategory.Crm,
            providerCode: 'CRM-001',
            providerType: IntegrationTypeEnum.Hubspot,
            syncWithProvider: true,
            targetedObject: HubspotTargetedObjectsEnum.Companies,
          },
        ],
        paymentProviderCustomers: [
          {
            providerCode: 'PAY-001',
            providerType: ProviderTypeEnum.Stripe,
            syncWithProvider: true,
            providerPaymentMethods: {
              [ProviderPaymentMethodsEnum.Card]: true,
            },
          },
        ],
        metadata: [],
      })

      expect(result.success).toBe(true)
    })
  })
})
