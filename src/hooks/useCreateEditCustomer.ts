import { gql, FetchResult } from '@apollo/client'
import { useNavigate, generatePath } from 'react-router-dom'

import {
  useCreateCustomerMutation,
  CustomerItemFragmentDoc,
  useUpdateCustomerMutation,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerDrawerDetailFragmentDoc,
  LagoApiError,
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
    providerCustomer {
      id
      providerCustomerId
      providerMandateId
      syncWithProvider
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
    providerCustomer {
      id
      providerCustomerId
      providerMandateId
      syncWithProvider
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
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
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
        fragment: AddCustomerDrawerDetailFragmentDoc,
      })
    },
  })

  return {
    isEdition: !!customer,
    onSave: !!customer
      ? async ({ providerCustomer, paymentProvider, ...values }) =>
          await update({
            variables: {
              input: {
                id: customer?.id as string,
                paymentProvider,
                providerCustomer: {
                  providerCustomerId: !paymentProvider ? null : providerCustomer?.providerCustomerId,
                  providerMandateId: !paymentProvider ? null : providerCustomer?.providerMandateId,
                  syncWithProvider: !paymentProvider ? null : providerCustomer?.syncWithProvider,
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
                  providerCustomerId: !paymentProvider ? null : providerCustomer?.providerCustomerId,
                  providerMandateId: !paymentProvider ? null : providerCustomer?.providerMandateId,
                  syncWithProvider: !paymentProvider ? null : providerCustomer?.syncWithProvider,
                },
              },
            },
          }),
  }
}
