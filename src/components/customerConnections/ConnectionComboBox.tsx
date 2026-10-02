import { Chip } from '~/components/designSystem/Chip'
import { ComboboxDataGrouped, ComboboxItem } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Typography } from '../designSystem/Typography'

/**
 * Shared presentation primitives for the provider-grouped connection combobox.
 *
 * Form-agnostic on purpose: the customer create/edit accordions feed it the
 * org-level integrations, while the per-object surfaces (subscription, one-off
 * invoice, wallet) feed it the customer's connections — same presentation,
 * different data source.
 */

export const CONNECTION_COMBOBOX_DEFAULT_BADGE_TEST_ID = 'connection-combobox-default-badge'

export type ConnectionComboBoxDataItem = {
  /** Option value (the routing key: provider/connection code) */
  value: string
  /** Main label (name) */
  label: string
  /** Secondary label rendered under the main one (usually the code) */
  subLabel?: string
  /** Group header (provider type, e.g. "Stripe", "NetSuite") */
  group?: string
  /** Marks the customer's default connection with a "Default" chip */
  isDefault?: boolean
}

export const ConnectionComboBoxLabel = ({
  label,
  subLabel,
  isDefault,
}: {
  label: string
  subLabel?: string
  isDefault?: boolean
}) => {
  const { translate } = useInternationalization()

  return (
    <ComboboxItem>
      <div className="flex w-full items-center gap-2">
        <Typography variant="body" color="grey700" noWrap>
          {label}
        </Typography>
        {isDefault && (
          <Chip
            label={translate('text_65281f686a80b400c8e2f6d1')}
            data-test={CONNECTION_COMBOBOX_DEFAULT_BADGE_TEST_ID}
          />
        )}
      </div>
      <Typography variant="caption" color="grey600" noWrap>
        {subLabel}
      </Typography>
    </ComboboxItem>
  )
}

export const buildConnectionComboBoxData = (
  items: ConnectionComboBoxDataItem[],
): ComboboxDataGrouped[] => {
  return items.map(({ value, label, subLabel, group, isDefault }) => ({
    value,
    label,
    group: group ?? '',
    labelNode: <ConnectionComboBoxLabel label={label} subLabel={subLabel} isDefault={isDefault} />,
  }))
}
