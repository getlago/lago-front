import { z } from 'zod'

export const CUSTOMER_TEXT_MAX_LENGTH = 255
export const CUSTOMER_ADDRESS_LINE_MAX_LENGTH = 500

const TOO_LONG_TEXT_ERROR_KEY = 'text_1793265036704cnkqwk0atap'
const TOO_LONG_ADDRESS_LINE_ERROR_KEY = 'text_17932959847757c9xwcz2ltv'

type CustomerFieldGroup = 'root' | 'billingAddress' | 'shippingAddress'

type CustomerConstrainedField = {
  apiErrorKey: string
  name: string
  group: CustomerFieldGroup
  maxLength: number
}

const ADDRESS_FIELDS: ReadonlyArray<Pick<CustomerConstrainedField, 'name' | 'maxLength'>> = [
  { name: 'addressLine1', maxLength: CUSTOMER_ADDRESS_LINE_MAX_LENGTH },
  { name: 'addressLine2', maxLength: CUSTOMER_ADDRESS_LINE_MAX_LENGTH },
  { name: 'zipcode', maxLength: CUSTOMER_TEXT_MAX_LENGTH },
  { name: 'city', maxLength: CUSTOMER_TEXT_MAX_LENGTH },
  { name: 'state', maxLength: CUSTOMER_TEXT_MAX_LENGTH },
]

const IDENTITY_FIELD_NAMES = [
  'name',
  'firstname',
  'lastname',
  'legalName',
  'taxIdentificationNumber',
]

export const CUSTOMER_CONSTRAINED_FIELDS: ReadonlyArray<CustomerConstrainedField> = [
  ...IDENTITY_FIELD_NAMES.map((name) => ({
    apiErrorKey: name,
    name,
    group: 'root' as const,
    maxLength: CUSTOMER_TEXT_MAX_LENGTH,
  })),
  ...ADDRESS_FIELDS.map(({ name, maxLength }) => ({
    apiErrorKey: name,
    name,
    group: 'billingAddress' as const,
    maxLength,
  })),
  ...ADDRESS_FIELDS.map(({ name, maxLength }) => ({
    apiErrorKey: `shipping${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    name,
    group: 'shippingAddress' as const,
    maxLength,
  })),
]

export const getCustomerConstrainedField = (
  apiErrorKey: string,
): CustomerConstrainedField | undefined =>
  CUSTOMER_CONSTRAINED_FIELDS.find((field) => field.apiErrorKey === apiErrorKey)

export const getCustomerFieldFormPath = (
  field: CustomerConstrainedField,
  billingAddressPath?: string,
): string => {
  if (field.group === 'shippingAddress') return `shippingAddress.${field.name}`
  if (field.group === 'billingAddress' && billingAddressPath) {
    return `${billingAddressPath}.${field.name}`
  }

  return field.name
}

export const getCustomerTooLongErrorKey = (maxLength: number): string =>
  maxLength === CUSTOMER_ADDRESS_LINE_MAX_LENGTH
    ? TOO_LONG_ADDRESS_LINE_ERROR_KEY
    : TOO_LONG_TEXT_ERROR_KEY

// Rails counts Unicode characters while `String.length` counts UTF-16 code units, so an
// astral character (emoji, rare CJK) would otherwise count twice here and once server-side.
const countCustomerFieldCharacters = (value: string): number => [...value].length

const readFormPath = (values: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      values,
    )

type CustomerLengthValidationOptions = {
  billingAddressPath?: string
  initialValues?: unknown
}

export const addCustomerTooLongIssues = (
  values: unknown,
  ctx: z.RefinementCtx,
  { billingAddressPath, initialValues }: CustomerLengthValidationOptions = {},
): void => {
  CUSTOMER_CONSTRAINED_FIELDS.forEach((field) => {
    const path = getCustomerFieldFormPath(field, billingAddressPath)
    const value = readFormPath(values, path)

    if (typeof value !== 'string') return
    if (countCustomerFieldCharacters(value) <= field.maxLength) return
    // A stored value longer than the limit stays saveable until it is edited
    if (value === readFormPath(initialValues, path)) return

    ctx.addIssue({
      code: 'custom',
      message: getCustomerTooLongErrorKey(field.maxLength),
      path: path.split('.'),
    })
  })
}
