import { z } from 'zod'

import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  CustomerFieldErrorKey,
  zodCustomerFreeText,
} from '~/components/customers/utils/customerFieldErrors'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { zodMultipleEmails, zodOptionalUrl } from '~/formValidation/zodCustoms'
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
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const addressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  state: z.string(),
  zipcode: z.string(),
  country: z.enum(CountryCode).nullable().optional(),
})

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
  email: zodMultipleEmails.optional(),
  billingAddress: addressSchema.optional(),
  isShippingEqualBillingAddress: z.boolean().optional(),
  shippingAddress: addressSchema.optional(),
  timezone: z.enum(TimezoneEnum).optional(),
  // Don't know why, just using zod.url().optional() gives an error if the field is emptied after submission
  url: zodOptionalUrl.optional(),
  // Connection rules are enforced by the connection drawer (the only entry
  // point writing these arrays); duplicating them here would only produce
  // invisible submit blocks now that the inline fields are gone
  integrationCustomers: z
    .array(
      z.object({
        id: z.string().optional(),
        code: z.string().optional(),
        category: z.enum([
          ConnectionCategory.Accounting,
          ConnectionCategory.Tax,
          ConnectionCategory.Crm,
        ]),
        isDefault: z.boolean().optional(),
        providerCode: z.string().optional(),
        providerType: z.enum(IntegrationTypeEnum).optional(),
        externalCustomerId: z.string().optional(),
        syncWithProvider: z.boolean().optional(),
        subsidiaryId: z.string().optional(),
        targetedObject: z.enum(HubspotTargetedObjectsEnum).optional(),
      }),
    )
    .optional(),
  // Provider-backed payment connections plus the customer's persisted manual
  // row (code "manual"), which is invisible in the UI but must round-trip its
  // id so the backend's diff-by-id reconciliation leaves it untouched
  paymentProviderCustomers: z
    .array(
      z.object({
        id: z.string().optional(),
        code: z.string().optional(),
        isDefault: z.boolean().optional(),
        providerCode: z.string().optional(),
        providerType: z.enum(ProviderTypeEnum).optional(),
        providerCustomerId: z.string().optional(),
        syncWithProvider: z.boolean().optional(),
        providerPaymentMethods: z
          .partialRecord(z.enum(ProviderPaymentMethodsEnum), z.boolean())
          .optional(),
      }),
    )
    .optional(),
  metadata: zodMetadataSchema(),
  billingEntityCode: z.string().optional(),
})

export type CreateCustomerDefaultValues = z.infer<typeof validationSchema>

export const getValidationSchema = ({
  initialValues,
  translate,
}: {
  initialValues: CreateCustomerDefaultValues
  translate: TranslateFunc
}): typeof validationSchema => {
  const { billingAddress, shippingAddress } = initialValues
  const freeText = (
    key: CustomerFieldErrorKey,
    initialValue: string | null | undefined,
  ): z.ZodString => zodCustomerFreeText({ key, initialValue, translate })

  return validationSchema.extend({
    name: freeText('name', initialValues.name).optional(),
    firstname: freeText('firstname', initialValues.firstname).optional(),
    lastname: freeText('lastname', initialValues.lastname).optional(),
    legalName: freeText('legalName', initialValues.legalName).optional(),
    taxIdentificationNumber: freeText(
      'taxIdentificationNumber',
      initialValues.taxIdentificationNumber,
    ).optional(),
    billingAddress: addressSchema
      .extend({
        addressLine1: freeText('addressLine1', billingAddress?.addressLine1),
        addressLine2: freeText('addressLine2', billingAddress?.addressLine2),
        city: freeText('city', billingAddress?.city),
        state: freeText('state', billingAddress?.state),
        zipcode: freeText('zipcode', billingAddress?.zipcode),
      })
      .optional(),
    shippingAddress: addressSchema
      .extend({
        addressLine1: freeText('shippingAddressLine1', shippingAddress?.addressLine1),
        addressLine2: freeText('shippingAddressLine2', shippingAddress?.addressLine2),
        city: freeText('shippingCity', shippingAddress?.city),
        state: freeText('shippingState', shippingAddress?.state),
        zipcode: freeText('shippingZipcode', shippingAddress?.zipcode),
      })
      .optional(),
  })
}

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
  integrationCustomers: [],
  paymentProviderCustomers: [],
  metadata: [],
  billingEntityCode: undefined,
}
