import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useBillingEntitiesOptions } from '~/hooks/useBillingEntitiesOptions'

type BillingEntityFormPickerProps = {
  /** Currently selected billing entity id (form value). */
  value: string | undefined | null
  /** Called with the chosen entity id (or `undefined` if cleared). */
  onChange: (id: string | undefined) => void
  /** Optional label rendered inside the ComboBox. */
  label?: string
  /** Optional helper text rendered below the ComboBox. */
  helperText?: string
  /**
   * Prepend the "inherit from the customer's default billing entity at billing time" option.
   * Opt-in: only forms whose underlying field is nullable may offer it, since picking it
   * submits `undefined`.
   */
  includeInheritOption?: boolean
}

/**
 * Picker for the `billingEntityId` form field.
 *
 * Encapsulates the id ↔ code mapping: the form stores ids (the shape accepted
 * by every `Create*Input.billingEntityId` mutation argument), while the
 * ComboBox renders entity codes. Callers only deal with ids.
 */
export const BILLING_ENTITY_FORM_PICKER_DATA_TEST = 'billing-entity-form-picker'

export const BillingEntityFormPicker = ({
  value,
  onChange,
  label,
  helperText,
  includeInheritOption = false,
}: BillingEntityFormPickerProps) => {
  const { translate } = useInternationalization()
  const { options, isLoading } = useBillingEntitiesOptions({ includeInheritOption })

  // No entity bound (empty, null or undefined) resolves to the inherit option when it is offered,
  // so the picker shows "use customer default" instead of looking untouched.
  const inheritOption = options.find((option) => !option.id)
  const currentCode = options.find((o) => o.id === value)?.value ?? inheritOption?.value ?? ''

  return (
    <ComboBox
      data-test={BILLING_ENTITY_FORM_PICKER_DATA_TEST}
      sortValues={false}
      PopperProps={{ displayInDialog: true }}
      label={label}
      helperText={helperText}
      placeholder={translate('text_174360002513391n72uwg6bb')}
      data={options}
      loading={isLoading}
      value={currentCode}
      onChange={(code) => {
        const selected = options.find((o) => o.value === code)

        // The inherit sentinel carries an empty id, which means "no entity" just like a cleared
        // ComboBox — both must reach the caller as `undefined`, never as an empty string.
        onChange(selected?.id || undefined)
      }}
    />
  )
}
