import { FetchResult, gql } from '@apollo/client'
import { generatePath, useNavigate } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
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

  ${CustomerItemFragmentDoc}
`

type UseCreateEditCustomer = (props: { customer?: AddCustomerDrawerFragment | null }) => {
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
