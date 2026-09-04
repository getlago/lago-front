import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { integrationAvatarMapping, paymentAvatarMapping } from '~/components/avatarMappings'
import { AddConnectionMenu } from '~/components/customerConnections/AddConnectionMenu'
import { ConnectionDrawerProviderContent } from '~/components/customerConnections/ConnectionDrawerProviderContent'
import {
  ConnectionFormValues,
  CustomerConnectionDrawer,
} from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  CustomerConnectionRow,
  CustomerConnectionsList,
} from '~/components/customerConnections/CustomerConnectionsList'
import { MANUAL_CONNECTION_CODE } from '~/components/customerConnections/customerIntegrationConst'
import { getConnectionRowId } from '~/components/customerConnections/getConnectionRowId'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { useCustomerConnectionDrawer } from '~/components/customerConnections/useCustomerConnectionDrawer'
import {
  getIntegrationCustomerForCategory,
  getProviderPaymentConnection,
  INTEGRATION_CATEGORIES,
} from '~/components/customers/connectionsSection/utils'
import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import {
  AddCustomerDrawerFragment,
  IntegrationTypeEnum,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import {
  CreateCustomerDefaultValues,
  emptyCreateCustomerDefaultValues,
} from '~/pages/createCustomers/formInitialization/validationSchema'

type FormPaymentConnection = NonNullable<
  CreateCustomerDefaultValues['paymentProviderCustomers']
>[number]
type FormIntegrationConnection = NonNullable<
  CreateCustomerDefaultValues['integrationCustomers']
>[number]

type ExternalAppsAccordionProps = {
  isEdition: boolean
  customer: AddCustomerDrawerFragment | null | undefined
}

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
      allAccountingIntegrations,
      allTaxIntegrations,
      allCrmIntegrations,
    } = useConnectionOptions()

    const { drawerRef, openCreate, openEdit } = useCustomerConnectionDrawer()

    const paymentProviderCustomers = useStore(
      form.store,
      (state) => state.values.paymentProviderCustomers,
    )
    const integrationCustomers = useStore(form.store, (state) => state.values.integrationCustomers)

    // The provider-backed payment connection in the form; persisted manual
    // rows stay in the array (id round-trip) but are never surfaced
    const providerPaymentConnection = paymentProviderCustomers?.find(
      (connection) => connection.code !== MANUAL_CONNECTION_CODE,
    )

    const getFormIntegrationConnection = (
      category: ConnectionCategory,
    ): FormIntegrationConnection | undefined =>
      integrationCustomers?.find((connection) => connection.category === category)

    const integrationListsByCategory = {
      [ConnectionCategory.Accounting]: allAccountingIntegrations,
      [ConnectionCategory.Tax]: allTaxIntegrations,
      [ConnectionCategory.Crm]: allCrmIntegrations,
    }

    // A connection is "persisted" only when the one CURRENTLY in the form is
    // the one saved on the customer (same code): a connection deleted and
    // re-added in-session is a new link and must stay fully editable.
    // Integration categories also require the referenced org integration to
    // still exist, so a dangling link stays fixable.
    const isPersistedIntegrationConnection = (
      category: Exclude<ConnectionCategory, ConnectionCategory.Payment>,
    ): boolean => {
      const persisted = customer ? getIntegrationCustomerForCategory(customer, category) : undefined
      const formConnection = getFormIntegrationConnection(category)

      if (!persisted?.integrationCode || !formConnection?.providerCode) return false
      if (persisted.integrationCode !== formConnection.providerCode) return false

      return integrationListsByCategory[category].some(
        (integration) => integration.code === persisted.integrationCode,
      )
    }

    const hadInitialConnection: Record<ConnectionCategory, boolean> = {
      [ConnectionCategory.Payment]:
        !!customer &&
        !!getProviderPaymentConnection(customer)?.providerCustomerId &&
        !!providerPaymentConnection?.providerCode &&
        customer.paymentProviderCode === providerPaymentConnection.providerCode,
      [ConnectionCategory.Accounting]: isPersistedIntegrationConnection(
        ConnectionCategory.Accounting,
      ),
      [ConnectionCategory.Tax]: isPersistedIntegrationConnection(ConnectionCategory.Tax),
      [ConnectionCategory.Crm]: isPersistedIntegrationConnection(ConnectionCategory.Crm),
    }

    // ------- Rows derived from the customer form connection arrays -------
    const rows: CustomerConnectionRow[] = useMemo(() => {
      const result: CustomerConnectionRow[] = []

      if (providerPaymentConnection?.providerCode) {
        const provider = paymentProviders?.paymentProviders?.collection.find(
          (p) => p.code === providerPaymentConnection.providerCode,
        )

        result.push({
          id: getConnectionRowId(
            ConnectionCategory.Payment,
            providerPaymentConnection.providerCode,
          ),
          category: ConnectionCategory.Payment,
          name: provider?.name ?? providerPaymentConnection.providerCode,
          code: providerPaymentConnection.providerCode,
          icon: providerPaymentConnection.providerType
            ? paymentAvatarMapping[providerPaymentConnection.providerType]
            : undefined,
        })
      }

      const orgIntegrationsByCategory = {
        [ConnectionCategory.Accounting]: allAccountingIntegrations,
        [ConnectionCategory.Tax]: allTaxIntegrations,
        [ConnectionCategory.Crm]: allCrmIntegrations,
      }

      for (const category of INTEGRATION_CATEGORIES) {
        const connection = integrationCustomers?.find((c) => c.category === category)

        if (!connection?.providerCode) continue

        const integration = orgIntegrationsByCategory[category].find(
          (i) => i.code === connection.providerCode,
        )

        result.push({
          id: getConnectionRowId(category, connection.providerCode),
          category,
          name: integration?.name ?? connection.providerCode,
          code: connection.providerCode,
          icon: connection.providerType
            ? integrationAvatarMapping[connection.providerType]
            : undefined,
        })
      }

      return result
    }, [
      providerPaymentConnection,
      integrationCustomers,
      paymentProviders?.paymentProviders?.collection,
      allAccountingIntegrations,
      allTaxIntegrations,
      allCrmIntegrations,
    ])

    // ------- Drawer persistence: write back into the form connection arrays -------
    const handleSaveConnection = (
      category: ConnectionCategory,
      values: ConnectionFormValues,
    ): boolean => {
      if (category === ConnectionCategory.Payment) {
        // Keep the persisted connection's id/code only when the provider is
        // unchanged: on a switch the backend must destroy the old link and
        // create a new one instead of updating the stale one
        const preserved =
          providerPaymentConnection?.providerCode === values.providerCode
            ? providerPaymentConnection
            : undefined

        const nextConnection: FormPaymentConnection = {
          id: preserved?.id,
          code: values.code || undefined,
          // Carried across a switch too: the replacement inherits the default
          // flag, otherwise a customer that already has another (manual)
          // connection would end up with no default at all
          isDefault: providerPaymentConnection?.isDefault,
          providerCode: values.providerCode,
          providerType: (values.providerType as ProviderTypeEnum) || undefined,
          providerCustomerId: values.externalCustomerId ?? '',
          syncWithProvider: values.syncWithProvider ?? false,
          providerPaymentMethods: values.providerPaymentMethods ?? {},
        }

        form.setFieldValue('paymentProviderCustomers', [
          ...(paymentProviderCustomers ?? []).filter(
            (connection) => connection.code === MANUAL_CONNECTION_CODE,
          ),
          nextConnection,
        ])

        return true
      }

      const existing = getFormIntegrationConnection(category)
      const preserved = existing?.providerCode === values.providerCode ? existing : undefined

      const nextConnection: FormIntegrationConnection = {
        id: preserved?.id,
        category,
        code: values.code || undefined,
        providerCode: values.providerCode,
        providerType: (values.providerType as IntegrationTypeEnum) || undefined,
        externalCustomerId: values.externalCustomerId ?? '',
        syncWithProvider: values.syncWithProvider ?? false,
        ...(category === ConnectionCategory.Accounting
          ? { subsidiaryId: values.subsidiaryId ?? '' }
          : {}),
        ...(category === ConnectionCategory.Crm ? { targetedObject: values.targetedObject } : {}),
      }

      form.setFieldValue('integrationCustomers', [
        ...(integrationCustomers ?? []).filter((connection) => connection.category !== category),
        nextConnection,
      ])

      // Local form state only — nothing can fail, the drawer always closes
      return true
    }

    // ------- Edit prefill: read the form connection back into single-connection values -------
    const getInitialValues = (category: ConnectionCategory): Partial<ConnectionFormValues> => {
      if (category === ConnectionCategory.Payment) {
        return {
          code: providerPaymentConnection?.code ?? '',
          providerCode: providerPaymentConnection?.providerCode,
          providerType: providerPaymentConnection?.providerType,
          externalCustomerId: providerPaymentConnection?.providerCustomerId ?? '',
          syncWithProvider: providerPaymentConnection?.syncWithProvider ?? false,
          providerPaymentMethods: providerPaymentConnection?.providerPaymentMethods ?? {},
        }
      }

      const connection = getFormIntegrationConnection(category)

      return {
        code: connection?.code ?? '',
        providerCode: connection?.providerCode,
        providerType: connection?.providerType,
        externalCustomerId: connection?.externalCustomerId ?? '',
        syncWithProvider: connection?.syncWithProvider ?? false,
        ...(category === ConnectionCategory.Accounting
          ? { subsidiaryId: connection?.subsidiaryId ?? '' }
          : {}),
        ...(category === ConnectionCategory.Crm
          ? { targetedObject: connection?.targetedObject }
          : {}),
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
          ? !!customer?.paymentProvider &&
            customer?.paymentProviderCode === providerPaymentConnection?.providerCode
          : hadInitialConnection[row.category]

      const lockedSelection = isProviderLocked
        ? { title: row.name, subtitle: row.code, icon: row.icon }
        : undefined

      openEdit(row.category, getInitialValues(row.category), lockedSelection)
    }

    // ------- Delete: remove the connection from the form array -------
    const handleDeleteConnection = (category: ConnectionCategory) => {
      if (category === ConnectionCategory.Payment) {
        // The persisted manual row stays: only provider connections are removed
        form.setFieldValue(
          'paymentProviderCustomers',
          (paymentProviderCustomers ?? []).filter(
            (connection) => connection.code === MANUAL_CONNECTION_CODE,
          ),
        )
        return
      }

      form.setFieldValue(
        'integrationCustomers',
        (integrationCustomers ?? []).filter((connection) => connection.category !== category),
      )
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
