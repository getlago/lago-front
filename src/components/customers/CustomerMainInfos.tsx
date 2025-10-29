import { gql } from '@apollo/client'
import { Avatar, Icon } from 'lago-design-system'
import { FC, PropsWithChildren } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { CustomerInfoRows } from '~/components/customers/CustomerInfoRows'
import { Skeleton, Typography } from '~/components/designSystem'
import { InfoRow } from '~/components/InfoRow'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PaymentProviderChip } from '~/components/PaymentProviderChip'
import {
  buildAnrokCustomerUrl,
  buildAvalaraCustomerUrl,
  buildHubspotObjectUrl,
  buildNetsuiteCustomerUrl,
  buildSalesforceUrl,
  buildStripeCustomerUrl,
  buildXeroCustomerUrl,
} from '~/core/constants/externalUrls'
import { getTargetedObjectTranslationKey } from '~/core/constants/form'
import {
  AnrokIntegration,
  AvalaraIntegration,
  CustomerMainInfosFragment,
  HubspotIntegration,
  NetsuiteIntegration,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  SalesforceIntegration,
  useIntegrationsListForCustomerMainInfosQuery,
  usePaymentProvidersListForCustomerMainInfosQuery,
  XeroIntegration,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Anrok from '~/public/images/anrok.svg'
import Avalara from '~/public/images/avalara.svg'
import Hubspot from '~/public/images/hubspot.svg'
import Netsuite from '~/public/images/netsuite.svg'
import Salesforce from '~/public/images/salesforce.svg'
import Xero from '~/public/images/xero.svg'

const PaymentProviderMethodTranslationsLookup: Record<ProviderPaymentMethodsEnum, string> = {
  [ProviderPaymentMethodsEnum.BacsDebit]: 'text_65e1f90471bc198c0c934d92',
  [ProviderPaymentMethodsEnum.Card]: 'text_64aeb7b998c4322918c84208',
  [ProviderPaymentMethodsEnum.Link]: 'text_6686b316b672a6e75a29eea0',
  [ProviderPaymentMethodsEnum.SepaDebit]: 'text_64aeb7b998c4322918c8420c',
  [ProviderPaymentMethodsEnum.UsBankAccount]: 'text_65e1f90471bc198c0c934d8e',
  [ProviderPaymentMethodsEnum.Boleto]: 'text_1738234109827diqh4eswleu',
  [ProviderPaymentMethodsEnum.Crypto]: 'text_17394287699017cunbdlhnhf',
  [ProviderPaymentMethodsEnum.CustomerBalance]: 'text_1739432510045wh80q1wdt4z',
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

        ... on FlutterwaveProvider {
          id
          name
          code
        }

        ... on CashfreeProvider {
          id
          name
          code
        }

        ... on MoneyhashProvider {
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
        ... on AvalaraIntegration {
          __typename
          id
          name
          accountId
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

const InlineLink: FC<PropsWithChildren<LinkProps>> = ({ children, ...props }) => {
  return (
    <Link
      className="flex w-fit flex-row !shadow-none line-break-anywhere before:px-1 before:text-grey-700 before:content-['•'] hover:no-underline focus:ring-0"
      {...props}
    >
      {children}
    </Link>
  )
}

const IntegrationsLoadingSkeleton = () => {
  return (
    <div className="mt-1 flex flex-1 flex-col gap-3">
      <Skeleton variant="text" className="w-50" />
      <Skeleton variant="text" className="w-50" />
    </div>
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
        !customer?.avalaraCustomer &&
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

  const allAvalaraIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AvalaraIntegration',
  ) as AvalaraIntegration[] | undefined

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

  const connectedAvalaraIntegration = allAvalaraIntegrations?.find(
    (integration) => integration?.id === customer?.avalaraCustomer?.integrationId,
  ) as AvalaraIntegration

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

  const { paymentProvider, providerCustomer } = customer

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

        {!!paymentProvider && !!linkedProvider?.name && (
          <InfoRow>
            <Typography variant="caption">{translate('text_62b1edddbf5f461ab9712795')}</Typography>
            <div>
              <div className="flex flex-row">
                <PaymentProviderChip
                  paymentProvider={paymentProvider}
                  label={linkedProvider?.name}
                />
                {!!providerCustomer?.providerCustomerId && (
                  <>
                    {paymentProvider === ProviderTypeEnum?.Stripe ? (
                      <InlineLink
                        target="_blank"
                        rel="noopener noreferrer"
                        to={buildStripeCustomerUrl(providerCustomer?.providerCustomerId)}
                      >
                        <Typography className="flex items-center gap-1" color="primary600">
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
              </div>
              {paymentProvider === ProviderTypeEnum?.Stripe &&
                !!providerCustomer?.providerPaymentMethods?.length && (
                  <Typography color="grey600">
                    {providerCustomer?.providerPaymentMethods
                      ?.map((method) => translate(PaymentProviderMethodTranslationsLookup[method]))
                      .join(', ')}
                  </Typography>
                )}
            </div>
          </InfoRow>
        )}

        {(!!customer?.netsuiteCustomer || !!connectedNetsuiteIntegration?.id) && (
          <InfoRow>
            <Typography variant="caption">{translate('text_66423cad72bbad009f2f568f')}</Typography>

            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedNetsuiteIntegration &&
                customer?.netsuiteCustomer?.externalCustomerId && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector-full" size="small">
                        <Netsuite />
                      </Avatar>
                      <Typography color="grey700">{connectedNetsuiteIntegration?.name}</Typography>
                    </div>
                    <InlineLink
                      target="_blank"
                      rel="noopener noreferrer"
                      to={buildNetsuiteCustomerUrl(
                        connectedNetsuiteIntegration?.accountId,
                        customer?.netsuiteCustomer?.externalCustomerId,
                      )}
                    >
                      <Typography className="flex items-center gap-1" color="primary600">
                        {customer?.netsuiteCustomer?.externalCustomerId} <Icon name="outside" />
                      </Typography>
                    </InlineLink>
                  </div>
                )}
            </div>
          </InfoRow>
        )}

        {(!!customer?.xeroCustomer || !!connectedXeroIntegration?.id) && (
          <InfoRow>
            <Typography variant="caption">{translate('text_66423cad72bbad009f2f568f')}</Typography>
            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedXeroIntegration &&
                customer?.xeroCustomer?.externalCustomerId && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector-full" size="small">
                        <Xero />
                      </Avatar>
                      <Typography color="grey700">{connectedXeroIntegration?.name}</Typography>
                    </div>
                    <InlineLink
                      target="_blank"
                      rel="noopener noreferrer"
                      to={buildXeroCustomerUrl(customer?.xeroCustomer?.externalCustomerId)}
                    >
                      <Typography className="flex items-center gap-1" color="primary600">
                        {customer?.xeroCustomer?.externalCustomerId} <Icon name="outside" />
                      </Typography>
                    </InlineLink>
                  </div>
                )}
            </div>
          </InfoRow>
        )}

        {!!connectedAnrokIntegration && (
          <InfoRow>
            <Typography variant="caption">{translate('text_6668821d94e4da4dfd8b3840')}</Typography>
            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedAnrokIntegration &&
                customer?.anrokCustomer?.integrationId && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector-full" size="small">
                        <Anrok />
                      </Avatar>
                      <Typography color="grey700">{connectedAnrokIntegration?.name}</Typography>
                    </div>
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
                          <Typography className="flex items-center gap-1" color="primary600">
                            {customer?.anrokCustomer?.externalCustomerId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </div>
                )}
            </div>
          </InfoRow>
        )}

        {(!!customer?.avalaraCustomer || !!connectedAvalaraIntegration?.id) && (
          <InfoRow>
            <Typography variant="caption">{translate('text_6668821d94e4da4dfd8b3840')}</Typography>
            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedAvalaraIntegration &&
                customer?.avalaraCustomer?.externalCustomerId && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector-full" size="small">
                        <Avalara />
                      </Avatar>
                      <Typography color="grey700">{connectedAvalaraIntegration?.name}</Typography>
                    </div>
                    <InlineLink
                      target="_blank"
                      rel="noopener noreferrer"
                      to={buildAvalaraCustomerUrl(customer?.avalaraCustomer?.externalCustomerId)}
                    >
                      <Typography className="flex items-center gap-1" color="primary600">
                        {customer?.avalaraCustomer?.externalCustomerId} <Icon name="outside" />
                      </Typography>
                    </InlineLink>
                  </div>
                )}
            </div>
          </InfoRow>
        )}

        {!!connectedHubspotIntegration && (
          <InfoRow>
            <Typography variant="caption">{translate('text_1728658962985xpfdvl5ru8a')}</Typography>

            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedHubspotIntegration &&
                customer?.hubspotCustomer?.integrationId &&
                customer?.hubspotCustomer.targetedObject && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector" size="small">
                        <Hubspot />
                      </Avatar>
                      <Typography color="grey700">{connectedHubspotIntegration?.name}</Typography>
                    </div>
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
                          <Typography
                            className="flex flex-row items-center gap-1"
                            color="primary600"
                          >
                            {customer?.hubspotCustomer?.externalCustomerId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </div>
                )}
            </div>
          </InfoRow>
        )}

        {!!connectedSalesforceIntegration && (
          <InfoRow>
            <Typography variant="caption">{translate('text_1728658962985xpfdvl5ru8a')}</Typography>
            <div>
              {integrationsLoading && <IntegrationsLoadingSkeleton />}
              {!integrationsLoading &&
                !!connectedSalesforceIntegration &&
                customer?.salesforceCustomer?.integrationId && (
                  <div className="flex flex-row">
                    <div className="flex flex-row items-center gap-2">
                      <Avatar variant="connector-full" size="small">
                        <Salesforce />
                      </Avatar>
                      <Typography color="grey700">
                        {connectedSalesforceIntegration?.name}
                      </Typography>
                    </div>
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
                          <Typography className="flex items-center gap-1" color="primary600">
                            {customer?.salesforceCustomer?.externalCustomerId}{' '}
                            <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                  </div>
                )}
            </div>
          </InfoRow>
        )}
      </div>
    </div>
  )
}
