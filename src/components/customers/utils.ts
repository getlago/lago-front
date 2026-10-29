import { GraphQLFormattedError } from 'graphql'

import { LagoGQLError } from '~/core/apolloClient/errorUtils'
import {
  Customer,
  CustomerTypeEnum,
  IntegrationsListForCustomerMainInfosQuery,
  LagoApiError,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

export const CUSTOMER_TEXT_MAX_LENGTH = 255
export const CUSTOMER_ADDRESS_LINE_MAX_LENGTH = 500

const CUSTOMER_FIELD_ERROR_CODES: string[] = [
  LagoApiError.InvalidCharacters,
  LagoApiError.ValueIsTooLong,
]
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

type CustomerFieldErrors = {
  fields: Record<string, { message: string; path: string[] }>
  hasOnlyFieldErrors: boolean
}

export const getCustomerFieldErrors = ({
  errors,
  translate,
  billingAddressPath,
}: {
  errors?: readonly GraphQLFormattedError[]
  translate: TranslateFunc
  billingAddressPath?: string
}): CustomerFieldErrors => {
  const details = (errors?.[0]?.extensions as LagoGQLError['extensions'] | undefined)?.details
  const detailEntries = Object.entries(details || {})
  const fields: CustomerFieldErrors['fields'] = {}

  detailEntries.forEach(([key, codes]) => {
    const code =
      Array.isArray(codes) &&
      codes.find((detailCode) => CUSTOMER_FIELD_ERROR_CODES.includes(detailCode))

    if (!code) return

    const path = getCustomerFieldPath(key, billingAddressPath)
    const max = /addressLine/i.test(key)
      ? CUSTOMER_ADDRESS_LINE_MAX_LENGTH
      : CUSTOMER_TEXT_MAX_LENGTH

    fields[path] = {
      message:
        code === LagoApiError.InvalidCharacters
          ? translate('text_1793265036704k3gcjfhp5lo')
          : translate('text_1793265036704cnkqwk0atap', { max }),
      path: path.split('.'),
    }
  })

  return {
    fields,
    hasOnlyFieldErrors:
      errors?.length === 1 &&
      detailEntries.length > 0 &&
      detailEntries.every(
        ([, codes]) =>
          Array.isArray(codes) && codes.every((code) => CUSTOMER_FIELD_ERROR_CODES.includes(code)),
      ),
  }
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
