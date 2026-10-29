import { AnyFormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import {
  Customer,
  CustomerTypeEnum,
  IntegrationsListForCustomerMainInfosQuery,
  LagoApiError,
} from '~/generated/graphql'

export const CUSTOMER_TEXT_MAX_LENGTH = 255
export const CUSTOMER_ADDRESS_LINE_MAX_LENGTH = 500

const CUSTOMER_FIELD_ERROR_CODES: string[] = [
  LagoApiError.InvalidCharacters,
  LagoApiError.ValueIsTooLong,
]
const isCustomerFieldErrorCode = (code: unknown): code is string =>
  typeof code === 'string' && CUSTOMER_FIELD_ERROR_CODES.includes(code)

const BILLING_ADDRESS_KEYS = ['addressLine1', 'addressLine2', 'zipcode', 'city', 'state']
const SHIPPING_KEY_PREFIX = 'shipping'

const getCustomerFieldPath = (key: string, billingAddressPath?: string): string => {
  if (key.startsWith(SHIPPING_KEY_PREFIX)) {
    const addressKey = key.slice(SHIPPING_KEY_PREFIX.length)

    return `shippingAddress.${addressKey.charAt(0).toLowerCase()}${addressKey.slice(1)}`
  }

  if (billingAddressPath && BILLING_ADDRESS_KEYS.includes(key)) {
    return `${billingAddressPath}.${key}`
  }

  return key
}

const getCustomerFieldErrorKey = (key: string, code: string): string => {
  if (code === LagoApiError.InvalidCharacters) return 'text_1793265036704k3gcjfhp5lo'
  if (/addressLine/i.test(key)) return 'text_17932959847757c9xwcz2ltv'

  return 'text_1793265036704cnkqwk0atap'
}

type CustomerFieldErrors = {
  fields: Record<string, { message: string }>
  hasOnlyFieldErrors: boolean
}

export const getCustomerFieldErrors = ({
  errors,
  billingAddressPath,
}: {
  errors?: readonly GraphQLFormattedError[]
  billingAddressPath?: string
}): CustomerFieldErrors => {
  const details = errors?.[0]?.extensions?.details
  const detailEntries: [string, unknown][] =
    details && typeof details === 'object' ? Object.entries(details) : []
  const fields: CustomerFieldErrors['fields'] = {}

  detailEntries.forEach(([key, codes]) => {
    const code = Array.isArray(codes) ? codes.find(isCustomerFieldErrorCode) : undefined

    if (!code) return

    fields[getCustomerFieldPath(key, billingAddressPath)] = {
      message: getCustomerFieldErrorKey(key, code),
    }
  })

  return {
    fields,
    hasOnlyFieldErrors:
      errors?.length === 1 &&
      detailEntries.length > 0 &&
      detailEntries.every(
        ([, codes]) => Array.isArray(codes) && codes.every(isCustomerFieldErrorCode),
      ),
  }
}

export const setCustomerServerErrors = (
  formApi: Pick<AnyFormApi, 'getFieldMeta' | 'setFieldMeta'>,
  fields: CustomerFieldErrors['fields'],
): void => {
  Object.entries(fields).forEach(([name, error]) => {
    if (!formApi.getFieldMeta(name)) return

    formApi.setFieldMeta(name, (prev) => ({
      ...prev,
      errorMap: { ...prev.errorMap, onServer: error },
      errorSourceMap: { ...prev.errorSourceMap, onServer: 'field' },
    }))
  })
}

type ServerErrorFieldApi = {
  state: { meta: { errorMap: { onServer?: unknown } } }
  setErrorMap: (errorMap: { onServer: undefined }) => void
}

export const clearCustomerServerError = ({ fieldApi }: { fieldApi: ServerErrorFieldApi }): void => {
  if (fieldApi.state.meta.errorMap.onServer) fieldApi.setErrorMap({ onServer: undefined })
}

type RawIntegration = NonNullable<
  NonNullable<IntegrationsListForCustomerMainInfosQuery['integrations']>['collection']
>[number]

type Integration = Exclude<
  RawIntegration,
  { __typename?: 'OktaIntegration' } | { __typename?: 'EntraIdIntegration' }
>

export const getInitials = (str: string) =>
  str.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')

export const computeCustomerInitials = (
  customer?: Pick<Customer, 'name' | 'firstname' | 'lastname'> | null,
) => {
  const { name = '', firstname = '', lastname = '' } = customer ?? {}

  if (name) {
    return getInitials(name)
  }

  if (firstname || lastname) {
    return getInitials(`${firstname} ${lastname}`.trim())
  }

  return '-'
}

export const TRANSLATIONS_MAP_CUSTOMER_TYPE: Record<CustomerTypeEnum, string> = {
  [CustomerTypeEnum.Individual]: 'text_1726129457108txzr4gdkvcz',
  [CustomerTypeEnum.Company]: 'text_1726129457108raohiy4kkt3',
}

export function getConnectedIntegrations<
  TType extends Integration['__typename'],
  TResult extends Extract<Integration, { __typename: TType }>,
>(
  data: IntegrationsListForCustomerMainInfosQuery | undefined,
  typename: TType,
  integrationId: string | null | undefined,
): TResult | undefined {
  if (!data || !integrationId) return undefined

  return data?.integrations?.collection
    ?.filter((i): i is TResult => i.__typename === typename)
    ?.find((integration) => integration.id === integrationId)
}
