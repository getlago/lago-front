import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'

import { ContractFieldLocks } from '~/components/contracts/drawers/contract/fieldLocks'
import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { ToggleableFieldAddButton, ToggleableFieldRow } from '~/components/form/ToggleableFieldRow'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PurchaseOrderFormBlock } from '~/components/purchaseOrder/PurchaseOrderFormBlock'
import { getTimezoneConfig, getTodayAtUtcMidnight } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_REMOVE_NAME_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_SETTINGS_FORM_DEFAULTS,
} from './constants'

const CONTRACT_DATES_OFFSET_KEYS = {
  willStart: 'text_1789552637141d30j39d0p7g',
  started: 'text_1789552637141n8qg5ybgaf0',
  noEnd: 'text_64ef81071c6da2010dd24b1e',
  willEnd: 'text_178955263714151g6zubl71x',
}

type ContractSettingsDrawerContentExtraProps = {
  fieldLocks: Pick<ContractFieldLocks, 'startedAt' | 'billingAnchorDate'>
  customerTimezone?: TimezoneEnum | null
}

const contractSettingsDrawerContentDefaultProps: ContractSettingsDrawerContentExtraProps = {
  fieldLocks: { startedAt: false, billingAnchorDate: false },
  customerTimezone: undefined,
}

export const ContractSettingsDrawerContent = withForm({
  defaultValues: CONTRACT_SETTINGS_FORM_DEFAULTS,
  props: contractSettingsDrawerContentDefaultProps,
  render: function ContractSettingsDrawerContentRender({ form, fieldLocks, customerTimezone }) {
    const { translate } = useInternationalization()
    const [shouldDisplayName, setShouldDisplayName] = useState(() => !!form.state.values.name)

    const startedAt = useStore(form.store, (state) => state.values.startedAt)
    const endedAt = useStore(form.store, (state) => state.values.endedAt)

    // Matches the schema's own rule (endedAt must be after both startedAt and today):
    // disablePast alone would let the picker offer dates the schema then rejects.
    const minEndedAt = useMemo(() => {
      const today = DateTime.fromISO(getTodayAtUtcMidnight())
      const start = startedAt ? DateTime.fromISO(startedAt) : today

      return (start > today ? start : today).plus({ days: 1 })
    }, [startedAt])

    const handleHideName = (): void => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard prompt after a no-op round trip.
      if (form.state.values.name) {
        form.setFieldValue('name', '')
      }
      setShouldDisplayName(false)
    }

    return (
      <CenteredPage.SubsectionWrapper>
        <CenteredPage.PageSection>
          <form.AppField name="externalId">
            {(field) => (
              <field.TextInputField
                disabled
                data-test={CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID}
                label={translate('text_1790018785008xgr4069mlgg')}
              />
            )}
          </form.AppField>

          {shouldDisplayName && (
            <ToggleableFieldRow
              onRemove={handleHideName}
              removeDataTest={CONTRACT_SETTINGS_DRAWER_REMOVE_NAME_TEST_ID}
              tooltipClassName="mt-6"
            >
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    className="mr-3 flex-1"
                    label={translate('text_1789552637141273ewsjqx7j')}
                    placeholder={translate('text_1790018785009vy05bf6zdc6')}
                  />
                )}
              </form.AppField>
            </ToggleableFieldRow>
          )}
          {!shouldDisplayName && (
            <ToggleableFieldAddButton
              onClick={() => setShouldDisplayName(true)}
              label={translate('text_17895526371415m2ipvxifqn')}
              dataTest={CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID}
            />
          )}

          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-3 md:flex-row md:[&>*]:flex-1">
              <form.AppField name="startedAt">
                {(field) => (
                  <field.DatePickerField
                    disabled={fieldLocks.startedAt}
                    placement="auto"
                    label={translate('text_64ef55a730b88e3d2117b3c4')}
                    defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                  />
                )}
              </form.AppField>
              <form.AppField name="endedAt">
                {(field) => (
                  <field.DatePickerField
                    minDate={minEndedAt}
                    placement="auto"
                    label={translate('text_64ef55a730b88e3d2117b3cc')}
                    defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                    inputProps={{ cleanable: true }}
                  />
                )}
              </form.AppField>
            </div>

            <form.Subscribe
              selector={(state) => ({
                startedAtErrors: state.fieldMeta.startedAt?.errors,
                endedAtErrors: state.fieldMeta.endedAt?.errors,
              })}
            >
              {({ startedAtErrors, endedAtErrors }) =>
                !startedAtErrors?.length &&
                !endedAtErrors?.length && (
                  <SubscriptionDatesOffsetHelperComponent
                    customerTimezone={customerTimezone}
                    subscriptionAt={startedAt}
                    endingAt={endedAt}
                    translationKeys={CONTRACT_DATES_OFFSET_KEYS}
                  />
                )
              }
            </form.Subscribe>
          </div>

          <form.AppField name="billingAnchorDate">
            {(field) => (
              <field.DatePickerField
                disabled={fieldLocks.billingAnchorDate}
                placement="auto"
                label={translate('text_1781859135627z59hpfpa8pt')}
                description={translate('text_1789552637141byit8ajgqyp')}
                defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
              />
            )}
          </form.AppField>

          <form.AppField name="purchaseOrderNumber">
            {(field) => (
              <PurchaseOrderFormBlock
                value={field.state.value}
                description={translate('text_1790018785008trx3po6az4b')}
                onChange={(value) => field.handleChange(value ?? undefined)}
              />
            )}
          </form.AppField>
        </CenteredPage.PageSection>
      </CenteredPage.SubsectionWrapper>
    )
  },
})
