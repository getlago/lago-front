import { gql } from '@apollo/client'

import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderCustomerInformationSection } from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Typography } from '~/components/designSystem'
import { CountryCodes } from '~/core/constants/countryCodes'
import {
  CustomerAddressInput,
  CustomerPortalCustomer,
  CustomerTypeEnum,
  useGetPortalCustomerInfosQuery,
} from '~/generated/graphql'

gql`
  query getPortalCustomerInfos {
    customerPortalUser {
      id
      customerType
      name
      firstname
      lastname
      legalName
      legalNumber
      taxIdentificationNumber
      email
      addressLine1
      addressLine2
      state
      country
      city
      zipcode

      shippingAddress {
        addressLine1
        addressLine2
        city
        country
        state
        zipcode
      }
    }
  }
`

const FieldTitle = ({ title }: { title: string }) => (
  <Typography className="text-sm font-normal leading-6 text-grey-600">{title}</Typography>
)

const FieldContent = ({ content, children }: { content?: string; children?: React.ReactNode }) => (
  <Typography className="break-words text-base font-normal leading-6 text-grey-700">
    {content || children}
  </Typography>
)

const Field = ({ title, content }: { title: string; content: string }) => (
  <div className="flex flex-col gap-1">
    <FieldTitle title={title} />
    <FieldContent content={content} />
  </div>
)

type AddressFieldProps = CustomerAddressInput & {
  title: string
}

const addressesAreIdentical = (addressA: CustomerAddressInput, addressB: CustomerAddressInput) =>
  (Object.keys(addressA) as (keyof CustomerAddressInput)[]).every(
    (key) => addressA[key] === addressB[key],
  )

const AddressField = ({
  title,
  addressLine1,
  addressLine2,
  state,
  country,
  city,
  zipcode,
}: AddressFieldProps) => {
  const { translate } = useCustomerPortalTranslate()

  return (
    <div className="flex flex-col gap-1">
      <FieldTitle title={title} />

      {!(addressLine1 || addressLine2 || state || country || city || zipcode) ? (
        <FieldContent content={translate('text_6419c64eace749372fc72b2b')} />
      ) : (
        <div>
          {addressLine1 && <FieldContent content={addressLine1} />}
          {addressLine2 && <FieldContent content={addressLine2} />}
          {(zipcode || city || state) && (
            <FieldContent>
              {zipcode} {city} {state}
            </FieldContent>
          )}
          {country && <FieldContent content={CountryCodes[country]} />}
        </div>
      )}
    </div>
  )
}

interface PortalCustomerInfosProps {
  viewEditInformation: () => void
}

const PortalCustomerInfos = ({ viewEditInformation }: PortalCustomerInfosProps) => {
  const { translate } = useCustomerPortalTranslate()

  const {
    data: portalCustomerInfosData,
    loading: portalCustomerInfosLoading,
    error: portalCustomerInfosError,
    refetch: portalCustomerInfosRefetch,
  } = useGetPortalCustomerInfosQuery()

  const customerPortalUser = portalCustomerInfosData?.customerPortalUser as CustomerPortalCustomer

  const billingAddress = {
    addressLine1: customerPortalUser?.addressLine1,
    addressLine2: customerPortalUser?.addressLine2,
    city: customerPortalUser?.city,
    country: customerPortalUser?.country,
    state: customerPortalUser?.state,
    zipcode: customerPortalUser?.zipcode,
  }

  const hasBillingAddress = (Object.keys(billingAddress) as (keyof CustomerAddressInput)[]).some(
    (key) => !!billingAddress[key],
  )

  const hasShippingAddress = Object.keys(customerPortalUser?.shippingAddress || {}).length > 0

  const identicalAddresses = addressesAreIdentical(
    billingAddress,
    customerPortalUser?.shippingAddress || {},
  )

  type CustomerField = {
    key: keyof CustomerPortalCustomer
    title: string
    show?: (customer: CustomerPortalCustomer) => boolean
    content?: (customer: CustomerPortalCustomer) => string
  }

  const customerFields: CustomerField[] = [
    { key: 'name', title: translate('text_6419c64eace749372fc72b0f') },
    {
      key: 'firstname',
      title: translate('text_17261289386311s35rvzyxbz'),
      show: (customer) => !!(customer.firstname || customer.lastname),
      content: (customer) => `${customer.firstname || ''} ${customer.lastname || ''}`,
    },
    { key: 'legalName', title: translate('text_6419c64eace749372fc72b17') },
    { key: 'legalNumber', title: translate('text_647ddd5220412a009bfd36f4') },
    { key: 'taxIdentificationNumber', title: translate('text_6480a70109b61a005b2092df') },
    {
      key: 'customerType',
      title: translate('text_1728497501618g7qbdad97r5'),
      content: (customer) =>
        translate(TRANSLATIONS_MAP_CUSTOMER_TYPE[customer.customerType as CustomerTypeEnum]),
    },
  ]

  const isLoading = portalCustomerInfosLoading
  const isError = !isLoading && portalCustomerInfosError

  if (isError) {
    return (
      <section>
        <SectionTitle title={translate('text_6419c64eace749372fc72b07')} />

        <SectionError refresh={() => portalCustomerInfosRefetch()} />
      </section>
    )
  }

  return (
    <div>
      <SectionTitle
        title={translate('text_6419c64eace749372fc72b07')}
        className="justify-between"
        action={{ title: translate('text_1728377307159fck091geiv0'), onClick: viewEditInformation }}
        loading={isLoading}
      />

      {isLoading && <LoaderCustomerInformationSection />}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
          <div className="flex flex-col gap-4">
            {customerFields
              .filter(
                (field) => !!customerPortalUser?.[field.key] || field.show?.(customerPortalUser),
              )
              .map((field) => (
                <Field
                  key={`customer-portal-${field.key}`}
                  title={field.title}
                  content={
                    field.content?.(customerPortalUser) || (customerPortalUser[field.key] as string)
                  }
                />
              ))}
          </div>

          <div className="flex flex-col gap-4">
            {customerPortalUser?.email && (
              <Field
                title={translate('text_1728379586750vyjcpwgu27f')}
                content={customerPortalUser.email}
              />
            )}

            <AddressField
              title={translate('text_626c0c301a16a600ea06148d')}
              {...customerPortalUser}
            />

            {hasShippingAddress && hasBillingAddress && identicalAddresses ? (
              <Typography className="text-base font-normal text-grey-700">
                <FieldTitle title={translate('text_667d708c1359b49f5a5a822a')} />
                <FieldContent content={translate('text_1728381336070e8cj1amorap')} />
              </Typography>
            ) : (
              <AddressField
                title={translate('text_667d708c1359b49f5a5a822a')}
                {...customerPortalUser?.shippingAddress}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PortalCustomerInfos
