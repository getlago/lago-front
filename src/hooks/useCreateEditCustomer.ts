import { FetchResult, gql } from '@apollo/client'
import { generatePath, useNavigate } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import {
  AddCustomerDrawerFragment,
  AddCustomerDrawerFragmentDoc,
  CreateCustomerInput,
  CreateCustomerMutation,
  CustomerItemFragmentDoc,
  LagoApiError,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
  UpdateCustomerMutation,
  useCreateCustomerMutation,
  useIntegrationsListForCustomerCreateEditQuery,
  useUpdateCustomerMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment AddCustomerDrawer on Customer {
    id
    addressLine1
    addressLine2
    applicableTimezone
    canEditAttributes
    city
    country
    currency
    email
    externalId
    externalSalesforceId
    legalName
    legalNumber
    taxIdentificationNumber
    name
    paymentProvider
    phone
    state
    timezone
    zipcode
    url
    paymentProviderCode
    providerCustomer {
      id
      providerCustomerId
      syncWithProvider
      providerPaymentMethods
    }
    metadata {
      id
      key
      value
      displayInInvoice
    }
  }

  mutation createCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...AddCustomerDrawer
      ...CustomerItem
    }
  }

  mutation updateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ...AddCustomerDrawer
      ...CustomerItem
    }
  }

  query integrationsListForCustomerCreateEdit($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on StripeProvider {
          __typename
          id
          name
          code
        }

        ... on GocardlessProvider {
          __typename
          id
          name
          code
        }

        ... on AdyenProvider {
          __typename
          id
          name
          code
        }
      }
    }
  }

  ${CustomerItemFragmentDoc}
`

type TPaymentProviderForCustomer = {
  __typename: string
  type: ProviderTypeEnum
  id: string
  name: string
  code: string
}

type TPaymentProviderForCustomerGroupByTypename =
  | Record<TPaymentProviderForCustomer['type'], TPaymentProviderForCustomer[]>
  | undefined
  | null

type UseCreateEditCustomer = (props: { customer?: AddCustomerDrawerFragment | null }) => {
  paymentProvidersList: TPaymentProviderForCustomerGroupByTypename
  isEdition: boolean
  onSave: (
    values: CreateCustomerInput | UpdateCustomerInput,
  ) => Promise<
    | FetchResult<UpdateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
    | FetchResult<CreateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
  >
}

export const useCreateEditCustomer: UseCreateEditCustomer = ({ customer }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { data: providersData } = useIntegrationsListForCustomerCreateEditQuery({
    variables: { limit: 100 },
  })
  // group payment providers by __typeName
  const paymentProvidersList = providersData?.paymentProviders?.collection.reduce<
    Record<TPaymentProviderForCustomer['type'], TPaymentProviderForCustomer[]> | undefined | null
  >((acc, curr) => {
    if (!acc) return
    const type = curr.__typename.toLowerCase().replace('provider', '') as ProviderTypeEnum

    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push({ ...curr, type })
    return acc
  }, {} as TPaymentProviderForCustomerGroupByTypename)

  const [create] = useCreateCustomerMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createCustomer }) {
      if (!!createCustomer) {
        addToast({
          message: translate('text_6250304370f0f700a8fdc295'),
          severity: 'success',
        })
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: createCustomer.id }))
      }
    },
  })
  const [update] = useUpdateCustomerMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateCustomer }) {
      if (!!updateCustomer) {
        addToast({
          message: translate('text_626162c62f790600f850b7da'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.updateCustomer) return

      cache.writeFragment({
        data: { ...data?.updateCustomer, __typename: 'CustomerDetails' },
        fragment: AddCustomerDrawerFragmentDoc,
      })
    },
  })

  return {
    paymentProvidersList,
    isEdition: !!customer,
    onSave: !!customer
      ? async ({ providerCustomer, paymentProvider, ...values }) =>
          await update({
            variables: {
              input: {
                id: customer?.id as string,
                paymentProvider,
                providerCustomer: {
                  providerCustomerId: !paymentProvider
                    ? null
                    : providerCustomer?.providerCustomerId,
                  syncWithProvider: !paymentProvider ? null : providerCustomer?.syncWithProvider,
                  providerPaymentMethods: !providerCustomer?.providerPaymentMethods?.length
                    ? [ProviderPaymentMethodsEnum.Card]
                    : providerCustomer?.providerPaymentMethods,
                },
                ...values,
              },
            },
          })
      : async ({ providerCustomer, paymentProvider, ...values }) =>
          await create({
            variables: {
              input: {
                ...values,
                paymentProvider,
                providerCustomer: {
                  providerCustomerId: !paymentProvider
                    ? null
                    : providerCustomer?.providerCustomerId,
                  syncWithProvider: !paymentProvider ? null : providerCustomer?.syncWithProvider,
                  providerPaymentMethods: !providerCustomer?.providerPaymentMethods?.length
                    ? [ProviderPaymentMethodsEnum.Card]
                    : providerCustomer?.providerPaymentMethods,
                },
              },
            },
          }),
  }
}
