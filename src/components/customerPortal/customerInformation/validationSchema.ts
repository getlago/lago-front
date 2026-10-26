import { z } from 'zod'

import {
  CustomerFieldErrorKey,
  zodCustomerFreeText,
} from '~/components/customers/utils/customerFieldErrors'
import {
  CountryCode,
  CustomerTypeEnum,
  UpdateCustomerPortalCustomerInput,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  country: z.nativeEnum(CountryCode).nullable().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
})

export const editCustomerBillingValidationSchema = z.object({
  customerType: z.nativeEnum(CustomerTypeEnum).nullable().optional(),
  name: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  legalName: z.string().optional(),
  taxIdentificationNumber: z.string().optional(),
  email: z
    .string()
    .email({ message: 'text_620bc4d4269a55014d493fc3' })
    .optional()
    .or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  zipcode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.nativeEnum(CountryCode).nullable().optional(),
  shippingAddress: addressSchema,
})

export type EditCustomerBillingFormValues = z.infer<typeof editCustomerBillingValidationSchema>

export const getEditCustomerBillingValidationSchema = ({
  initialValues,
  translate,
}: {
  initialValues: EditCustomerBillingFormValues
  translate: TranslateFunc
}): typeof editCustomerBillingValidationSchema => {
  const { shippingAddress } = initialValues
  const freeText = (
    key: CustomerFieldErrorKey,
    initialValue: string | null | undefined,
  ): z.ZodOptional<z.ZodString> => zodCustomerFreeText({ key, initialValue, translate }).optional()

  return editCustomerBillingValidationSchema.extend({
    name: freeText('name', initialValues.name),
    firstname: freeText('firstname', initialValues.firstname),
    lastname: freeText('lastname', initialValues.lastname),
    legalName: freeText('legalName', initialValues.legalName),
    taxIdentificationNumber: freeText(
      'taxIdentificationNumber',
      initialValues.taxIdentificationNumber,
    ),
    addressLine1: freeText('addressLine1', initialValues.addressLine1),
    addressLine2: freeText('addressLine2', initialValues.addressLine2),
    zipcode: freeText('zipcode', initialValues.zipcode),
    city: freeText('city', initialValues.city),
    state: freeText('state', initialValues.state),
    shippingAddress: addressSchema.extend({
      addressLine1: freeText('shippingAddressLine1', shippingAddress.addressLine1),
      addressLine2: freeText('shippingAddressLine2', shippingAddress.addressLine2),
      city: freeText('shippingCity', shippingAddress.city),
      state: freeText('shippingState', shippingAddress.state),
      zipcode: freeText('shippingZipcode', shippingAddress.zipcode),
    }),
  })
}

export const editCustomerBillingDefaultValues: EditCustomerBillingFormValues = {
  customerType: null,
  name: '',
  firstname: '',
  lastname: '',
  legalName: undefined,
  taxIdentificationNumber: undefined,
  email: undefined,
  addressLine1: undefined,
  addressLine2: undefined,
  zipcode: undefined,
  city: undefined,
  state: undefined,
  country: undefined,
  shippingAddress: {
    addressLine1: undefined,
    addressLine2: undefined,
    city: undefined,
    country: undefined,
    state: undefined,
    zipcode: undefined,
  },
}

const emptyShippingAddress: EditCustomerBillingFormValues['shippingAddress'] = {
  addressLine1: undefined,
  addressLine2: undefined,
  city: undefined,
  country: undefined,
  state: undefined,
  zipcode: undefined,
}

export const mapCustomerToFormValues = (
  customer?: UpdateCustomerPortalCustomerInput | null,
): EditCustomerBillingFormValues => {
  if (!customer) return editCustomerBillingDefaultValues

  return {
    customerType: customer.customerType ?? null,
    name: customer.name ?? '',
    firstname: customer.firstname ?? '',
    lastname: customer.lastname ?? '',
    legalName: customer.legalName ?? undefined,
    taxIdentificationNumber: customer.taxIdentificationNumber ?? undefined,
    email: customer.email ?? undefined,
    addressLine1: customer.addressLine1 ?? undefined,
    addressLine2: customer.addressLine2 ?? undefined,
    zipcode: customer.zipcode ?? undefined,
    city: customer.city ?? undefined,
    state: customer.state ?? undefined,
    country: customer.country ?? undefined,
    shippingAddress: customer.shippingAddress
      ? {
          addressLine1: customer.shippingAddress.addressLine1 ?? undefined,
          addressLine2: customer.shippingAddress.addressLine2 ?? undefined,
          city: customer.shippingAddress.city ?? undefined,
          country: customer.shippingAddress.country ?? undefined,
          state: customer.shippingAddress.state ?? undefined,
          zipcode: customer.shippingAddress.zipcode ?? undefined,
        }
      : emptyShippingAddress,
  }
}
