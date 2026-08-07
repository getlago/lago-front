import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { integrationAvatarMapping, paymentAvatarMapping } from '~/components/avatarMappings'
import { AddConnectionMenu } from '~/components/customerConnections/AddConnectionMenu'
import { ConnectionDrawerProviderContent } from '~/components/customerConnections/ConnectionDrawerProviderContent'
import {
  hasPersistedPaymentMapping,
  isConnectionProviderPersisted,
} from '~/components/customerConnections/connectionLockRules'
import {
  ConnectionFormValues,
  CustomerConnectionDrawer,
} from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  CustomerConnectionRow,
  CustomerConnectionsList,
} from '~/components/customerConnections/CustomerConnectionsList'
import { getConnectionRowId } from '~/components/customerConnections/getConnectionRowId'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { useCustomerConnectionDrawer } from '~/components/customerConnections/useCustomerConnectionDrawer'
import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import {
  AddCustomerDrawerFragment,
  CurrencyEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'

type ExternalAppsAccordionProps = {
  isEdition: boolean
  customer: AddCustomerDrawerFragment | null | undefined
}

type PersistedIntegrationCandidate = { integrationCode?: string | null } | null | undefined

const defaultProps: ExternalAppsAccordionProps = {
  isEdition: false,
  customer: null,
}

const ExternalAppsAccordion = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  render: function Render({ form, customer, isEdition }) {
    const { translate } = useInternationalization()

    const {
      connectionOptions,
      paymentProviders,
      getPaymentProvider,
      allAccountingIntegrations,
      allTaxIntegrations,
      allCrmIntegrations,
    } = useConnectionOptions()

    const { drawerRef, openCreate, openEdit } = useCustomerConnectionDrawer()

    const paymentProviderCode = useStore(form.store, (state) => state.values.paymentProviderCode)
    const paymentProviderCustomer = useStore(
      form.store,
      (state) => state.values.paymentProviderCustomer,
    )
    const accountingProviderCode = useStore(
      form.store,
      (state) => state.values.accountingProviderCode,
    )
    const accountingCustomer = useStore(form.store, (state) => state.values.accountingCustomer)
    const taxProviderCode = useStore(form.store, (state) => state.values.taxProviderCode)
    const taxCustomer = useStore(form.store, (state) => state.values.taxCustomer)
    const crmProviderCode = useStore(form.store, (state) => state.values.crmProviderCode)
    const crmCustomer = useStore(form.store, (state) => state.values.crmCustomer)

    const paymentProvider = getPaymentProvider(paymentProviderCode)

    const isIntegrationSlotPersisted = (
      category: ConnectionCategory,
      slotCode: string | undefined,
      candidates: PersistedIntegrationCandidate[],
      orgIntegrations: { code: string }[],
    ): boolean =>
      candidates.some((integrationCustomer) =>
        isConnectionProviderPersisted({
          category,
          customer,
          slotCode,
          integrationCustomer,
          orgIntegrations,
        }),
      )

    const hadInitialConnection: Record<ConnectionCategory, boolean> = {
      [ConnectionCategory.Payment]: hasPersistedPaymentMapping({
        customer,
        slotCode: paymentProviderCode,
      }),
      [ConnectionCategory.Accounting]: isIntegrationSlotPersisted(
        ConnectionCategory.Accounting,
        accountingProviderCode,
        [customer?.netsuiteCustomer, customer?.xeroCustomer],
        allAccountingIntegrations,
      ),
      [ConnectionCategory.Tax]: isIntegrationSlotPersisted(
        ConnectionCategory.Tax,
        taxProviderCode,
        [customer?.anrokCustomer, customer?.avalaraCustomer],
        allTaxIntegrations,
      ),
      [ConnectionCategory.Crm]: isIntegrationSlotPersisted(
        ConnectionCategory.Crm,
        crmProviderCode,
        [customer?.hubspotCustomer, customer?.salesforceCustomer],
        allCrmIntegrations,
      ),
    }

    // ------- Rows derived from the (one-per-type) customer form slots -------
    const rows: CustomerConnectionRow[] = useMemo(() => {
      const result: CustomerConnectionRow[] = []

      if (paymentProviderCode) {
        const provider = paymentProviders?.paymentProviders?.collection.find(
          (p) => p.code === paymentProviderCode,
        )

        result.push({
          id: getConnectionRowId(ConnectionCategory.Payment, paymentProviderCode),
          category: ConnectionCategory.Payment,
          name: provider?.name ?? paymentProviderCode,
          code: paymentProviderCode,
          icon: paymentProvider ? paymentAvatarMapping[paymentProvider] : undefined,
        })
      }

      if (accountingProviderCode) {
        const integration = allAccountingIntegrations.find((i) => i.code === accountingProviderCode)

        result.push({
          id: getConnectionRowId(ConnectionCategory.Accounting, accountingProviderCode),
          category: ConnectionCategory.Accounting,
          name: integration?.name ?? accountingProviderCode,
          code: accountingProviderCode,
          icon: accountingCustomer?.providerType
            ? integrationAvatarMapping[accountingCustomer.providerType]
            : undefined,
        })
      }

      if (taxProviderCode) {
        const integration = allTaxIntegrations.find((i) => i.code === taxProviderCode)

        result.push({
          id: getConnectionRowId(ConnectionCategory.Tax, taxProviderCode),
          category: ConnectionCategory.Tax,
          name: integration?.name ?? taxProviderCode,
          code: taxProviderCode,
          icon: taxCustomer?.providerType
            ? integrationAvatarMapping[taxCustomer.providerType]
            : undefined,
        })
      }

      if (crmProviderCode) {
        const integration = allCrmIntegrations.find((i) => i.code === crmProviderCode)

        result.push({
          id: getConnectionRowId(ConnectionCategory.Crm, crmProviderCode),
          category: ConnectionCategory.Crm,
          name: integration?.name ?? crmProviderCode,
          code: crmProviderCode,
          icon: crmCustomer?.providerType
            ? integrationAvatarMapping[crmCustomer.providerType]
            : undefined,
        })
      }

      return result
    }, [
      paymentProviderCode,
      paymentProvider,
      paymentProviders?.paymentProviders?.collection,
      accountingProviderCode,
      accountingCustomer?.providerType,
      taxProviderCode,
      taxCustomer?.providerType,
      crmProviderCode,
      crmCustomer?.providerType,
      allAccountingIntegrations,
      allTaxIntegrations,
      allCrmIntegrations,
    ])

    // ------- Drawer persistence: write back into the customer form slots -------
    const handleSaveConnection = (
      category: ConnectionCategory,
      values: ConnectionFormValues,
    ): boolean => {
      switch (category) {
        case ConnectionCategory.Payment:
          form.setFieldValue('paymentProviderCode', values.providerCode)
          form.setFieldValue('paymentProviderCustomer', {
            providerCustomerId: values.externalCustomerId ?? '',
            syncWithProvider: values.syncWithProvider ?? false,
            providerType: (values.providerType as ProviderTypeEnum) || undefined,
            providerPaymentMethods: values.providerPaymentMethods ?? {},
          })
          break
        case ConnectionCategory.Accounting:
          form.setFieldValue('accountingProviderCode', values.providerCode)
          form.setFieldValue('accountingCustomer', {
            // Keep the integration-customer id only when the connection is
            // unchanged: on a switch the backend must create a new link
            // instead of updating the stale one
            id: values.providerCode === accountingProviderCode ? accountingCustomer?.id : undefined,
            accountingCustomerId: values.externalCustomerId ?? '',
            syncWithProvider: values.syncWithProvider ?? false,
            providerType: (values.providerType as IntegrationTypeEnum) || undefined,
            subsidiaryId: values.subsidiaryId ?? '',
          })
          break
        case ConnectionCategory.Tax:
          form.setFieldValue('taxProviderCode', values.providerCode)
          form.setFieldValue('taxCustomer', {
            id: values.providerCode === taxProviderCode ? taxCustomer?.id : undefined,
            taxCustomerId: values.externalCustomerId ?? '',
            syncWithProvider: values.syncWithProvider ?? false,
            providerType: (values.providerType as IntegrationTypeEnum) || undefined,
          })
          break
        case ConnectionCategory.Crm:
          form.setFieldValue('crmProviderCode', values.providerCode)
          form.setFieldValue('crmCustomer', {
            id: values.providerCode === crmProviderCode ? crmCustomer?.id : undefined,
            crmCustomerId: values.externalCustomerId ?? '',
            syncWithProvider: values.syncWithProvider ?? false,
            providerType: (values.providerType as IntegrationTypeEnum) || undefined,
            targetedObject: values.targetedObject,
          })
          break
      }

      // Local form state only — nothing can fail, the drawer always closes
      return true
    }

    // ------- Edit prefill: read the slot back into single-connection values -------
    const getInitialValues = (category: ConnectionCategory): Partial<ConnectionFormValues> => {
      switch (category) {
        case ConnectionCategory.Payment:
          return {
            providerCode: paymentProviderCode,
            providerType: paymentProviderCustomer?.providerType,
            externalCustomerId: paymentProviderCustomer?.providerCustomerId ?? '',
            syncWithProvider: paymentProviderCustomer?.syncWithProvider ?? false,
            providerPaymentMethods: paymentProviderCustomer?.providerPaymentMethods ?? {},
          }
        case ConnectionCategory.Accounting:
          return {
            providerCode: accountingProviderCode,
            providerType: accountingCustomer?.providerType,
            externalCustomerId: accountingCustomer?.accountingCustomerId ?? '',
            syncWithProvider: accountingCustomer?.syncWithProvider ?? false,
            subsidiaryId: accountingCustomer?.subsidiaryId ?? '',
          }
        case ConnectionCategory.Tax:
          return {
            providerCode: taxProviderCode,
            providerType: taxCustomer?.providerType,
            externalCustomerId: taxCustomer?.taxCustomerId ?? '',
            syncWithProvider: taxCustomer?.syncWithProvider ?? false,
          }
        case ConnectionCategory.Crm:
          return {
            providerCode: crmProviderCode,
            providerType: crmCustomer?.providerType,
            externalCustomerId: crmCustomer?.crmCustomerId ?? '',
            syncWithProvider: crmCustomer?.syncWithProvider ?? false,
            targetedObject: crmCustomer?.targetedObject,
          }
      }
    }

    // Open the drawer in edit. Connections persisted at customer load get a
    // locked provider (read-only Selector); freshly-added ones stay editable.
    // Payment locks on the persisted provider itself (its field-level locks
    // still follow hadInitialConnection = persisted providerCustomerId, so a
    // sync-only connection keeps the legacy field editability).
    const openConnectionEdit = (row: CustomerConnectionRow) => {
      const isProviderLocked =
        row.category === ConnectionCategory.Payment
          ? isConnectionProviderPersisted({
              category: ConnectionCategory.Payment,
              customer,
              slotCode: paymentProviderCode,
            })
          : hadInitialConnection[row.category]

      const lockedSelection = isProviderLocked
        ? { title: row.name, subtitle: row.code, icon: row.icon }
        : undefined

      openEdit(row.category, getInitialValues(row.category), lockedSelection)
    }

    // ------- Delete: clear the slot (same behaviour as the legacy accordions) -------
    const handleDeleteConnection = (category: ConnectionCategory) => {
      switch (category) {
        case ConnectionCategory.Payment: {
          const currency = form.getFieldValue('currency')

          form.setFieldValue('paymentProviderCode', undefined)
          form.setFieldValue('paymentProviderCustomer', {
            providerCustomerId: '',
            syncWithProvider: false,
            providerType: undefined,
            providerPaymentMethods:
              currency === CurrencyEnum.Eur
                ? {
                    [ProviderPaymentMethodsEnum.Card]: true,
                    [ProviderPaymentMethodsEnum.SepaDebit]: true,
                  }
                : { [ProviderPaymentMethodsEnum.Card]: true },
          })
          break
        }
        case ConnectionCategory.Accounting:
          form.setFieldValue('accountingProviderCode', '')
          form.setFieldValue('accountingCustomer', {
            id: undefined,
            accountingCustomerId: '',
            syncWithProvider: false,
            providerType: undefined,
            subsidiaryId: '',
          })
          break
        case ConnectionCategory.Tax:
          form.setFieldValue('taxProviderCode', '')
          form.setFieldValue('taxCustomer', {
            id: undefined,
            taxCustomerId: '',
            syncWithProvider: false,
            providerType: undefined,
          })
          break
        case ConnectionCategory.Crm:
          form.setFieldValue('crmProviderCode', '')
          form.setFieldValue('crmCustomer', {
            id: undefined,
            crmCustomerId: '',
            syncWithProvider: false,
            providerType: undefined,
            targetedObject: undefined,
          })
          break
      }
    }

    const presentCategories = rows.map((row) => row.category)

    return (
      <Accordion
        variant="borderless"
        summary={
          <div className="flex flex-col gap-2">
            <Typography variant="subhead1">{translate('text_66423cad72bbad009f2f5689')}</Typography>
            <Typography variant="caption">{translate('text_1735828930375zjo8m3yh5ra')}</Typography>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <CustomerConnectionsList
            rows={rows}
            onRowClick={(row) => openConnectionEdit(row)}
            onEdit={(row) => openConnectionEdit(row)}
            onDelete={(row) => handleDeleteConnection(row.category)}
          />

          <AddConnectionMenu
            disabled={presentCategories.length === 4}
            disabledCategories={presentCategories}
            onSelect={(category, { closePopper }) => {
              closePopper()
              openCreate(category)
            }}
          />

          <CustomerConnectionDrawer
            ref={drawerRef}
            connectionOptions={connectionOptions}
            onSave={handleSaveConnection}
            renderProviderContent={(drawerForm, { category }) => (
              <ConnectionDrawerProviderContent
                form={drawerForm}
                category={category}
                hadInitialConnection={hadInitialConnection[category]}
                isCustomerEdition={isEdition && !!customer}
                showDeferredSyncNotice={isEdition && !!customer}
              />
            )}
          />
        </div>
      </Accordion>
    )
  },
})

export default ExternalAppsAccordion
