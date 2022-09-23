import { gql, FetchResult } from '@apollo/client'
import { useNavigate, generatePath } from 'react-router-dom'

import {
  useCreateCustomerMutation,
  CustomerItemFragmentDoc,
  useUpdateCustomerMutation,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerDrawerDetailFragmentDoc,
  Lago_Api_Error,
  AddCustomerDrawerFragment,
  AddCustomerDrawerDetailFragment,
  UpdateCustomerMutation,
  CreateCustomerMutation,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'

gql`
  fragment AddCustomerDrawer on Customer {
    id
    name
    externalId
    canBeDeleted
    legalName
    legalNumber
    phone
    email
    addressLine1
    addressLine2
    state
    country
    currency
    canEditAttributes
    city
    zipcode
    paymentProvider
    stripeCustomer {
      id
      providerCustomerId
    }
  }

  fragment AddCustomerDrawerDetail on CustomerDetails {
    id
    name
    externalId
    canBeDeleted
    legalName
    legalNumber
    phone
    email
    currency
    canEditAttributes
    addressLine1
    addressLine2
    state
    country
    city
    zipcode
    paymentProvider
    stripeCustomer {
      id
      providerCustomerId
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

  ${CustomerItemFragmentDoc}
`

type UseCreateEditCustomer = (props: {
  customer?: AddCustomerDrawerFragment | AddCustomerDrawerDetailFragment | null
}) => {
  isEdition: boolean
  onSave: (
    values: CreateCustomerInput | UpdateCustomerInput
  ) => Promise<
    | FetchResult<UpdateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
    | FetchResult<CreateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
  >
}

export const useCreateEditCustomer: UseCreateEditCustomer = ({ customer }) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [create] = useCreateCustomerMutation({
    context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
    onCompleted({ createCustomer }) {
      if (!!createCustomer) {
        addToast({
          message: translate('text_6250304370f0f700a8fdc295'),
          severity: 'success',
        })
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: createCustomer.id }))
      }
    },
  })
  const [update] = useUpdateCustomerMutation({
    context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
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
        fragment: AddCustomerDrawerDetailFragmentDoc,
      })
    },
  })

  return {
    isEdition: !!customer,
    onSave: !!customer
      ? async ({ stripeCustomer, paymentProvider, ...values }) =>
          await update({
            variables: {
              input: {
                id: customer?.id as string,
                paymentProvider,
                stripeCustomer: {
                  providerCustomerId: !paymentProvider ? null : stripeCustomer?.providerCustomerId,
                },
                ...values,
              },
            },
          })
      : async ({ stripeCustomer, paymentProvider, ...values }) =>
          await create({
            variables: {
              input: {
                ...values,
                paymentProvider,
                stripeCustomer: {
                  providerCustomerId: !paymentProvider ? null : stripeCustomer?.providerCustomerId,
                },
              },
            },
          }),
  }
}
