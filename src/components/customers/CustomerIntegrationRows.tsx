import { gql } from '@apollo/client'
import {
  Avatar,
  AvatarConnectorVariant,
  AvatarSize,
  Icon,
  Skeleton,
  Typography,
} from 'lago-design-system'

import { InfoRow } from '~/components/InfoRow'
import { InlineLink } from '~/components/InlineLink'
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
  CustomerMainInfosFragment,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  useIntegrationsListForCustomerMainInfosQuery,
  usePaymentProvidersListForCustomerMainInfosQuery,
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

const IntegrationsLoadingSkeleton = () => {
  return (
    <div className="mt-1 flex flex-1 flex-col gap-3">
      <Skeleton variant="text" className="w-50" />
      <Skeleton variant="text" className="w-50" />
    </div>
  )
}

gql`
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

const CustomerIntegrationRows = ({ customer }: { customer: CustomerMainInfosFragment }) => {
  const { translate } = useInternationalization()

  const { paymentProvider, providerCustomer } = customer

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

  const connectedNetsuiteIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (
        i,
      ): i is {
        __typename: 'NetsuiteIntegration'
        id: string
        name: string
        accountId?: string | null
      } => i.__typename === 'NetsuiteIntegration',
    )
    ?.find((integration) => integration?.id === customer?.netsuiteCustomer?.integrationId)

  const connectedXeroIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (i): i is { __typename: 'XeroIntegration'; id: string; name: string } =>
        i.__typename === 'XeroIntegration',
    )
    ?.find((integration) => integration?.id === customer?.xeroCustomer?.integrationId)

  const connectedAnrokIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (
        i,
      ): i is {
        __typename: 'AnrokIntegration'
        id: string
        name: string
        apiKey: string
        externalAccountId?: string | null
      } => i.__typename === 'AnrokIntegration',
    )
    ?.find((integration) => integration?.id === customer?.anrokCustomer?.integrationId)

  const connectedAvalaraIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (
        i,
      ): i is {
        __typename: 'AvalaraIntegration'
        id: string
        name: string
        accountId?: string | null
      } => i.__typename === 'AvalaraIntegration',
    )
    ?.find((integration) => integration?.id === customer?.avalaraCustomer?.integrationId)

  const connectedHubspotIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (
        i,
      ): i is {
        __typename: 'HubspotIntegration'
        id: string
        name: string
        portalId?: string | null
      } => i.__typename === 'HubspotIntegration',
    )
    ?.find((integration) => integration?.id === customer?.hubspotCustomer?.integrationId)

  const connectedSalesforceIntegration = integrationsData?.integrations?.collection
    ?.filter(
      (
        i,
      ): i is {
        __typename: 'SalesforceIntegration'
        id: string
        name: string
        instanceId: string
      } => i.__typename === 'SalesforceIntegration',
    )
    ?.find((integration) => integration?.id === customer?.salesforceCustomer?.integrationId)

  const customerIntegrations = [
    {
      integrationProvider: 'NetsuiteIntegration',
      canRender: !!customer?.netsuiteCustomer?.integrationId && !!connectedNetsuiteIntegration?.id,
      label: translate('text_66423cad72bbad009f2f568f'),
      additionalLabel: '',
      buildExternalUrl: () => {
        if (
          !connectedNetsuiteIntegration?.accountId ||
          !customer?.netsuiteCustomer?.externalCustomerId
        ) {
          return ''
        }

        return buildNetsuiteCustomerUrl(
          connectedNetsuiteIntegration.accountId,
          customer.netsuiteCustomer.externalCustomerId,
        )
      },
      integrationName: connectedNetsuiteIntegration?.name,
      integrationIcon: {
        icon: <Netsuite />,
        variant: 'connector-full' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.netsuiteCustomer?.externalCustomerId,
    },
    {
      integrationProvider: 'XeroIntegration',
      canRender: !!customer?.xeroCustomer?.integrationId && !!connectedXeroIntegration?.id,
      label: translate('text_66423cad72bbad009f2f568f'),
      additionalLabel: '',
      buildExternalUrl: () => {
        if (!customer?.xeroCustomer?.externalCustomerId) {
          return ''
        }

        return buildXeroCustomerUrl(customer.xeroCustomer.externalCustomerId)
      },
      integrationName: connectedXeroIntegration?.name,
      integrationIcon: {
        icon: <Xero />,
        variant: 'connector-full' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.xeroCustomer?.externalCustomerId,
    },
    {
      integrationProvider: 'AnrokIntegration',
      canRender: !!customer?.anrokCustomer?.integrationId && !!connectedAnrokIntegration?.id,
      label: translate('text_6668821d94e4da4dfd8b3840'),
      additionalLabel: '',
      buildExternalUrl: () => {
        if (
          !connectedAnrokIntegration?.externalAccountId ||
          !customer?.anrokCustomer?.externalCustomerId
        ) {
          return ''
        }

        return buildAnrokCustomerUrl(
          connectedAnrokIntegration.externalAccountId,
          customer.anrokCustomer.externalCustomerId,
        )
      },
      integrationName: connectedAnrokIntegration?.name,
      integrationIcon: {
        icon: <Anrok />,
        variant: 'connector-full' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.anrokCustomer?.externalCustomerId,
    },
    {
      integrationProvider: 'AvalaraIntegration',
      canRender: !!customer?.avalaraCustomer?.integrationId && !!connectedAvalaraIntegration?.id,
      label: translate('text_6668821d94e4da4dfd8b3840'),
      additionalLabel: '',
      buildExternalUrl: () => {
        if (!customer?.avalaraCustomer?.externalCustomerId) {
          return ''
        }

        return buildAvalaraCustomerUrl(customer.avalaraCustomer.externalCustomerId)
      },
      integrationName: connectedAvalaraIntegration?.name,
      integrationIcon: {
        icon: <Avalara />,
        variant: 'connector-full' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.avalaraCustomer?.externalCustomerId,
    },
    {
      integrationProvider: 'HubspotIntegration',
      canRender:
        !!connectedHubspotIntegration?.id &&
        customer?.hubspotCustomer?.integrationId &&
        customer?.hubspotCustomer.targetedObject,
      label: translate('text_1728658962985xpfdvl5ru8a'),
      additionalLabel: customer?.hubspotCustomer?.targetedObject
        ? translate(getTargetedObjectTranslationKey[customer.hubspotCustomer.targetedObject])
        : '',
      buildExternalUrl: () => {
        if (
          !connectedHubspotIntegration?.portalId ||
          !customer?.hubspotCustomer?.externalCustomerId ||
          !customer?.hubspotCustomer.targetedObject
        ) {
          return ''
        }

        return buildHubspotObjectUrl({
          portalId: connectedHubspotIntegration.portalId,
          objectId: customer?.hubspotCustomer?.externalCustomerId,
          targetedObject: customer?.hubspotCustomer.targetedObject,
        })
      },
      integrationName: connectedHubspotIntegration?.name,
      integrationIcon: {
        icon: <Hubspot />,
        variant: 'connector' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.hubspotCustomer?.externalCustomerId,
    },
    {
      integrationProvider: 'SalesforceIntegration',
      canRender:
        !!connectedSalesforceIntegration?.id &&
        customer?.salesforceCustomer?.externalCustomerId &&
        customer?.salesforceCustomer?.integrationId,
      label: translate('text_1728658962985xpfdvl5ru8a'),
      additionalLabel: '',
      buildExternalUrl: () => {
        if (
          !connectedSalesforceIntegration?.instanceId ||
          !customer?.salesforceCustomer?.externalCustomerId
        ) {
          return ''
        }

        return buildSalesforceUrl({
          instanceId: connectedSalesforceIntegration.instanceId,
          externalCustomerId: customer.salesforceCustomer.externalCustomerId,
        })
      },
      integrationName: connectedSalesforceIntegration?.name,
      integrationIcon: {
        icon: <Salesforce />,
        variant: 'connector-full' as AvatarConnectorVariant,
        size: 'small' as AvatarSize,
      },
      externalCustomerId: customer?.salesforceCustomer?.externalCustomerId,
    },
  ]

  return (
    <>
      {!!paymentProvider && !!linkedProvider?.name && (
        <InfoRow>
          <Typography variant="caption">{translate('text_62b1edddbf5f461ab9712795')}</Typography>
          <div>
            <div className="flex flex-row" data-test={linkedProvider?.name}>
              <PaymentProviderChip paymentProvider={paymentProvider} label={linkedProvider?.name} />
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

      {customerIntegrations.length > 0 &&
        customerIntegrations.map(
          (
            {
              integrationProvider,
              canRender,
              label,
              additionalLabel,
              buildExternalUrl,
              integrationName,
              integrationIcon,
              externalCustomerId,
            },
            i,
          ) => {
            if (!canRender) return null
            const externalLink = buildExternalUrl()

            return (
              <InfoRow key={`${integrationProvider}-${i}`}>
                <Typography variant="caption">{label}</Typography>

                <div data-test={integrationProvider}>
                  {integrationsLoading && <IntegrationsLoadingSkeleton />}
                  {!integrationsLoading && (
                    <div className="flex flex-row">
                      <div className="flex flex-row items-center gap-2">
                        <Avatar variant={integrationIcon.variant} size={integrationIcon.size}>
                          {integrationIcon.icon}
                        </Avatar>
                        <Typography color="grey700">{integrationName}</Typography>
                      </div>
                      {additionalLabel && (
                        <Typography className="ml-2" variant="body" color="grey700">
                          {additionalLabel}
                        </Typography>
                      )}
                      {externalLink && (
                        <InlineLink
                          target="_blank"
                          rel="noopener noreferrer"
                          to={externalLink}
                          data-test="external-integration-link"
                        >
                          <Typography className="flex items-center gap-1" color="primary600">
                            {externalCustomerId} <Icon name="outside" />
                          </Typography>
                        </InlineLink>
                      )}
                    </div>
                  )}
                </div>
              </InfoRow>
            )
          },
        )}
    </>
  )
}

export { CustomerIntegrationRows }
