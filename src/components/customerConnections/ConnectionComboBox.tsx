import { ComboboxDataGrouped, ComboboxItem } from '~/components/form'

import { Typography } from '../designSystem/Typography'

/**
 * Shared presentation primitives for the provider-grouped connection combobox.
 *
 * Form-agnostic on purpose: the customer create/edit accordions feed it the
 * org-level integrations, while the per-object surfaces (subscription, one-off
 * invoice, wallet) feed it the customer's connections — same presentation,
 * different data source.
 */

export type ConnectionComboBoxDataItem = {
  /** Option value (the routing key: provider/connection code) */
  value: string
  /** Main label (name) */
  label: string
  /** Secondary label rendered under the main one (usually the code) */
  subLabel?: string
  /** Group header (provider type, e.g. "Stripe", "NetSuite") */
  group?: string
}

export const ConnectionComboBoxLabel = ({
  label,
  subLabel,
}: {
  label: string
  subLabel?: string
}) => {
  return (
    <ComboboxItem>
      <Typography variant="body" color="grey700" noWrap>
        {label}
      </Typography>
      <Typography variant="caption" color="grey600" noWrap>
        {subLabel}
      </Typography>
    </ComboboxItem>
  )
}

export const buildConnectionComboBoxData = (
  items: ConnectionComboBoxDataItem[],
): ComboboxDataGrouped[] => {
  return items.map(({ value, label, subLabel, group }) => ({
    value,
    label,
    group: group ?? '',
    labelNode: <ConnectionComboBoxLabel label={label} subLabel={subLabel} />,
  }))
}
