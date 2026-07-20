import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { Alert } from '~/components/designSystem/Alert'
import { IntegrationTypeEnum, NetsuiteIntegration, ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { getAllIntegrationForAnIntegrationType } from '~/pages/createCustomers/common/getAllIntegrationForAnIntegrationType'
import { useAccountingProviders } from '~/pages/createCustomers/common/useAccountingProviders'
import { useCrmProviders } from '~/pages/createCustomers/common/useCrmProviders'
import { usePaymentProviders } from '~/pages/createCustomers/common/usePaymentProviders'
import { useTaxProviders } from '~/pages/createCustomers/common/useTaxProviders'

import NetsuiteAccountingProviderContent from '../accountingProvidersAccordion/NetsuiteAccountingProviderContent'
import XeroAccountingProviderContent from '../accountingProvidersAccordion/XeroAccountingProviderContent'
import HubspotCrmProviderContent from '../crmProvidersAccordion/HubspotCrmProviderContent'
import SalesforceCrmProviderContent from '../crmProvidersAccordion/SalesforceCrmProviderContent'
import StripePaymentProviderContent from '../paymentProvidersAccordion/StripePaymentProviderContent'
import AnrokTaxProviderContent from '../taxProvidersAccordion/AnrokTaxProviderContent'
import AvalaraTaxProviderContent from '../taxProvidersAccordion/AvalaraTaxProviderContent'

const INTEGRATION_IDENTITY_FIELDS = {
  externalCustomerId: 'externalCustomerId',
  syncWithProvider: 'syncWithProvider',
} as const

type ConnectionDrawerProviderContentProps = {
  form: CustomerConnectionDrawerFormApi
  category: ConnectionCategory
  /** Editing an already-added connection: its provider identity is locked */
  isConnectionEdition: boolean
  /** The customer itself is being edited (drives the "will be created after editing" alerts) */
  isCustomerEdition: boolean
}

/**
 * Provider-specific body of the connection drawer, on the customer
 * create/edit surface. Resolves the selected org integration/provider from
 * the drawer's `providerCode` and mounts the matching per-provider field
 * group with an identity `fields` mapping (the drawer form and the groups
 * share the single-connection value shape).
 */
export const ConnectionDrawerProviderContent = ({
  form,
  category,
  isConnectionEdition: isEdition,
  isCustomerEdition,
}: ConnectionDrawerProviderContentProps) => {
  const { translate } = useInternationalization()

  const { getPaymentProvider } = usePaymentProviders()
  const { accountingProviders, getAccountingProviderFromCode } = useAccountingProviders()
  const { getTaxProviderFromCode } = useTaxProviders()
  const { getCrmProviderFromCode } = useCrmProviders()

  const providerCode = useStore(form.store, (state) => state.values.providerCode)
  const syncWithProvider = useStore(form.store, (state) => state.values.syncWithProvider)

  const resolvedProviderType: string | undefined = useMemo(() => {
    if (!providerCode) return undefined

    switch (category) {
      case ConnectionCategory.Payment:
        return getPaymentProvider(providerCode) ?? undefined
      case ConnectionCategory.Accounting:
        return getAccountingProviderFromCode(providerCode) ?? undefined
      case ConnectionCategory.Tax:
        return getTaxProviderFromCode(providerCode) ?? undefined
      case ConnectionCategory.Crm:
        return getCrmProviderFromCode(providerCode) ?? undefined
      default:
        return undefined
    }
  }, [
    category,
    providerCode,
    getPaymentProvider,
    getAccountingProviderFromCode,
    getTaxProviderFromCode,
    getCrmProviderFromCode,
  ])

  // Keep the resolved provider type on the drawer form (drives the
  // category-specific validation refines)
  useEffect(() => {
    // Derived field: don't touch field meta or the close warning fires untouched
    form.setFieldValue('providerType', resolvedProviderType, { dontUpdateMeta: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedProviderType])

  const selectedNetsuiteIntegration = useMemo(() => {
    if (resolvedProviderType !== IntegrationTypeEnum.Netsuite) return undefined

    return getAllIntegrationForAnIntegrationType<NetsuiteIntegration>({
      integrationType: IntegrationTypeEnum.Netsuite,
      allIntegrationsData: accountingProviders,
    })?.find((integration) => integration.code === providerCode)
  }, [resolvedProviderType, accountingProviders, providerCode])

  if (!providerCode || !resolvedProviderType) return null

  if (category === ConnectionCategory.Payment) {
    const isSyncSupported = ![ProviderTypeEnum.Cashfree, ProviderTypeEnum.Flutterwave].includes(
      resolvedProviderType as ProviderTypeEnum,
    )

    const getSyncLabelKey = () => {
      if (resolvedProviderType === ProviderTypeEnum.Gocardless)
        return 'text_635bdbda84c98758f9bba8aa'
      if (resolvedProviderType === ProviderTypeEnum.Adyen) return 'text_645d0728ea0a5a7bbf76d5c7'
      if (resolvedProviderType === ProviderTypeEnum.Moneyhash)
        return 'text_1733992108437qlovqhjhqj4'

      return 'text_635bdbda84c98758f9bba89e'
    }

    return (
      <>
        {isSyncSupported && (
          <>
            <form.AppField name="externalCustomerId">
              {(field) => (
                <field.TextInputField
                  disabled={!!syncWithProvider || isEdition}
                  label={translate('text_62b328ead9a4caef81cd9ca0')}
                  placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                />
              )}
            </form.AppField>

            <form.AppField
              name="syncWithProvider"
              listeners={{
                onChange: ({ value }) => {
                  if (!value) return
                  form.setFieldValue('externalCustomerId', '')
                },
              }}
            >
              {(field) => (
                <field.CheckboxField label={translate(getSyncLabelKey())} disabled={isEdition} />
              )}
            </form.AppField>
          </>
        )}

        {resolvedProviderType === ProviderTypeEnum.Moneyhash && (
          <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
        )}

        {resolvedProviderType === ProviderTypeEnum.Stripe && (
          <StripePaymentProviderContent
            form={form}
            fields={{ providerPaymentMethods: 'providerPaymentMethods' }}
          />
        )}
      </>
    )
  }

  if (category === ConnectionCategory.Accounting) {
    return (
      <>
        {resolvedProviderType === IntegrationTypeEnum.Netsuite && (
          <NetsuiteAccountingProviderContent
            form={form}
            fields={{ ...INTEGRATION_IDENTITY_FIELDS, subsidiaryId: 'subsidiaryId' }}
            hadInitialNetsuiteIntegrationCustomer={isEdition}
            selectedNetsuiteIntegration={selectedNetsuiteIntegration}
            isEdition={isEdition}
          />
        )}
        {resolvedProviderType === IntegrationTypeEnum.Xero && (
          <XeroAccountingProviderContent
            form={form}
            fields={INTEGRATION_IDENTITY_FIELDS}
            hadInitialXeroIntegrationCustomer={isEdition}
            isEdition={isEdition}
          />
        )}
        {/* Newly-added synced Xero connection on an existing customer */}
        {resolvedProviderType === IntegrationTypeEnum.Xero &&
          isCustomerEdition &&
          !isEdition &&
          syncWithProvider && (
            <Alert type="info">{translate('text_667d39dc1a765800d28d0607')}</Alert>
          )}
      </>
    )
  }

  if (category === ConnectionCategory.Tax) {
    return (
      <>
        {resolvedProviderType === IntegrationTypeEnum.Anrok && (
          <AnrokTaxProviderContent
            form={form}
            fields={INTEGRATION_IDENTITY_FIELDS}
            hadInitialAnrokIntegrationCustomer={isEdition}
            isEdition={isEdition}
          />
        )}
        {resolvedProviderType === IntegrationTypeEnum.Avalara && (
          <AvalaraTaxProviderContent
            form={form}
            fields={INTEGRATION_IDENTITY_FIELDS}
            hadInitialAvalaraIntegrationCustomer={isEdition}
            isEdition={isEdition}
          />
        )}
      </>
    )
  }

  if (category === ConnectionCategory.Crm) {
    return (
      <>
        {resolvedProviderType === IntegrationTypeEnum.Hubspot && (
          <HubspotCrmProviderContent
            form={form}
            fields={{ ...INTEGRATION_IDENTITY_FIELDS, targetedObject: 'targetedObject' }}
            hadInitialHubspotIntegrationCustomer={isEdition}
            isEdition={isEdition}
          />
        )}
        {resolvedProviderType === IntegrationTypeEnum.Salesforce && (
          <SalesforceCrmProviderContent
            form={form}
            fields={INTEGRATION_IDENTITY_FIELDS}
            hadInitialSalesforceIntegrationCustomer={isEdition}
            isEdition={isEdition}
          />
        )}
        {/* Newly-added synced Hubspot connection on an existing customer */}
        {resolvedProviderType === IntegrationTypeEnum.Hubspot &&
          isCustomerEdition &&
          !isEdition &&
          syncWithProvider && (
            <Alert type="info">{translate('text_1729067791880abj1lzd7dn9')}</Alert>
          )}
      </>
    )
  }

  return null
}
