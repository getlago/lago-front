import { gql } from '@apollo/client'
import styled from 'styled-components'

import SectionContainer from '~/components/customerPortal/common/SectionContainer'
import SectionLoading from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import { CountryCodes } from '~/core/constants/countryCodes'
import { CustomerAddressInput, useGetPortalCustomerInfosQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  query getPortalCustomerInfos {
    customerPortalUser {
      id
      name
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
  <p className="text-sm font-normal text-grey-600">{title}</p>
)

const FieldContent = ({ content, children }: { content?: string; children?: React.ReactNode }) => (
  <p className="text-base font-normal text-grey-700">{content || children}</p>
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

const addressesAreIdentical = ({
  addressA,
  addressB,
}: {
  addressA?: CustomerAddressInput | null
  addressB?: CustomerAddressInput | null
}) =>
  addressA &&
  addressB &&
  addressA.addressLine1 === addressB.addressLine1 &&
  addressA.addressLine2 === addressB.addressLine2 &&
  addressA.state === addressB.state &&
  addressA.country === addressB.country &&
  addressA.city === addressB.city &&
  addressA.zipcode === addressB.zipcode

const AddressField = ({
  title,
  addressLine1,
  addressLine2,
  state,
  country,
  city,
  zipcode,
}: AddressFieldProps) => {
  const { translate } = useInternationalization()

  return (
    <InfoLine>
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
    </InfoLine>
  )
}

interface PortalCustomerInfosProps {
  viewEditInformation: () => void
}

const PortalCustomerInfos = ({ viewEditInformation }: PortalCustomerInfosProps) => {
  const { translate } = useInternationalization()

  const { data, loading } = useGetPortalCustomerInfosQuery()
  const customerPortalUser = data?.customerPortalUser

  const identicalAddresses = addressesAreIdentical({
    addressA: customerPortalUser,
    addressB: customerPortalUser?.shippingAddress,
  })

  return (
    <SectionContainer>
      <SectionTitle
        title={translate('text_6419c64eace749372fc72b07')}
        className="justify-between"
        action={{ title: translate('text_1728377307159fck091geiv0'), onClick: viewEditInformation }}
      />

      {loading && <SectionLoading />}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-0">
          <div className="flex flex-col gap-4">
            <Field
              title={translate('text_6419c64eace749372fc72b0f')}
              content={customerPortalUser?.name || translate('text_6419c64eace749372fc72b0b')}
            />

            <Field
              title={translate('text_6419c64eace749372fc72b17')}
              content={customerPortalUser?.legalName || translate('text_6419c64eace749372fc72b13')}
            />

            <Field
              title={translate('text_647ddd5220412a009bfd36f4')}
              content={
                customerPortalUser?.legalNumber || translate('text_647ddd5f54fefd00c5754bca')
              }
            />

            <Field
              title={translate('text_6480a70109b61a005b2092df')}
              content={
                customerPortalUser?.taxIdentificationNumber ||
                translate('text_6480a707530c5c0053cd11e1')
              }
            />

            <Field
              title={translate('text_1728379586750vyjcpwgu27f')}
              content={customerPortalUser?.email || translate('text_6419c64eace749372fc72b23')}
            />
          </div>

          <div className="flex flex-col gap-4">
            <AddressField
              title={translate('text_626c0c301a16a600ea06148d')}
              {...customerPortalUser}
            />

            {customerPortalUser?.shippingAddress?.addressLine1 && identicalAddresses ? (
              <span className="text-base font-normal text-grey-700">
                <FieldTitle title={translate('text_667d708c1359b49f5a5a822a')} />
                <FieldContent content={translate('text_1728381336070e8cj1amorap')} />
              </span>
            ) : (
              <AddressField
                title={translate('text_667d708c1359b49f5a5a822a')}
                {...customerPortalUser?.shippingAddress}
              />
            )}
          </div>
        </div>
      )}
    </SectionContainer>
  )
}

export default PortalCustomerInfos

const InfoLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(2)};

  > div:first-child {
    min-width: 140px;
    white-space: break-spaces;
    margin-top: ${theme.spacing(1)};
    margin-right: ${theme.spacing(3)};
  }

  > div:last-child {
    width: 100%;
    line-break: anywhere;
  }

  > a {
    color: ${theme.palette.primary[600]};

    > * {
      color: inherit;
    }
  }
`
