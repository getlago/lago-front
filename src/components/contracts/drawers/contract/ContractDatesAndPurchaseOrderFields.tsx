import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useMemo } from 'react'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { PurchaseOrderFormBlock } from '~/components/purchaseOrder/PurchaseOrderFormBlock'
import { getTimezoneConfig, getTodayAtUtcMidnight } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

const CONTRACT_DATES_OFFSET_KEYS = {
  willStart: 'text_1789552637141d30j39d0p7g',
  started: 'text_1789552637141n8qg5ybgaf0',
  // "It won't end until you manually terminate it." — object-agnostic, so the
  // subscription key is reused verbatim rather than duplicated.
  noEnd: 'text_64ef81071c6da2010dd24b1e',
  willEnd: 'text_178955263714151g6zubl71x',
}

type ContractDatesAndPurchaseOrderFieldsValues = {
  startedAt: string
  endedAt?: string
  billingAnchorDate?: string
  purchaseOrderNumber?: string | null
}

type ContractDatesAndPurchaseOrderFieldsProps = {
  customerTimezone?: TimezoneEnum | null
  startedAtLocked?: boolean
  billingAnchorDateLocked?: boolean
}

const defaultValues: ContractDatesAndPurchaseOrderFieldsValues = {
  startedAt: getTodayAtUtcMidnight(),
  endedAt: undefined,
  billingAnchorDate: undefined,
  purchaseOrderNumber: undefined,
}

const defaultProps: ContractDatesAndPurchaseOrderFieldsProps = {
  customerTimezone: undefined,
  startedAtLocked: false,
  billingAnchorDateLocked: false,
}

export const ContractDatesAndPurchaseOrderFields = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({ group, customerTimezone, startedAtLocked, billingAnchorDateLocked }) {
    const { translate } = useInternationalization()

    const startedAt = useStore(group.store, (state) => state.values.startedAt)
    const endedAt = useStore(group.store, (state) => state.values.endedAt)

    // `FieldGroupState` only carries `values`, not `fieldMeta` — read errors off the
    // group's real underlying form instead, keyed by the form's own field name.
    const startedAtErrors = useStore(
      group.form.store,
      (state) => state.fieldMeta[group.getFormFieldName('startedAt')]?.errors,
    )
    const endedAtErrors = useStore(
      group.form.store,
      (state) => state.fieldMeta[group.getFormFieldName('endedAt')]?.errors,
    )

    // Matches the schema's own rule (endedAt must be after both startedAt and today):
    // disablePast alone would let the picker offer dates the schema then rejects.
    const minEndedAt = useMemo(() => {
      const today = DateTime.fromISO(getTodayAtUtcMidnight())
      const start = startedAt ? DateTime.fromISO(startedAt) : today

      return (start > today ? start : today).plus({ days: 1 })
    }, [startedAt])

    return (
      <>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-3 md:flex-row md:[&>*]:flex-1">
            <group.AppField name="startedAt">
              {(field) => (
                <field.DatePickerField
                  disabled={startedAtLocked}
                  placement="auto"
                  label={translate('text_64ef55a730b88e3d2117b3c4')}
                  defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                />
              )}
            </group.AppField>
            <group.AppField name="endedAt">
              {(field) => (
                <field.DatePickerField
                  minDate={minEndedAt}
                  placement="auto"
                  label={translate('text_64ef55a730b88e3d2117b3cc')}
                  defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                  inputProps={{ cleanable: true }}
                />
              )}
            </group.AppField>
          </div>

          {!startedAtErrors?.length && !endedAtErrors?.length && (
            <SubscriptionDatesOffsetHelperComponent
              customerTimezone={customerTimezone}
              subscriptionAt={startedAt}
              endingAt={endedAt}
              translationKeys={CONTRACT_DATES_OFFSET_KEYS}
            />
          )}
        </div>

        <group.AppField name="billingAnchorDate">
          {(field) => (
            <field.DatePickerField
              disabled={billingAnchorDateLocked}
              placement="auto"
              label={translate('text_1781859135627z59hpfpa8pt')}
              description={translate('text_1789552637141byit8ajgqyp')}
              defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
            />
          )}
        </group.AppField>

        <group.AppField name="purchaseOrderNumber">
          {(field) => (
            <PurchaseOrderFormBlock
              value={field.state.value}
              description={translate('text_1790018785008trx3po6az4b')}
              onChange={(value) => field.handleChange(value ?? undefined)}
            />
          )}
        </group.AppField>
      </>
    )
  },
})
