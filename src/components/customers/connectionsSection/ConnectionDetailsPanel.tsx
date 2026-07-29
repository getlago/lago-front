import { Icon } from 'lago-design-system'
import { ReactNode } from 'react'

import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  CONNECTION_DETAILS_PANEL_TEST_ID,
  CONNECTION_EXTERNAL_LINK_TEST_ID,
  PaymentProviderMethodTranslationsLookup,
} from '~/components/customers/connectionsSection/constants'
import { getIntegrationCustomerForCategory } from '~/components/customers/connectionsSection/utils'
import { getConnectedIntegrations } from '~/components/customers/utils'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { InlineLink } from '~/components/InlineLink'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  buildAnrokCustomerUrl,
  buildAvalaraCustomerUrl,
  buildHubspotObjectUrl,
  buildNetsuiteCustomerUrl,
  buildSalesforceUrl,
  buildStripeCustomerUrl,
  buildXeroCustomerUrl,
} from '~/core/constants/externalUrls'
import {
  CustomerDetailsFragment,
  IntegrationsListForCustomerMainInfosQuery,
  IntegrationTypeEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ConnectionDetailsPanelProps = {
  row: CustomerConnectionRow
  customer: CustomerDetailsFragment
  integrationsData?: IntegrationsListForCustomerMainInfosQuery
  integrationsLoading: boolean
}

const ExternalIdValue = ({ externalId, url }: { externalId: string; url?: string }) => {
  if (!url) {
    return <Typography color="grey700">{externalId}</Typography>
  }

  return (
    <InlineLink
      target="_blank"
      rel="noopener noreferrer"
      to={url}
      data-test={CONNECTION_EXTERNAL_LINK_TEST_ID}
    >
      <Typography className="flex items-center gap-1" color="primary600">
        {externalId} <Icon name="outside" />
      </Typography>
    </InlineLink>
  )
}

/**
 * Right pane of the connections master-detail: the settings grid of the
 * selected connection. Two variants — the provider payment connection
 * (provider infos, Stripe deep link + enabled payment methods) and the
 * integration connections (org-integration infos + provider deep link). The
 * manual-payment variant lands with the default flow.
 */
export const ConnectionDetailsPanel = ({
  row,
  customer,
  integrationsData,
  integrationsLoading,
}: ConnectionDetailsPanelProps) => {
  const { translate } = useInternationalization()

  // Connection identity, shown by both variants
  const identityGrid = [
    {
      label: translate('text_6584550dc4cec7adf861504d'),
      value: row.name,
    },
    {
      label: translate('text_6584550dc4cec7adf8615051'),
      value: row.code,
    },
  ]

  const renderContent = (): ReactNode => {
    if (row.category === ConnectionCategory.Payment) {
      const { providerCustomer } = customer
      const isStripe = customer.paymentProvider === ProviderTypeEnum.Stripe

      return (
        <DetailsPage.InfoGrid
          grid={[
            ...identityGrid,
            !!providerCustomer?.providerCustomerId && {
              label: translate('text_1785242578759umo02bzreln'),
              value: (
                <ExternalIdValue
                  externalId={providerCustomer.providerCustomerId}
                  url={
                    isStripe
                      ? buildStripeCustomerUrl(providerCustomer.providerCustomerId)
                      : undefined
                  }
                />
              ),
            },
            isStripe &&
              !!providerCustomer?.providerPaymentMethods?.length && {
                label: translate('text_64aeb7b998c4322918c84204'),
                value: providerCustomer.providerPaymentMethods
                  .map((method) => translate(PaymentProviderMethodTranslationsLookup[method]))
                  .join(', '),
              },
          ]}
        />
      )
    }

    // Integration connections (accounting / tax / CRM)
    if (integrationsLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" className="w-50" />
          <Skeleton variant="text" className="w-50" />
        </div>
      )
    }

    const integrationCustomer = getIntegrationCustomerForCategory(customer, row.category)
    const externalCustomerId = integrationCustomer?.externalCustomerId

    const buildExternalUrl = (): string | undefined => {
      if (!externalCustomerId) return undefined

      switch (integrationCustomer?.integrationType) {
        case IntegrationTypeEnum.Netsuite: {
          const netsuite = getConnectedIntegrations(
            integrationsData,
            customer,
            'NetsuiteIntegration',
            'netsuiteCustomer',
          )

          return netsuite?.accountId
            ? buildNetsuiteCustomerUrl(netsuite.accountId, externalCustomerId)
            : undefined
        }
        case IntegrationTypeEnum.Xero:
          return buildXeroCustomerUrl(externalCustomerId)
        case IntegrationTypeEnum.Anrok: {
          const anrok = getConnectedIntegrations(
            integrationsData,
            customer,
            'AnrokIntegration',
            'anrokCustomer',
          )

          return anrok?.externalAccountId
            ? buildAnrokCustomerUrl(anrok.externalAccountId, externalCustomerId)
            : undefined
        }
        case IntegrationTypeEnum.Avalara:
          return buildAvalaraCustomerUrl(externalCustomerId)
        case IntegrationTypeEnum.Hubspot: {
          const hubspot = getConnectedIntegrations(
            integrationsData,
            customer,
            'HubspotIntegration',
            'hubspotCustomer',
          )
          const targetedObject = customer.hubspotCustomer?.targetedObject

          return hubspot?.portalId && targetedObject
            ? buildHubspotObjectUrl({
                portalId: hubspot.portalId,
                objectId: externalCustomerId,
                targetedObject,
              })
            : undefined
        }
        case IntegrationTypeEnum.Salesforce: {
          const salesforce = getConnectedIntegrations(
            integrationsData,
            customer,
            'SalesforceIntegration',
            'salesforceCustomer',
          )

          return salesforce?.instanceId
            ? buildSalesforceUrl({
                instanceId: salesforce.instanceId,
                externalCustomerId,
              })
            : undefined
        }
        default:
          return undefined
      }
    }

    return (
      <DetailsPage.InfoGrid
        grid={[
          ...identityGrid,
          !!externalCustomerId && {
            label: translate('text_1785242578759umo02bzreln'),
            value: <ExternalIdValue externalId={externalCustomerId} url={buildExternalUrl()} />,
          },
        ]}
      />
    )
  }

  return <div data-test={CONNECTION_DETAILS_PANEL_TEST_ID}>{renderContent()}</div>
}
