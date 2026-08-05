import { gql } from '@apollo/client'
import { useMemo, useState } from 'react'

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
import { getConnectionRowId } from '~/components/customerConnections/getConnectionRowId'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { useCustomerConnectionDrawer } from '~/components/customerConnections/useCustomerConnectionDrawer'
import { ConnectionDetailsPanel } from '~/components/customers/connectionsSection/ConnectionDetailsPanel'
import {
  CONNECTION_DETAILS_EDIT_TEST_ID,
  CUSTOMER_CONNECTIONS_SECTION_TEST_ID,
} from '~/components/customers/connectionsSection/constants'
import { PaymentConnectionPaymentMethods } from '~/components/customers/connectionsSection/PaymentConnectionPaymentMethods'
import { useCustomerConnectionRows } from '~/components/customers/connectionsSection/useCustomerConnectionRows'
import { useCustomerConnectionsPersistence } from '~/components/customers/connectionsSection/useCustomerConnectionsPersistence'
import { getIntegrationCustomerForCategory } from '~/components/customers/connectionsSection/utils'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  CustomerDetailsFragment,
  ProviderPaymentMethodsEnum,
  useIntegrationsListForCustomerMainInfosQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { tw } from '~/styles/utils'

gql`
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

type CustomerConnectionsSectionProps = {
  customer: CustomerDetailsFragment
}

/**
 * "Connections to external apps" — the customer-information master-detail:
 * category-grouped connection list on the left, settings of the selected
 * connection on the right, and the payment-methods block scoped to the
 * payment connection. Add / edit / delete persist immediately through the
 * dedicated per-connection mutations (useCustomerConnectionsPersistence).
 * The hardcoded manual-payment row lands with the default flow.
 */
export const CustomerConnectionsSection = ({ customer }: CustomerConnectionsSectionProps) => {
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()

  const connectionOptions = useConnectionOptions()
  const { drawerRef, openCreate, openEdit } = useCustomerConnectionDrawer()
  const { saveConnection, deleteConnection } = useCustomerConnectionsPersistence({
    customer,
    connectionOptions,
  })

  const { data: integrationsData, loading: integrationsLoading } =
    useIntegrationsListForCustomerMainInfosQuery({
      variables: { limit: 1000 },
      skip:
        !customer.netsuiteCustomer &&
        !customer.anrokCustomer &&
        !customer.avalaraCustomer &&
        !customer.xeroCustomer &&
        !customer.hubspotCustomer &&
        !customer.salesforceCustomer,
    })

  const rows = useCustomerConnectionRows({ customer, connectionOptions })

  // Derived selection, no effect: falls back to the first connection on
  // landing and whenever the selected connection is deleted — StrictMode-safe
  // by construction. Undefined when the customer has no connection yet.
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null)
  const selectedRow: CustomerConnectionRow | undefined =
    rows.find((row) => row.id === userSelectedId) ?? rows[0]

  const isProviderPaymentSelected = selectedRow?.category === ConnectionCategory.Payment

  const linkedPaymentProvider =
    connectionOptions.paymentProviders?.paymentProviders?.collection.find(
      (provider) => provider.code === customer.paymentProviderCode,
    )

  // One connection per type: connected categories are disabled in the add menu
  const presentCategories = useMemo(() => rows.map((row) => row.category), [rows])

  // Same "persisted slot" rule as the customer create/edit accordion, so the
  // drawer locks exactly the same fields on both surfaces: a payment
  // connection without a provider customer id (sync-only, or a provider that
  // has none) and a dangling integration link (its org integration was
  // deleted) both stay editable instead of being frozen.
  const isPersistedConnection = (category: ConnectionCategory): boolean => {
    if (category === ConnectionCategory.Payment) {
      return !!customer.providerCustomer?.providerCustomerId
    }

    const existing = getIntegrationCustomerForCategory(customer, category)

    if (!existing?.integrationCode) return false

    const orgIntegrations = {
      [ConnectionCategory.Accounting]: connectionOptions.allAccountingIntegrations,
      [ConnectionCategory.Tax]: connectionOptions.allTaxIntegrations,
      [ConnectionCategory.Crm]: connectionOptions.allCrmIntegrations,
    }[category as Exclude<ConnectionCategory, ConnectionCategory.Payment>]

    return orgIntegrations.some((integration) => integration.code === existing.integrationCode)
  }

  const getInitialValues = (category: ConnectionCategory): Partial<ConnectionFormValues> => {
    if (category === ConnectionCategory.Payment) {
      return {
        providerCode: customer.paymentProviderCode ?? undefined,
        providerType: customer.paymentProvider ?? undefined,
        externalCustomerId: customer.providerCustomer?.providerCustomerId ?? '',
        syncWithProvider: customer.providerCustomer?.syncWithProvider ?? false,
        providerPaymentMethods: (customer.providerCustomer?.providerPaymentMethods ?? []).reduce(
          (acc, method) => ({ ...acc, [method]: true }),
          {} as Partial<Record<ProviderPaymentMethodsEnum, boolean>>,
        ),
      }
    }

    const existing = getIntegrationCustomerForCategory(customer, category)

    return {
      providerCode: existing?.integrationCode ?? undefined,
      providerType: existing?.integrationType ?? undefined,
      externalCustomerId: existing?.externalCustomerId ?? '',
      syncWithProvider: existing?.syncWithProvider ?? false,
      ...(category === ConnectionCategory.Accounting && existing && 'subsidiaryId' in existing
        ? { subsidiaryId: existing.subsidiaryId ?? '' }
        : {}),
      ...(category === ConnectionCategory.Crm && existing && 'targetedObject' in existing
        ? { targetedObject: existing.targetedObject ?? undefined }
        : {}),
    }
  }

  // A persisted slot gets a locked provider (read-only Selector); a dangling
  // link keeps it editable so the connection can be re-pointed
  const openConnectionEdit = (row: CustomerConnectionRow) => {
    const lockedSelection = isPersistedConnection(row.category)
      ? { title: row.name, subtitle: row.code, icon: row.icon ?? null }
      : undefined

    openEdit(row.category, getInitialValues(row.category), lockedSelection)
  }

  const openDeleteDialog = (row: CustomerConnectionRow) => {
    centralizedDialog.open({
      title: translate('text_658461066530343fe1808cd7', { name: row.name }),
      description: translate(
        // Removing the payment connection also destroys its saved payment methods
        row.category === ConnectionCategory.Payment
          ? 'text_1785242578759sjqwj76842f'
          : 'text_17852425787592avwwyx3gvo',
      ),
      actionText: translate('text_65845f35d7d69c3ab4793dad'),
      colorVariant: 'danger',
      onAction: async () => {
        await deleteConnection(row.category)
      },
    })
  }

  const handleSaveConnection = async (
    category: ConnectionCategory,
    values: ConnectionFormValues,
    { isEdition }: { isEdition: boolean },
  ) => {
    const succeeded = await saveConnection(category, values, { isEdition })

    // The drawer only closes once onSave resolves — reject to keep it open
    // (and its values intact) when the mutation fails
    if (!succeeded) {
      throw new Error('Connection save failed')
    }

    if (values.providerCode) {
      setUserSelectedId(getConnectionRowId(category, values.providerCode))
    }
  }

  // The org-integration query only feeds the right pane's deep links: it must
  // not blank the list, which already has everything it needs
  const isLoading = connectionOptions.isLoading

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" className="w-50" />
          <Skeleton variant="text" className="w-50" />
          <Skeleton variant="text" className="w-50" />
        </div>
      )
    }

    // The customer has no connection yet — the manual-payment default view
    // lands with the default flow
    if (!selectedRow) {
      return (
        <GenericPlaceholder
          title={translate('text_1785248821375zwy6pnlk3q7')}
          subtitle={translate('text_1785248166214sgwoabtbgea')}
          image={<EmptyImage width="136" height="104" />}
        />
      )
    }

    return (
      <div className="flex flex-row">
        <div className="w-1/3 border-r border-grey-300">
          <CustomerConnectionsList
            rows={rows}
            grouped
            showTypeColumn={false}
            showStatusColumn
            selectedRowId={selectedRow.id}
            onRowClick={(row) => setUserSelectedId(row.id)}
            onEdit={openConnectionEdit}
            onDelete={openDeleteDialog}
          />
        </div>

        <div className="min-w-0 flex-1 pl-8">
          <div className={tw(isProviderPaymentSelected && 'pb-12 shadow-b')}>
            <PageSectionTitle
              title={translate('text_645d071272418a14c1c76a9a')}
              subtitle={translate('text_1784537967970afggowvwkgz')}
              action={{
                title: translate('text_626162c62f790600f850b75a'),
                onClick: () => openConnectionEdit(selectedRow),
                dataTest: CONNECTION_DETAILS_EDIT_TEST_ID,
              }}
            />

            <ConnectionDetailsPanel
              row={selectedRow}
              customer={customer}
              integrationsData={integrationsData}
              integrationsLoading={integrationsLoading}
            />
          </div>

          {isProviderPaymentSelected && (
            <div className="mt-12">
              <PaymentConnectionPaymentMethods
                customer={customer}
                linkedPaymentProvider={linkedPaymentProvider}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div data-test={CUSTOMER_CONNECTIONS_SECTION_TEST_ID}>
      <PageSectionTitle
        title={translate('text_1785242578759er0dvb0h15r')}
        subtitle={translate('text_1785242578759s1mnwttxzgz')}
        customAction={
          <AddConnectionMenu
            disabled={presentCategories.length === Object.values(ConnectionCategory).length}
            disabledCategories={presentCategories}
            onSelect={(category, { closePopper }) => {
              closePopper()
              openCreate(category)
            }}
          />
        }
      />

      {renderContent()}

      <CustomerConnectionDrawer
        ref={drawerRef}
        connectionOptions={connectionOptions.connectionOptions}
        onSave={handleSaveConnection}
        renderProviderContent={(drawerForm, { category }) => (
          <ConnectionDrawerProviderContent
            form={drawerForm}
            category={category}
            hadInitialConnection={isPersistedConnection(category)}
            isCustomerEdition
            // Saves are immediate here: the "created after editing in Lago"
            // notice belongs to the customer create/edit form only
            showDeferredSyncNotice={false}
          />
        )}
      />
    </div>
  )
}
