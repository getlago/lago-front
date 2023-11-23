import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { CountryCodes } from '~/core/constants/countryCodes'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CustomerMainInfosFragment,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

gql`
  fragment CustomerMainInfos on Customer {
    id
    name
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
    paymentProvider
    timezone
    providerCustomer {
      id
      providerCustomerId
      providerPaymentMethods
    }
    metadata {
      id
      key
      value
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
      <LoadingDetails>
        <SectionHeader variant="subhead">
          <Skeleton variant="text" height={12} width={200} />
        </SectionHeader>
        <div>
          <Skeleton variant="text" height={12} width={80} marginBottom={theme.spacing(3)} />
          <Skeleton variant="text" height={12} width={200} />
        </div>
        <div>
          <Skeleton variant="text" height={12} width={80} marginBottom={theme.spacing(3)} />
          <Skeleton variant="text" height={12} width={200} />
        </div>
      </LoadingDetails>
    )

  const {
    name,
    externalId,
    externalSalesforceId,
    legalName,
    legalNumber,
    taxIdentificationNumber,
    phone,
    email,
    url,
    currency,
    addressLine1,
    addressLine2,
    state,
    country,
    city,
    zipcode,
    paymentProvider,
    providerCustomer,
    timezone,
    metadata,
  } = customer

  return (
    <DetailsBlock>
      <SectionHeader variant="subhead">
        {translate('text_6250304370f0f700a8fdc27d')}

        <Button variant="quaternary" onClick={onEdit}>
          {translate('text_626162c62f790600f850b75a')}
        </Button>
      </SectionHeader>

      {name && (
        <div>
          <Typography variant="caption">{translate('text_626162c62f790600f850b76a')}</Typography>
          <Typography color="textSecondary" forceBreak>
            {name}
          </Typography>
        </div>
      )}
      <div>
        <Typography variant="caption">{translate('text_6250304370f0f700a8fdc283')}</Typography>
        <Typography color="textSecondary">{externalId}</Typography>
      </div>
      {timezone && (
        <div>
          <Typography variant="caption">{translate('text_6390a767b79591bc70ba39f7')}</Typography>
          <Typography color="textSecondary">
            {translate('text_638f743fa9a2a9545ee6409a', {
              zone: translate(timezone || TimezoneEnum.TzUtc),
              offset: getTimezoneConfig(timezone).offset,
            })}
          </Typography>
        </div>
      )}
      {externalSalesforceId && (
        <div>
          <Typography variant="caption">{translate('text_651fd42936a03200c126c683')}</Typography>
          <Typography color="textSecondary">{externalSalesforceId}</Typography>
        </div>
      )}
      {currency && (
        <div>
          <Typography variant="caption">{translate('text_632b4acf0c41206cbcb8c324')}</Typography>
          <Typography color="textSecondary">{currency}</Typography>
        </div>
      )}
      {legalName && (
        <div>
          <Typography variant="caption">{translate('text_626c0c301a16a600ea061471')}</Typography>
          <Typography color="textSecondary">{legalName}</Typography>
        </div>
      )}
      {legalNumber && (
        <div>
          <Typography variant="caption">{translate('text_626c0c301a16a600ea061475')}</Typography>
          <Typography color="textSecondary">{legalNumber}</Typography>
        </div>
      )}
      {taxIdentificationNumber && (
        <div>
          <Typography variant="caption">{translate('text_648053ee819b60364c675d05')}</Typography>
          <Typography color="textSecondary">{taxIdentificationNumber}</Typography>
        </div>
      )}
      {email && (
        <div>
          <Typography variant="caption">{translate('text_626c0c301a16a600ea061479')}</Typography>
          {email.split(',').map((mail) => (
            <Typography key={`customer-email-${mail}`} color="textSecondary" noWrap>
              {mail}
            </Typography>
          ))}
        </div>
      )}
      {url && (
        <div>
          <Typography variant="caption">{translate('text_641b164cff8497006bcbd2b3')}</Typography>
          <Typography color="textSecondary">{url}</Typography>
        </div>
      )}
      {phone && (
        <div>
          <Typography variant="caption">{translate('text_626c0c301a16a600ea06147d')}</Typography>
          <Typography color="textSecondary">{phone}</Typography>
        </div>
      )}
      {(addressLine1 || addressLine2 || state || country || city || zipcode) && (
        <div>
          <Typography variant="caption">{translate('text_626c0c301a16a600ea06148d')}</Typography>
          <Typography color="textSecondary">{addressLine1}</Typography>
          <Typography color="textSecondary">{addressLine2}</Typography>
          <Typography color="textSecondary">
            {zipcode} {city} {state}
          </Typography>
          {country && <Typography color="textSecondary">{CountryCodes[country]}</Typography>}
        </div>
      )}
      {!!paymentProvider && (
        <div>
          <Typography variant="caption">{translate('text_62b5c912506c4905fa755248')}</Typography>
          <Typography color="textSecondary">
            {paymentProvider === ProviderTypeEnum?.Stripe
              ? translate('text_62b5c912506c4905fa75524a')
              : paymentProvider === ProviderTypeEnum?.Gocardless
                ? translate('text_634ea0ecc6147de10ddb6648')
                : paymentProvider === ProviderTypeEnum?.Adyen
                  ? translate('text_645d071272418a14c1c76a6d')
                  : ''}
          </Typography>
        </div>
      )}
      {!!providerCustomer && !!providerCustomer?.providerCustomerId && (
        <div>
          <Typography variant="caption">{translate('text_62b5c912506c4905fa75524c')}</Typography>
          <Typography color="textSecondary">{providerCustomer?.providerCustomerId}</Typography>
        </div>
      )}
      {paymentProvider === ProviderTypeEnum?.Stripe &&
        !!providerCustomer?.providerPaymentMethods?.length && (
          <div>
            <Typography variant="caption">{translate('text_64aeb7b998c4322918c84237')}</Typography>
            <Typography color="textSecondary">
              {providerCustomer?.providerPaymentMethods?.length === 2
                ? translate('text_64aeb7b998c4322918c8423b')
                : providerCustomer?.providerPaymentMethods[0] === ProviderPaymentMethodsEnum?.Card
                  ? translate('text_64aeb7b998c4322918c84208')
                  : translate('text_64aeb7b998c4322918c8420c')}
            </Typography>
          </div>
        )}
      {!!metadata?.length &&
        metadata.map((meta) => (
          <div key={`customer-metadata-${meta.id}`}>
            <Typography variant="caption" noWrap>
              {meta.key}
            </Typography>
            <MetadataValue color="textSecondary">{meta.value}</MetadataValue>
          </div>
        ))}
    </DetailsBlock>
  )
}

const LoadingDetails = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(7)};
  }

  > *:not(:first-child) {
    margin-bottom: ${theme.spacing(7)};
  }
`

const DetailsBlock = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(6)};
  }

  > *:not(:first-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const MetadataValue = styled(Typography)`
  line-break: anywhere;
`
