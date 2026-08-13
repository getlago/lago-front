import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { ConnectionComboBoxLabel } from '~/components/customerConnections/ConnectionComboBox'
import { ConnectionDrawerSection } from '~/components/customerConnections/ConnectionDrawerSection'
import type { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData } from '~/components/form'
import { getHubspotTargetedObjectTranslationKey } from '~/core/constants/form'
import {
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { getAllIntegrationForAnIntegrationType } from '~/pages/createCustomers/common/getAllIntegrationForAnIntegrationType'
import { useAccountingProviders } from '~/pages/createCustomers/common/useAccountingProviders'
import { useCrmProviders } from '~/pages/createCustomers/common/useCrmProviders'
import { usePaymentProviders } from '~/pages/createCustomers/common/usePaymentProviders'
import { useTaxProviders } from '~/pages/createCustomers/common/useTaxProviders'

import { getSubsidiaryLabel } from './utils'

import { useAccountingProvidersSubsidaries } from '../accountingProvidersAccordion/useAccountingProvidersSubsidaries'
import StripePaymentProviderContent from '../paymentProvidersAccordion/StripePaymentProviderContent'

/** Payment providers that don't support linking/creating a provider customer */
const PROVIDERS_WITHOUT_MAPPING: ReadonlySet<ProviderTypeEnum> = new Set([
  ProviderTypeEnum.Cashfree,
  ProviderTypeEnum.Flutterwave,
])

type ConnectionDrawerProviderContentProps = {
  form: CustomerConnectionDrawerFormApi
  category: ConnectionCategory
  /**
   * The customer had this category's connection PERSISTED at load (baseline
   * `hadInitial*IntegrationCustomer` / `hadPaymentProvider` semantics): its
   * identity fields are locked. Connections added in the current session
   * stay fully editable on re-open.
   */
  hadInitialConnection: boolean
  /** The customer itself is being edited (drives the "will be created after editing" alerts) */
  isCustomerEdition: boolean
}

/**
 * Provider-specific body of the connection drawer, on the customer
 * create/edit surface: the provider-specific info alert, the shared
 * "Customer mapping" section (external customer id + create-automatically
 * toggle) and the per-provider extras (NetSuite subsidiary, Hubspot targeted
 * object, Stripe payment methods).
 */
export const ConnectionDrawerProviderContent = ({
  form,
  category,
  hadInitialConnection,
  isCustomerEdition,
}: ConnectionDrawerProviderContentProps) => {
  const { translate } = useInternationalization()

  const { paymentProviders, getPaymentProvider } = usePaymentProviders()
  const { accountingProviders, getAccountingProviderFromCode } = useAccountingProviders()
  const { taxProviders, getTaxProviderFromCode } = useTaxProviders()
  const { crmProviders, getCrmProviderFromCode } = useCrmProviders()

  const providerCode = useStore(form.store, (state) => state.values.providerCode)
  const syncWithProvider = useStore(form.store, (state) => state.values.syncWithProvider)
  const targetedObject = useStore(form.store, (state) => state.values.targetedObject)

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
    // A set code that is transiently unresolvable (org providers still
    // loading) must not clobber a prefilled providerType
    if (providerCode && !resolvedProviderType) return
    // Derived field: don't touch field meta or the close warning fires untouched
    form.setFieldValue('providerType', resolvedProviderType, { dontUpdateMeta: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedProviderType, providerCode])

  // Resolve the selected org integration object (data-driven copy + the
  // NetSuite subsidiaries query)
  const selectedIntegration = useMemo(() => {
    if (!providerCode || !resolvedProviderType) return undefined

    const getPool = () => {
      switch (category) {
        case ConnectionCategory.Accounting:
          return accountingProviders
        case ConnectionCategory.Tax:
          return taxProviders
        case ConnectionCategory.Crm:
          return crmProviders
        default:
          return undefined
      }
    }
    const pool = getPool()

    if (!pool) return undefined

    return getAllIntegrationForAnIntegrationType({
      integrationType: resolvedProviderType as IntegrationTypeEnum,
      allIntegrationsData: pool,
    })?.find((integration) => integration.code === providerCode)
  }, [
    category,
    providerCode,
    resolvedProviderType,
    accountingProviders,
    taxProviders,
    crmProviders,
  ])

  const selectedNetsuiteIntegration =
    resolvedProviderType === IntegrationTypeEnum.Netsuite
      ? (selectedIntegration as NetsuiteIntegration | undefined)
      : undefined

  const { subsidiariesData } = useAccountingProvidersSubsidaries(selectedNetsuiteIntegration?.id)

  const connectedIntegrationSubsidiaries: BasicComboBoxData[] = useMemo(() => {
    if (!subsidiariesData?.integrationSubsidiaries?.collection.length) return []

    return subsidiariesData.integrationSubsidiaries.collection.map((integrationSubsidiary) => ({
      value: integrationSubsidiary.externalId,
      label: getSubsidiaryLabel(integrationSubsidiary),
      labelNode: (
        <ConnectionComboBoxLabel
          label={integrationSubsidiary.externalName ?? ''}
          subLabel={integrationSubsidiary.externalId}
        />
      ),
    }))
  }, [subsidiariesData?.integrationSubsidiaries?.collection])

  if (!providerCode || !resolvedProviderType) return null

  const connectionName =
    category === ConnectionCategory.Payment
      ? (paymentProviders?.paymentProviders?.collection.find((p) => p.code === providerCode)
          ?.name ?? providerCode)
      : (selectedIntegration?.name ?? providerCode)

  const isIdAndSyncVisible =
    resolvedProviderType !== IntegrationTypeEnum.Hubspot || !!targetedObject

  const isMappingSupported = !(
    category === ConnectionCategory.Payment &&
    PROVIDERS_WITHOUT_MAPPING.has(resolvedProviderType as ProviderTypeEnum)
  )

  const getSyncLabelKey = () => {
    // Anrok creates the customer at invoice creation, not immediately
    if (resolvedProviderType === IntegrationTypeEnum.Anrok) return 'text_66b4e77677f8c600c8d50ea7'
    if (resolvedProviderType === ProviderTypeEnum.Gocardless) return 'text_635bdbda84c98758f9bba8aa'
    if (resolvedProviderType === ProviderTypeEnum.Adyen) return 'text_645d0728ea0a5a7bbf76d5c7'
    if (resolvedProviderType === ProviderTypeEnum.Moneyhash) return 'text_1733992108437qlovqhjhqj4'
    if (resolvedProviderType === ProviderTypeEnum.Stripe) return 'text_635bdbda84c98758f9bba89e'

    return 'text_66423cad72bbad009f2f569e'
  }

  return (
    <>
      {isMappingSupported && (
        <ConnectionDrawerSection>
          {/* Customer mapping */}
          <Typography variant="subhead1" color="grey700">
            {translate('text_1784649473978atfeqnr073f')}
          </Typography>

          {resolvedProviderType === IntegrationTypeEnum.Hubspot && (
            <form.AppField name="targetedObject">
              {(field) => (
                <field.ComboBoxField
                  disableClearable
                  label={translate('text_17290677918809xyyuizjvtk')}
                  disabled={hadInitialConnection}
                  data={[
                    {
                      label: translate(
                        getHubspotTargetedObjectTranslationKey[
                          HubspotTargetedObjectsEnum.Companies
                        ],
                      ),
                      value: HubspotTargetedObjectsEnum.Companies,
                    },
                    {
                      label: translate(
                        getHubspotTargetedObjectTranslationKey[HubspotTargetedObjectsEnum.Contacts],
                      ),
                      value: HubspotTargetedObjectsEnum.Contacts,
                    },
                  ]}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          )}

          {/* Hubspot: the id/sync pair only makes sense once a targeted object is chosen */}
          {isIdAndSyncVisible && (
            <>
              <form.AppField name="externalCustomerId">
                {(field) => (
                  <field.TextInputField
                    disabled={!!syncWithProvider || hadInitialConnection}
                    label={translate('text_1784649473978u6kmffzlw0b', { connectionName })}
                    description={translate('text_1784649473978uuc3oggbf1r', { connectionName })}
                    placeholder={translate('text_1784649473978i3wq11ccip3')}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="syncWithProvider"
                listeners={{
                  onChange: ({ value }) => {
                    if (!value) return
                    // Baseline semantics: payment always clears the typed id;
                    // integrations keep it during customer edition
                    if (category !== ConnectionCategory.Payment && isCustomerEdition) return
                    form.setFieldValue('externalCustomerId', '')
                  },
                }}
              >
                {(field) => (
                  <field.CheckboxField
                    label={translate(getSyncLabelKey(), { connectionName })}
                    disabled={hadInitialConnection}
                  />
                )}
              </form.AppField>
            </>
          )}

          {/* NetSuite requires a subsidiary when creating the customer there */}
          {resolvedProviderType === IntegrationTypeEnum.Netsuite && !!syncWithProvider && (
            <form.AppField name="subsidiaryId">
              {(field) => (
                <field.ComboBoxField
                  data={connectedIntegrationSubsidiaries}
                  disabled={hadInitialConnection}
                  label={translate('text_66423cad72bbad009f2f56a0')}
                  placeholder={translate('text_66423cad72bbad009f2f56a2')}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          )}

          {/* Newly-added synced connection on an existing customer */}
          {isCustomerEdition && !hadInitialConnection && !!syncWithProvider && (
            <>
              {resolvedProviderType === IntegrationTypeEnum.Netsuite && (
                <Alert type="info">{translate('text_66423cad72bbad009f2f56a4')}</Alert>
              )}
              {resolvedProviderType === IntegrationTypeEnum.Xero && (
                <Alert type="info">{translate('text_667d39dc1a765800d28d0607')}</Alert>
              )}
              {resolvedProviderType === IntegrationTypeEnum.Hubspot && (
                <Alert type="info">{translate('text_1729067791880abj1lzd7dn9')}</Alert>
              )}
            </>
          )}
        </ConnectionDrawerSection>
      )}

      {resolvedProviderType === ProviderTypeEnum.Stripe && (
        <ConnectionDrawerSection>
          <StripePaymentProviderContent
            form={form}
            fields={{ providerPaymentMethods: 'providerPaymentMethods' }}
          />
        </ConnectionDrawerSection>
      )}
    </>
  )
}
