import { FetchResult, gql } from '@apollo/client'
import { useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMERS_LIST_ROUTE, ERROR_404_ROUTE } from '~/core/router'
import {
  AddCustomerDrawerFragment,
  CreateCustomerInput,
  CreateCustomerMutation,
  CustomerItemFragmentDoc,
  LagoApiError,
  ProviderPaymentMethodsEnum,
  UpdateCustomerInput,
  UpdateCustomerMutation,
  useCreateCustomerMutation,
  useGetSingleCustomerQuery,
  useUpdateCustomerMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomerForExternalAppsAccordion on Customer {
    id
    customerType
    currency
    paymentProvider
    paymentProviderCode
    # Name in the customer is netsuiteCustomer, but it's used as integrationCustomer in the create update inputs
    netsuiteCustomer {
      __typename
      id
      integrationId
      externalCustomerId
      integrationCode
      integrationType
      subsidiaryId
      syncWithProvider
    }
    anrokCustomer {
      __typename
      id
      integrationId
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    xeroCustomer {
      __typename
      id
      integrationId
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    hubspotCustomer {
      __typename
      id
      integrationId
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
      targetedObject
    }
    salesforceCustomer {
      __typename
      id
      integrationId
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    providerCustomer {
      id
      providerCustomerId
      syncWithProvider
      providerPaymentMethods
    }
  }

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
    customerType
    name
    firstname
    lastname
    phone
    state
    timezone
    zipcode
    shippingAddress {
      addressLine1
      addressLine2
      city
      country
      state
      zipcode
    }
    url
    metadata {
      id
      key
      value
      displayInInvoice
    }

    ...CustomerForExternalAppsAccordion
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

  query GetSingleCustomer($id: ID!) {
    customer(id: $id) {
      id
      ...AddCustomerDrawer
    }
  }

  ${CustomerItemFragmentDoc}
`

type UseCreateEditCustomer = () => {
  isEdition: boolean
  loading: boolean
  customer: AddCustomerDrawerFragment | undefined
  onClose: () => void
  onSave: (
    values: CreateCustomerInput | UpdateCustomerInput,
  ) => Promise<
    | FetchResult<UpdateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
    | FetchResult<CreateCustomerMutation, Record<string, unknown>, Record<string, unknown>>
  >
}

export const useCreateEditCustomer: UseCreateEditCustomer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { customerId } = useParams<{ customerId: string }>()

  const {
    data: { customer } = {},
    loading,
    error,
  } = useGetSingleCustomerQuery({
    variables: {
      id: customerId as string,
    },
    skip: !customerId,
  })

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
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: updateCustomer.id }))
      }
    },
  })

  useEffect(() => {
    if (hasDefinedGQLError('NotFound', error, 'customer')) {
      navigate(ERROR_404_ROUTE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  const onSave = async (values: CreateCustomerInput | UpdateCustomerInput) => {
    const { paymentProvider, providerCustomer } = values

    const input = {
      ...values,
      paymentProvider,
      providerCustomer: {
        providerCustomerId: !paymentProvider ? null : providerCustomer?.providerCustomerId,
        syncWithProvider: !paymentProvider ? null : providerCustomer?.syncWithProvider,
        providerPaymentMethods: !providerCustomer?.providerPaymentMethods?.length
          ? [ProviderPaymentMethodsEnum.Card]
          : providerCustomer?.providerPaymentMethods,
      },
    }

    if (customer && customerId) {
      return await update({
        variables: {
          input: {
            id: customer?.id as string,
            ...input,
          },
        },
      })
    }

    return await create({
      variables: {
        input,
      },
    })
  }

  return {
    loading,
    isEdition: !!customerId,
    customer: customer || undefined,
    onClose: () =>
      customerId
        ? navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId }))
        : navigate(CUSTOMERS_LIST_ROUTE),
    onSave,
  }
}
