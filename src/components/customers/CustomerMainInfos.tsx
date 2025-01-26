import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FC, PropsWithChildren } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Avatar, Icon, Skeleton, Typography } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CountryCodes } from '~/core/constants/countryCodes'
import {
  buildAnrokCustomerUrl,
  buildHubspotObjectUrl,
  buildNetsuiteCustomerUrl,
  buildSalesforceUrl,
  buildStripeCustomerUrl,
  buildXeroCustomerUrl,
} from '~/core/constants/externalUrls'
import { getTargetedObjectTranslationKey } from '~/core/constants/form'
import { getTimezoneConfig } from '~/core/timezone'
import {
  AnrokIntegration,
  CustomerMainInfosFragment,
  HubspotIntegration,
  NetsuiteIntegration,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  SalesforceIntegration,
  TimezoneEnum,
  useIntegrationsListForCustomerMainInfosQuery,
  usePaymentProvidersListForCustomerMainInfosQuery,
  XeroIntegration,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Anrok from '~/public/images/anrok.svg'
import Cashfree from '~/public/images/cashfree.svg'
import Gocardless from '~/public/images/gocardless.svg'
import Hubspot from '~/public/images/hubspot.svg'
import Netsuite from '~/public/images/netsuite.svg'
import Salesforce from '~/public/images/salesforce.svg'
import Stripe from '~/public/images/stripe.svg'
import Xero from '~/public/images/xero.svg'

const PaymentProviderMethodTranslationsLookup = {
  [ProviderPaymentMethodsEnum.BacsDebit]: 'text_65e1f90471bc198c0c934d92',
  [ProviderPaymentMethodsEnum.Card]: 'text_64aeb7b998c4322918c84208',
  [ProviderPaymentMethodsEnum.Link]: 'text_6686b316b672a6e75a29eea0',
  [ProviderPaymentMethodsEnum.SepaDebit]: 'text_64aeb7b998c4322918c8420c',
  [ProviderPaymentMethodsEnum.UsBankAccount]: 'text_65e1f90471bc198c0c934d8e',
}

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
  }

  query paymentProvidersListForCustomerMainInfos($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on StripeProvider {
          id
          name
          code
        }

        ... on GocardlessProvider {
          id
          name
          code
        }

        ... on CashfreeProvider {
          id
          name
          code
        }

        ... on AdyenProvider {
          id
          name
          code
        }
      }
    }
  }

  query integrationsListForCustomerMainInfos($limit: Int) {
    integrations(limit: $limit) {
      collection {
        ... on NetsuiteIntegration {
          __typename
          id
          name
          accountId
        }
        ... on AnrokIntegration {
          __typename
          id
          name
          apiKey
          externalAccountId
        }
        ... on XeroIntegration {
          __typename
          id
          name
        }
        ... on HubspotIntegration {
          __typename
          id
          name
          portalId
        }
        ... on SalesforceIntegration {
          __typename
          id
          name
          instanceId
        }
      }
    }
  }
`

interface CustomerMainInfosProps {
  loading?: boolean
  customer?: CustomerMainInfosFragment | null
  onEdit?: () => unknown
}

const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="pb-12 shadow-b">
    <Typography className="mb-4 text-base font-medium text-grey-700">{title}</Typography>

    {children}
  </div>
)

const InfoBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 flex gap-4 first-child:w-50">{children}</div>
)

const InlineLink: FC<PropsWithChildren<LinkProps>> = ({ children, ...props }) => {
  return (
    <Link
      className="w-fit !shadow-none line-break-anywhere hover:no-underline focus:ring-0"
      {...props}
    >
      {children}
    </Link>
  )
}

export const CustomerMainInfos = ({ loading, customer, onEdit }: CustomerMainInfosProps) => {
  const { translate } = useInternationalization()

  const { data: paymentProvidersData } = usePaymentProvidersListForCustomerMainInfosQuery({
    variables: { limit: 1000 },
  })
  const { data: integrationsData, loading: integrationsLoading } =
    useIntegrationsListForCustomerMainInfosQuery({
      variables: { limit: 1000 },
      skip:
        !customer?.netsuiteCustomer &&
        !customer?.anrokCustomer &&
        !customer?.xeroCustomer &&
        !customer?.hubspotCustomer &&
        !customer?.salesforceCustomer,
    })

  const linkedProvider = paymentProvidersData?.paymentProviders?.collection?.find(
    (provider) => provider?.code === customer?.paymentProviderCode,
  )

  const allNetsuiteIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allAnrokIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AnrokIntegration',
  ) as AnrokIntegration[] | undefined

  const allXeroIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'XeroIntegration',
  ) as XeroIntegration[] | undefined

  const allHubspotIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'HubspotIntegration',
  ) as HubspotIntegration[] | undefined

  const allSalesforceIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'SalesforceIntegration',
  ) as SalesforceIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) => integration?.id === customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const connectedAnrokIntegration = allAnrokIntegrations?.find(
    (integration) => integration?.id === customer?.anrokCustomer?.integrationId,
  ) as AnrokIntegration

  const connectedXeroIntegration = allXeroIntegrations?.find(
    (integration) => integration?.id === customer?.xeroCustomer?.integrationId,
  ) as XeroIntegration

  const connectedHubspotIntegration = allHubspotIntegrations?.find(
    (integration) => integration?.id === customer?.hubspotCustomer?.integrationId,
  ) as HubspotIntegration

  const connectedSalesforceIntegration = allSalesforceIntegrations?.find(
    (integration) => integration?.id === customer?.salesforceCustomer?.integrationId,
  ) as SalesforceIntegration

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

  const {
    customerType,
    name,
    firstname,
    lastname,
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
    shippingAddress,
    paymentProvider,
    providerCustomer,
    timezone,
    metadata,
  } = customer

  return (
    <div>
      <PageSectionTitle
        title={translate('text_6250304370f0f700a8fdc27d')}
        subtitle={translate('text_1737059551511f5acxkfz7p4')}
        action={{
          title: translate('text_626162c62f790600f850b75a'),
          onClick: () => onEdit?.(),
        }}
      />

      <div className="flex flex-col gap-12" data-id="customer-info-list">
        <InfoSection title={translate('text_1737892224509yezgypqk5vp')}>
          {customerType && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_1726128938631ioz4orixel3')}
              </Typography>
              <Typography color="textSecondary" forceBreak>
                {translate(TRANSLATIONS_MAP_CUSTOMER_TYPE[customerType])}
              </Typography>
            </InfoBlock>
          )}
          {name && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626162c62f790600f850b76a')}
              </Typography>
              <Typography color="textSecondary" forceBreak>
                {name}
              </Typography>
            </InfoBlock>
          )}
          {(firstname || lastname) && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_17261289386311s35rvzyxbz')}
              </Typography>
              <Typography color="textSecondary" forceBreak>
                {firstname} {lastname}
              </Typography>
            </InfoBlock>
          )}
          <InfoBlock>
            <Typography variant="caption">{translate('text_6250304370f0f700a8fdc283')}</Typography>
            <Typography color="textSecondary">{externalId}</Typography>
          </InfoBlock>
          {timezone && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_6390a767b79591bc70ba39f7')}
              </Typography>
              <Typography color="textSecondary">
                {translate('text_638f743fa9a2a9545ee6409a', {
                  zone: translate(timezone || TimezoneEnum.TzUtc),
                  offset: getTimezoneConfig(timezone).offset,
                })}
              </Typography>
            </InfoBlock>
          )}
          {externalSalesforceId && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_651fd42936a03200c126c683')}
              </Typography>
              <Typography color="textSecondary">{externalSalesforceId}</Typography>
            </InfoBlock>
          )}
        </InfoSection>

        <InfoSection title={translate('text_17378922245103cc9xrd1tjj')}>
          {currency && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_632b4acf0c41206cbcb8c324')}
              </Typography>
              <Typography color="textSecondary">{currency}</Typography>
            </InfoBlock>
          )}
          {legalName && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626c0c301a16a600ea061471')}
              </Typography>
              <Typography color="textSecondary">{legalName}</Typography>
            </InfoBlock>
          )}
          {legalNumber && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626c0c301a16a600ea061475')}
              </Typography>
              <Typography color="textSecondary">{legalNumber}</Typography>
            </InfoBlock>
          )}
          {taxIdentificationNumber && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_648053ee819b60364c675d05')}
              </Typography>
              <Typography color="textSecondary">{taxIdentificationNumber}</Typography>
            </InfoBlock>
          )}
          {email && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626c0c301a16a600ea061479')}
              </Typography>
              <Typography color="textSecondary">{email.split(',').join(', ')}</Typography>
            </InfoBlock>
          )}
          {url && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_641b164cff8497006bcbd2b3')}
              </Typography>
              <Typography color="textSecondary">{url}</Typography>
            </InfoBlock>
          )}
          {phone && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626c0c301a16a600ea06147d')}
              </Typography>
              <Typography color="textSecondary">{phone}</Typography>
            </InfoBlock>
          )}
          {(addressLine1 || addressLine2 || state || country || city || zipcode) && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_626c0c301a16a600ea06148d')}
              </Typography>
              <div className="flex flex-col">
                <Typography color="textSecondary">{addressLine1}</Typography>
                <Typography color="textSecondary">{addressLine2}</Typography>
                <Typography color="textSecondary">
                  {zipcode} {city} {state}
                </Typography>
                {country && <Typography color="textSecondary">{CountryCodes[country]}</Typography>}
              </div>
            </InfoBlock>
          )}
          {shippingAddress &&
            (shippingAddress.addressLine1 ||
              shippingAddress.addressLine2 ||
              shippingAddress.state ||
              shippingAddress.country ||
              shippingAddress.city ||
              shippingAddress.zipcode) && (
              <InfoBlock>
                <Typography variant="caption">
                  {translate('text_667d708c1359b49f5a5a822a')}
                </Typography>

                <div className="flex flex-col">
                  <Typography color="textSecondary">{shippingAddress.addressLine1}</Typography>
                  <Typography color="textSecondary">{shippingAddress.addressLine2}</Typography>
                  <Typography color="textSecondary">
                    {shippingAddress.zipcode} {shippingAddress.city} {shippingAddress.state}
                  </Typography>
                  {shippingAddress.country && (
                    <Typography color="textSecondary">
                      {CountryCodes[shippingAddress.country]}
                    </Typography>
                  )}
                </div>
              </InfoBlock>
            )}
        </InfoSection>

        <InfoSection title={translate('text_1737892224510vc53d10q4h5')}>
          {!!metadata?.length &&
            metadata.map((meta) => (
              <InfoBlock key={`customer-metadata-${meta.id}`}>
                <Typography variant="caption" noWrap>
                  {meta.key}
                </Typography>
                <Typography className="line-break-anywhere" color="textSecondary">
                  {meta.value}
                </Typography>
              </InfoBlock>
            ))}
        </InfoSection>

        <InfoSection title={translate('text_1737892224510jnd7cbdp2yg')}>
          {!!paymentProvider && !!linkedProvider?.name && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_62b1edddbf5f461ab9712795')}
              </Typography>
              <div>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar variant="connector-full" size="small">
                    {paymentProvider === ProviderTypeEnum?.Stripe ? (
                      <Stripe />
                    ) : paymentProvider === ProviderTypeEnum?.Gocardless ? (
                      <Gocardless />
                    ) : paymentProvider === ProviderTypeEnum?.Adyen ? (
                      <Adyen />
                    ) : paymentProvider === ProviderTypeEnum?.Cashfree ? (
                      <Cashfree />
                    ) : null}
                  </Avatar>
                  <Typography color="grey700">{linkedProvider?.name}</Typography>
                </Stack>
                {!!providerCustomer && !!providerCustomer?.providerCustomerId && (
                  <>
                    {paymentProvider === ProviderTypeEnum?.Stripe ? (
                      <InlineLink
                        target="_blank"
                        rel="noopener noreferrer"
                        to={buildStripeCustomerUrl(providerCustomer?.providerCustomerId)}
                      >
                        <Typography className="flex items-center gap-1" color="info600">
                          {providerCustomer?.providerCustomerId} <Icon name="outside" />
                        </Typography>
                      </InlineLink>
                    ) : (
                      <Typography color="textSecondary">
                        {providerCustomer?.providerCustomerId}
                      </Typography>
                    )}
                  </>
                )}
                {paymentProvider === ProviderTypeEnum?.Stripe &&
                  !!providerCustomer?.providerPaymentMethods?.length && (
                    <>
                      {providerCustomer?.providerPaymentMethods?.map((method) => (
                        <Typography key={`customer-payment-method-${method}`} color="textSecondary">
                          {translate(PaymentProviderMethodTranslationsLookup[method])}
                        </Typography>
                      ))}
                    </>
                  )}
              </div>
            </InfoBlock>
          )}

          {(!!customer?.netsuiteCustomer || !!connectedNetsuiteIntegration?.id) && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_66423cad72bbad009f2f568f')}
              </Typography>

              <div>
                {integrationsLoading ? (
                  <Stack flex={1} gap={3} marginTop={1}>
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-50" />
                  </Stack>
                ) : !!connectedNetsuiteIntegration &&
                  customer?.netsuiteCustomer?.externalCustomerId ? (
                  <Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="connector-full" size="small">
                        <Netsuite />
                      </Avatar>
                      <Typography color="grey700">{connectedNetsuiteIntegration?.name}</Typography>
                    </Stack>
                    <InlineLink
                      target="_blank"
                      rel="noopener noreferrer"
                      to={buildNetsuiteCustomerUrl(
                        connectedNetsuiteIntegration?.accountId,
                        customer?.netsuiteCustomer?.externalCustomerId,
                      )}
                    >
                      <Typography className="flex items-center gap-1" color="info600">
                        {customer?.netsuiteCustomer?.externalCustomerId} <Icon name="outside" />
                      </Typography>
                    </InlineLink>
                  </Stack>
                ) : null}
              </div>
            </InfoBlock>
          )}

          {(!!customer?.xeroCustomer || !!connectedXeroIntegration?.id) && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_66423cad72bbad009f2f568f')}
              </Typography>
              <div>
                {integrationsLoading ? (
                  <Stack flex={1} gap={3} marginTop={1}>
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-50" />
                  </Stack>
                ) : !!connectedXeroIntegration && customer?.xeroCustomer?.externalCustomerId ? (
                  <Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="connector-full" size="small">
                        <Xero />
                      </Avatar>
                      <Typography color="grey700">{connectedXeroIntegration?.name}</Typography>
                    </Stack>
                    <InlineLink
                      target="_blank"
                      rel="noopener noreferrer"
                      to={buildXeroCustomerUrl(customer?.xeroCustomer?.externalCustomerId)}
                    >
                      <Typography className="flex items-center gap-1" color="info600">
                        {customer?.xeroCustomer?.externalCustomerId} <Icon name="outside" />
                      </Typography>
                    </InlineLink>
                  </Stack>
                ) : null}
              </div>
            </InfoBlock>
          )}

          {!!connectedAnrokIntegration && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_6668821d94e4da4dfd8b3840')}
              </Typography>
              <div>
                {integrationsLoading ? (
                  <Stack flex={1} gap={3} marginTop={1}>
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-50" />
                  </Stack>
                ) : !!connectedAnrokIntegration && customer?.anrokCustomer?.integrationId ? (
                  <Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="connector-full" size="small">
                        <Anrok />
                      </Avatar>
                      <Typography color="grey700">{connectedAnrokIntegration?.name}</Typography>
                    </Stack>
                    {!!connectedAnrokIntegration.externalAccountId &&
                      customer?.anrokCustomer?.externalCustomerId && (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildAnrokCustomerUrl(
                            connectedAnrokIntegration.externalAccountId,
                            customer?.anrokCustomer?.externalCustomerId,
                          )}
                        >
                          <Typography className="flex items-center gap-1" color="info600">
                            {customer?.anrokCustomer?.externalCustomerId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </Stack>
                ) : null}
              </div>
            </InfoBlock>
          )}

          {!!connectedHubspotIntegration && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_1728658962985xpfdvl5ru8a')}
              </Typography>

              <div>
                {integrationsLoading ? (
                  <Stack flex={1} gap={3} marginTop={1}>
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-50" />
                  </Stack>
                ) : !!connectedHubspotIntegration &&
                  customer?.hubspotCustomer?.integrationId &&
                  customer?.hubspotCustomer.targetedObject ? (
                  <Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="connector" size="small">
                        <Hubspot />
                      </Avatar>
                      <Typography color="grey700">{connectedHubspotIntegration?.name}</Typography>
                    </Stack>
                    <Typography variant="body" color="grey700">
                      {translate(
                        getTargetedObjectTranslationKey[customer?.hubspotCustomer.targetedObject],
                      )}
                    </Typography>
                    {!!connectedHubspotIntegration.portalId &&
                      customer?.hubspotCustomer?.externalCustomerId &&
                      !!customer?.hubspotCustomer.targetedObject && (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildHubspotObjectUrl({
                            portalId: connectedHubspotIntegration.portalId,
                            objectId: customer?.hubspotCustomer?.externalCustomerId,
                            targetedObject: customer?.hubspotCustomer.targetedObject,
                          })}
                        >
                          <Typography className="flex flex-row items-center gap-1" color="info600">
                            {customer?.hubspotCustomer?.externalCustomerId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </Stack>
                ) : null}
              </div>
            </InfoBlock>
          )}

          {!!connectedSalesforceIntegration && (
            <InfoBlock>
              <Typography variant="caption">
                {translate('text_1728658962985xpfdvl5ru8a')}
              </Typography>
              <div>
                {integrationsLoading ? (
                  <Stack flex={1} gap={3} marginTop={1}>
                    <Skeleton variant="text" className="w-50" />
                    <Skeleton variant="text" className="w-50" />
                  </Stack>
                ) : !!connectedSalesforceIntegration &&
                  customer?.salesforceCustomer?.integrationId ? (
                  <Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="connector-full" size="small">
                        <Salesforce />
                      </Avatar>
                      <Typography color="grey700">
                        {connectedSalesforceIntegration?.name}
                      </Typography>
                    </Stack>
                    {!!connectedSalesforceIntegration.instanceId &&
                      customer?.salesforceCustomer?.externalCustomerId && (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={buildSalesforceUrl({
                            instanceId: connectedSalesforceIntegration.instanceId,
                            externalCustomerId: customer.salesforceCustomer.externalCustomerId,
                          })}
                        >
                          <Typography className="flex items-center gap-1" color="info600">
                            {customer?.salesforceCustomer?.externalCustomerId}{' '}
                            <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </Stack>
                ) : null}
              </div>
            </InfoBlock>
          )}
        </InfoSection>
      </div>
    </div>
  )
}
