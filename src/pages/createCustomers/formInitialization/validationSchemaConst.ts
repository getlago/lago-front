import { z } from 'zod'

import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import {
  CountryCode,
  CurrencyEnum,
  CustomerTypeEnum,
  HubspotTargetedObjectsEnum,
  ProviderPaymentMethodsEnum,
  TimezoneEnum,
} from '~/generated/graphql'

const emails = z.custom<string>((val) => {
  if (typeof val !== 'string') return false
  const separatedEmails = val.split(',').map((mail) => mail.trim())

  try {
    z.array(z.email()).parse(separatedEmails)
  } catch {
    return false
  }

  return true
}, 'text_620bc4d4269a55014d493fc3')

export const validationSchema = z.object({
  customerType: z.enum(CustomerTypeEnum).optional(),
  isPartner: z.boolean().optional(),
  name: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  externalId: z.string().min(1, {
    message: 'text_1763633700902rull0etxlje',
  }),
  externalSalesforceId: z.string().optional(),
  legalName: z.string().optional(),
  legalNumber: z.string().optional(),
  taxIdentificationNumber: z.string().optional(),
  currency: z.enum(CurrencyEnum).optional(),
  phone: z.string().optional(),
  email: emails.optional(),
  billingAddress: z
    .object({
      addressLine1: z.string(),
      addressLine2: z.string(),
      city: z.string(),
      state: z.string(),
      zipcode: z.string(),
      country: z.enum(CountryCode).nullable(),
    })
    .optional(),
  shippingAddress: z
    .object({
      addressLine1: z.string(),
      addressLine2: z.string(),
      city: z.string(),
      state: z.string(),
      zipcode: z.string(),
      country: z.enum(CountryCode).nullable(),
    })
    .optional(),
  timezone: z.enum(TimezoneEnum).optional(),
  url: z.url().optional(),
  accountingProviderCode: z.string().optional(),
  accountingCustomer: z
    .object({
      accountingCustomerId: z.string().optional(),
      syncWithProvider: z.boolean().optional(),
      subsidiaryId: z.string().optional(),
    })
    .optional(),
  taxProviderCode: z.string().optional(),
  taxCustomer: z
    .object({
      taxCustomerId: z.string().optional(),
      syncWithProvider: z.boolean().optional(),
    })
    .optional(),
  crmProviderCode: z.string().optional(),
  crmCustomer: z
    .object({
      crmCustomerId: z.string().optional(),
      syncWithProvider: z.boolean().optional(),
      targetedObject: z.enum(HubspotTargetedObjectsEnum).optional(),
    })
    .optional(),
  paymentProviderCode: z.string().optional(),
  paymentProviderCustomer: z
    .object({
      providerCustomerId: z.string().optional(),
      syncWithProvider: z.boolean().optional(),
      providerPaymentMethods: z
        .partialRecord(z.enum(ProviderPaymentMethodsEnum), z.boolean())
        .optional(),
    })
    .optional(),
  metadata: zodMetadataSchema(),
  billingEntityCode: z.string().optional(),
})

export type CreateCustomerDefaultValues = z.infer<typeof validationSchema>

// Only used to have proper typing for default values on subforms. Those values will never be used
export const emptyCreateCustomerDefaultValues: CreateCustomerDefaultValues = {
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
  shippingAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipcode: '',
    country: null,
  },
  billingAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipcode: '',
    country: null,
  },
  timezone: undefined,
  url: undefined,
  accountingProviderCode: undefined,
  accountingCustomer: {
    accountingCustomerId: '',
    syncWithProvider: false,
    subsidiaryId: '',
  },
  taxProviderCode: undefined,
  taxCustomer: {
    taxCustomerId: '',
    syncWithProvider: false,
  },
  crmProviderCode: undefined,
  crmCustomer: {
    crmCustomerId: '',
    syncWithProvider: false,
    targetedObject: undefined,
  },
  paymentProviderCode: undefined,
  paymentProviderCustomer: {
    providerCustomerId: '',
    syncWithProvider: false,
    providerPaymentMethods: {},
  },
  metadata: [],
  billingEntityCode: undefined,
}
