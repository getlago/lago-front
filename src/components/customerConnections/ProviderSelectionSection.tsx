import { useStore } from '@tanstack/react-form'
import { ReactNode } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Avatar } from '~/components/designSystem/Avatar'
import { Selector } from '~/components/designSystem/Selector'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { buildConnectionComboBoxData, ConnectionComboBoxDataItem } from './ConnectionComboBox'
// Type-only import: must never drag the drawer stack (import.meta) into consumers/tests
import type { CustomerConnectionDrawerFormApi } from './CustomerConnectionDrawer'
import { CONNECTION_CATEGORY_SELECT_TITLE_KEYS, ConnectionCategory } from './types'

/**
 * When set, the provider is locked (edition of an already-persisted
 * connection): the combobox is replaced by a read-only Selector showing the
 * chosen connection.
 */
export type LockedConnectionSelection = {
  title: string
  subtitle?: string
  icon: ReactNode
}

export const PROVIDER_SELECTION_TITLE_TEST_ID = 'provider-selection-title'
export const PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID = 'provider-selection-locked-selector'

/** Payment provider info alerts, shown right in the selection block */
const PAYMENT_PROVIDER_INFO_ALERT_KEYS: Record<string, string> = {
  gocardless: 'text_635bdbda84c98758f9bba8ae',
  adyen: 'text_645d0728ea0a5a7bbf76d5c9',
  moneyhash: 'text_64aeb7b998c4322918c84214',
}

type ProviderSelectionSectionProps = {
  form: CustomerConnectionDrawerFormApi
  category: ConnectionCategory
  options: ConnectionComboBoxDataItem[]
  lockedSelection?: LockedConnectionSelection
}

/**
 * The "Select a <category> connection" block of the connection drawer: a
 * combobox while creating/editing an in-session connection, a read-only
 * Selector when the connection was already persisted on the customer.
 */
export const ProviderSelectionSection = ({
  form,
  category,
  options,
  lockedSelection,
}: ProviderSelectionSectionProps) => {
  const { translate } = useInternationalization()
  const providerCode = useStore(form.store, (state) => state.values.providerCode)

  const selectedOption = options.find((option) => option.value === providerCode)

  // Payment group = provider type (stripe/adyen/...) — drives the info alert
  const paymentInfoAlertKey =
    category === ConnectionCategory.Payment && selectedOption?.group
      ? PAYMENT_PROVIDER_INFO_ALERT_KEYS[selectedOption.group]
      : undefined

  return (
    <>
      <Typography variant="subhead1" color="grey700" data-test={PROVIDER_SELECTION_TITLE_TEST_ID}>
        {translate(CONNECTION_CATEGORY_SELECT_TITLE_KEYS[category])}
      </Typography>

      {lockedSelection ? (
        // Persisted connection: provider identity is read-only
        <Selector
          data-test={PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID}
          title={lockedSelection.title}
          subtitle={lockedSelection.subtitle}
          icon={
            <Avatar size="big" variant="connector-full">
              {lockedSelection.icon}
            </Avatar>
          }
          disabled
        />
      ) : (
        <form.AppField name="providerCode">
          {(field) => (
            <field.ComboBoxField
              openOnFocus
              data={buildConnectionComboBoxData(options)}
              label={translate('text_65940198687ce7b05cd62b61')}
              placeholder={translate('text_65940198687ce7b05cd62b62')}
              emptyText={translate('text_6645daa0468420011304aded')}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>
      )}

      {!!paymentInfoAlertKey && <Alert type="info">{translate(paymentInfoAlertKey)}</Alert>}
    </>
  )
}
