import { Icon } from 'lago-design-system'
import { ReactNode } from 'react'

import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { PROVIDERS_WITHOUT_CUSTOMER_MAPPING } from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import {
  CONNECTION_DETAILS_PANEL_TEST_ID,
  CONNECTION_EXTERNAL_LINK_TEST_ID,
  CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID,
  PaymentProviderMethodTranslationsLookup,
} from '~/components/customers/connectionsSection/constants'
import { getIntegrationCustomerForCategory } from '~/components/customers/connectionsSection/utils'
import { getConnectedIntegrations } from '~/components/customers/utils'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
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
import { Link } from '~/core/router'
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

/** Why the provider-side customer id is not there (yet) */
type MissingProviderIdReason = 'firstInvoiceSync' | 'syncInProgress' | 'unavailable'

const MISSING_PROVIDER_ID_COPY: Record<MissingProviderIdReason, string> = {
  firstInvoiceSync: 'text_1785753711141igxsly7fb5n',
  syncInProgress: 'text_1785759690733l7pmkg66hx1',
  unavailable: 'text_1785753711141yk91407ohum',
}

/**
 * An empty provider customer id is only an error when nothing is pending:
 * Anrok fills it on the first document sync, and a connection syncing with
 * its provider gets it from a background job moments after being created.
 * Anrok is checked first — it always syncs with its provider.
 */
const getMissingProviderIdReason = ({
  syncsOnFirstInvoice,
  syncWithProvider,
}: {
  syncsOnFirstInvoice: boolean
  syncWithProvider?: boolean | null
}): MissingProviderIdReason => {
  if (syncsOnFirstInvoice) return 'firstInvoiceSync'
  if (syncWithProvider) return 'syncInProgress'

  return 'unavailable'
}

/** The provider-side customer id, or an explanation of why it is missing */
const ProviderCustomerIdValue = ({
  externalId,
  url,
  missingIdReason,
}: {
  externalId?: string | null
  url?: string
  missingIdReason: MissingProviderIdReason
}): JSX.Element => {
  const { translate } = useInternationalization()

  if (!externalId) {
    return (
      <Typography color="grey500" data-test={CONNECTION_PROVIDER_ID_PLACEHOLDER_TEST_ID}>
        {translate(MISSING_PROVIDER_ID_COPY[missingIdReason])}
      </Typography>
    )
  }

  if (!url) {
    return <Typography color="grey700">{externalId}</Typography>
  }

  // Not `InlineLink`: it prefixes its content with a `•` separator, which only
  // reads correctly when the link trails another inline value
  return (
    <Link
      className="flex w-fit flex-row !shadow-none line-break-anywhere hover:no-underline focus:ring-0"
      target="_blank"
      rel="noopener noreferrer"
      to={url}
      data-test={CONNECTION_EXTERNAL_LINK_TEST_ID}
    >
      <Typography className="flex items-center gap-1" color="primary600">
        {externalId} <Icon name="outside" />
      </Typography>
    </Link>
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
      // Cashfree and Flutterwave have no provider-customer mapping at all, so
      // the id is always empty for them: the row would permanently claim a
      // healthy connection is broken. Drop it instead.
      const hasProviderMapping =
        !customer.paymentProvider ||
        !PROVIDERS_WITHOUT_CUSTOMER_MAPPING.has(customer.paymentProvider)

      return (
        <DetailsPage.InfoGrid
          grid={[
            ...identityGrid,
            hasProviderMapping && {
              label: translate('text_1785242578759umo02bzreln'),
              value: (
                <ProviderCustomerIdValue
                  externalId={providerCustomer?.providerCustomerId}
                  url={
                    isStripe && providerCustomer?.providerCustomerId
                      ? buildStripeCustomerUrl(providerCustomer.providerCustomerId)
                      : undefined
                  }
                  missingIdReason={getMissingProviderIdReason({
                    syncsOnFirstInvoice: false,
                    syncWithProvider: providerCustomer?.syncWithProvider,
                  })}
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
          {
            label: translate('text_1785242578759umo02bzreln'),
            value: (
              <ProviderCustomerIdValue
                externalId={externalCustomerId}
                url={buildExternalUrl()}
                missingIdReason={getMissingProviderIdReason({
                  syncsOnFirstInvoice:
                    integrationCustomer?.integrationType === IntegrationTypeEnum.Anrok,
                  syncWithProvider: integrationCustomer?.syncWithProvider,
                })}
              />
            ),
          },
        ]}
      />
    )
  }

  return <div data-test={CONNECTION_DETAILS_PANEL_TEST_ID}>{renderContent()}</div>
}
