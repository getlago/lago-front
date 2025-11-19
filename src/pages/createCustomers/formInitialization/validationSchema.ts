import { z } from 'zod'

import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import {
  CountryCode,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  CustomerTypeEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'

export const validationSchema = z.object({
  customerType: z.enum(CustomerTypeEnum).nullable(),
  isPartner: z.boolean(),
  accountType: z.enum(CustomerAccountTypeEnum).nullable(),
  name: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  externalId: z.string().min(1, {
    message: 'text_1763633700902rull0etxlje',
  }),
  externalSalesforceId: z.string(),
  legalName: z.string(),
  legalNumber: z.string(),
  taxIdentificationNumber: z.string(),
  currency: z.enum(CurrencyEnum).nullable(),
  phone: z.string(),
  email: z.email('text_620bc4d4269a55014d493fc3'),
  addressLine1: z.string(),
  addressLine2: z.string(),
  state: z.string(),
  country: z.enum(CountryCode).nullable(),
  city: z.string(),
  zipcode: z.string(),
  shippingAddress: z
    .object({
      addressLine1: z.string().nullish(),
      addressLine2: z.string().nullish(),
      city: z.string().nullish(),
      state: z.string().nullish(),
      zipcode: z.string().nullish(),
      country: z.enum(CountryCode).nullish(),
    })
    .nullable(),
  timezone: z.enum(TimezoneEnum).nullable(),
  url: z.url().nullable(),
  integrationCustomers: z.array(
    z.object({
      __typename: z.union([
        z.literal('NetsuiteCustomer'),
        z.literal('AvalaraCustomer'),
        z.literal('AnrokCustomer'),
        z.literal('XeroCustomer'),
        z.literal('HubspotCustomer'),
        z.literal('SalesforceCustomer'),
      ]),
      id: z.string(),
      integrationId: z.string().nullish(),
      externalCustomerId: z.string().nullish(),
      integrationCode: z.string().nullish(),
      integrationType: z.enum(IntegrationTypeEnum).nullish(),
      subsidiaryId: z.string().nullish(),
      syncWithProvider: z.boolean().nullish(),
    }),
  ),
  paymentProviderCode: z.string().nullable(),
  providerCustomer: z.object({
    providerCustomerId: z.string(),
    syncWithProvider: z.boolean(),
    providerPaymentMethods: z.array(z.enum(ProviderPaymentMethodsEnum)),
  }),
  paymentProvider: z.enum(ProviderTypeEnum).nullable(),
  metadata: zodMetadataSchema(),
  billingEntityCode: z.string().nullable(),
})

export type CreateCustomerDefaultValues = z.infer<typeof validationSchema>

// Only used to have proper typing for default values on subforms. Those values will never be used
export const emptyCreateCustomerDefaultValues: CreateCustomerDefaultValues = {
  customerType: null,
  isPartner: false,
  accountType: null,
  name: '',
  firstname: '',
  lastname: '',
  externalId: '',
  externalSalesforceId: '',
  legalName: '',
  legalNumber: '',
  taxIdentificationNumber: '',
  currency: null,
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  state: '',
  country: null,
  city: '',
  zipcode: '',
  shippingAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipcode: '',
    country: null,
  },
  timezone: TimezoneEnum.TzAmericaChicago,
  url: '',
  integrationCustomers: [],
  paymentProviderCode: null,
  providerCustomer: {
    providerCustomerId: '',
    syncWithProvider: false,
    providerPaymentMethods: [],
  },
  paymentProvider: ProviderTypeEnum.Stripe,
  metadata: [],
  billingEntityCode: null,
}
