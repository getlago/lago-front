import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { LockedPickerBox } from '~/components/form/LockedPickerBox'
import { useBillingEntitiesOptions } from '~/hooks/useBillingEntitiesOptions'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { BILLING_ENTITY_COMBOBOX_DEFAULTS } from './comboBoxDefaults'

// ComboBoxProps is a union (basic | grouped). Narrow to the basic branch
// — discriminated by `renderGroupHeader?: never` — and strip the props we own.
type FlatComboBoxProps = Extract<ComboBoxProps, { renderGroupHeader?: never }>

type BillingEntityFilterPickerProps = Omit<FlatComboBoxProps, 'data' | 'value' | 'onChange'> & {
  /** Entity code (option's `value`). */
  value: string | undefined
  /** Receives the entity's id, code, and label so callers can pick whichever they need
   *  (e.g. `id` for `billingEntityId: ID` GraphQL args, `code` for REST). */
  onChange: (entity: { id: string; code: string; label: string }) => void
  /**
   * When provided, the ComboBox becomes clearable: the user can reset the
   * selection back to the placeholder state, and this callback fires.
   */
  onClear?: () => void
}

/**
 * Picker tuned for **filter dropdowns** (e.g. customer credit notes / usage list):
 * code-based value, clearable, exposes the full entity tuple in onChange so
 * callers can store whichever shape they need.
 *
 * For form fields persisting `billingEntityId` use `BillingEntityFormPicker`.
 */
export const BillingEntityFilterPicker = ({
  value,
  onChange,
  onClear,
  placeholder,
  containerClassName,
  PopperProps,
  ...rest
}: BillingEntityFilterPickerProps) => {
  const { options, isLoading } = useBillingEntitiesOptions()
  const { isPremium } = useCurrentUser()
  const { open: openPremiumWarningDialog } = usePremiumWarningDialog()

  if (!isPremium) {
    return (
      <LockedPickerBox
        placeholder={placeholder}
        onClick={() => openPremiumWarningDialog()}
        containerClassName={containerClassName}
      />
    )
  }

  return (
    <ComboBox
      {...rest}
      {...BILLING_ENTITY_COMBOBOX_DEFAULTS}
      placeholder={placeholder}
      containerClassName={containerClassName}
      data={options}
      loading={isLoading}
      value={value}
      onChange={(next) => {
        if (!next) {
          if (onClear) onClear()
          return
        }
        const selected = options.find((option) => option.value === next)

        if (selected) {
          onChange({ id: selected.id, code: selected.value, label: selected.label })
        }
      }}
      PopperProps={{ ...BILLING_ENTITY_COMBOBOX_DEFAULTS.PopperProps, ...PopperProps }}
    />
  )
}
