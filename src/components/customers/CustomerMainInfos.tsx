import { gql } from '@apollo/client'

import { CustomerInfoRows } from '~/components/customers/CustomerInfoRows'
import { CustomerIntegrationRows } from '~/components/customers/CustomerIntegrationRows'
import { Skeleton } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CustomerMainInfosFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomerMainInfos on Customer {
    id
    customerType
    name
    firstname
    lastname
    externalId
    externalSalesforceId
    legalName
    legalNumber
    taxIdentificationNumber
    phone
    email
    currency
    addressLine1
    addressLine2
    state
    country
    city
    url
    zipcode
    shippingAddress {
      addressLine1
      addressLine2
      city
      country
      state
      zipcode
    }
    paymentProvider
    timezone
    anrokCustomer {
      id
      integrationId
      externalCustomerId
    }
    avalaraCustomer {
      id
      integrationId
      externalCustomerId
    }
    netsuiteCustomer {
      id
      integrationId
      externalCustomerId
    }
    paymentProviderCode
    providerCustomer {
      id
      providerCustomerId
      providerPaymentMethods
    }
    xeroCustomer {
      id
      integrationId
      externalCustomerId
    }
    hubspotCustomer {
      id
      integrationId
      externalCustomerId
      targetedObject
    }
    salesforceCustomer {
      id
      integrationId
      externalCustomerId
    }
    metadata {
      id
      key
      value
    }
    billingEntity {
      name
      code
    }
  }
`

interface CustomerMainInfosProps {
  loading?: boolean
  customer?: CustomerMainInfosFragment | null
  onEdit?: () => unknown
}

export const CustomerMainInfos = ({ loading, customer, onEdit }: CustomerMainInfosProps) => {
  const { translate } = useInternationalization()

  if (loading || !customer)
    return (
      <div className="gap-4">
        <div>
          <Skeleton variant="text" className="w-50" />
        </div>
        <div>
          <Skeleton variant="text" className="mb-3 w-20" />
          <Skeleton variant="text" className="w-50" />
        </div>
        <div>
          <Skeleton variant="text" className="mb-3 w-20" />
          <Skeleton variant="text" className="w-50" />
        </div>
      </div>
    )

  return (
    <div>
      <PageSectionTitle
        className="mb-4"
        title={translate('text_6250304370f0f700a8fdc27d')}
        subtitle={translate('text_1737059551511f5acxkfz7p4')}
        action={{
          title: translate('text_626162c62f790600f850b75a'),
          onClick: () => onEdit?.(),
        }}
      />

      <div className="flex flex-col" data-id="customer-info-list">
        <CustomerInfoRows customer={customer} />
        <CustomerIntegrationRows customer={customer} />
      </div>
    </div>
  )
}
