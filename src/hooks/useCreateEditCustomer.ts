import { gql, FetchResult } from '@apollo/client'
import { useNavigate, generatePath } from 'react-router-dom'
import _omit from 'lodash/omit'

import {
  useCreateCustomerMutation,
  CustomerItemFragmentDoc,
  useUpdateCustomerMutation,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerDialogDetailFragmentDoc,
  Lago_Api_Error,
  useGetBillingInfosLazyQuery,
  BillingInfosFragment,
  AddCustomerDialogFragment,
  AddCustomerDialogDetailFragment,
  UpdateCustomerMutation,
  CreateCustomerMutation,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'

gql`
  fragment AddCustomerDialog on Customer {
    id
    name
    customerId
    canBeDeleted
    legalName
    legalNumber
    phone
    email
    logoUrl
    url
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

  fragment AddCustomerDialogDetail on CustomerDetails {
    id
    name
    customerId
    canBeDeleted
    legalName
    legalNumber
    phone
    email
    logoUrl
    url
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

  fragment BillingInfos on CustomerDetails {
    id
    legalName
    legalNumber
    phone
    email
    logoUrl
    url
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

  query getBillingInfos($id: ID!) {
    customer(id: $id) {
      ...BillingInfos
    }
  }

  mutation createCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...AddCustomerDialog
      ...CustomerItem
    }
  }

  mutation updateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ...AddCustomerDialog
      ...CustomerItem
    }
  }

  ${CustomerItemFragmentDoc}
`

type UseCreateEditCustomer = (props: {
  customer?: AddCustomerDialogFragment | AddCustomerDialogDetailFragment | null
}) => {
  loading: boolean
  isEdition: boolean
  billingInfos?: BillingInfosFragment | null
  onSave: (
    values: CreateCustomerInput | UpdateCustomerInput
  ) => Promise<
    | FetchResult<UpdateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
    | FetchResult<CreateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
  >
  loadBillingInfos?: () => void
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
        fragment: AddCustomerDialogDetailFragmentDoc,
      })
    },
  })
  const [getBillingInfos, { loading, data }] = useGetBillingInfosLazyQuery({
    variables: { id: customer?.id as string },
  })

  return {
    isEdition: !!customer,
    loading,
    billingInfos: data?.customer,
    loadBillingInfos: !!customer ? getBillingInfos : undefined,
    onSave: !!customer
      ? async ({ stripeCustomer, ...values }) =>
          await update({
            variables: {
              input: {
                id: customer?.id as string,
                stripeCustomer: { ..._omit(stripeCustomer, 'id') },
                ...values,
              },
            },
          })
      : async ({ stripeCustomer, ...values }) =>
          await create({
            variables: {
              input: {
                ...values,
                stripeCustomer: { ..._omit(stripeCustomer, 'id') },
              },
            },
          }),
  }
}
