import { useState } from 'react'

import { ContractDatesAndPurchaseOrderFields } from '~/components/contracts/drawers/contract/ContractDatesAndPurchaseOrderFields'
import { ContractFieldLocks } from '~/components/contracts/drawers/contract/fieldLocks'
import { ToggleableFieldAddButton, ToggleableFieldRow } from '~/components/form/ToggleableFieldRow'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_REMOVE_NAME_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_SETTINGS_DRAWER_TITLE_KEY,
  CONTRACT_SETTINGS_FORM_DEFAULTS,
} from './constants'

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

    const handleHideName = (): void => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard prompt after a no-op round trip.
      if (form.state.values.name) {
        form.setFieldValue('name', '')
      }
      setShouldDisplayName(false)
    }

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(CONTRACT_SETTINGS_DRAWER_TITLE_KEY)}
          description={translate('text_1789552637141f22za3l5g2u')}
        />

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

            <ContractDatesAndPurchaseOrderFields
              form={form}
              fields={{
                startedAt: 'startedAt',
                endedAt: 'endedAt',
                billingAnchorDate: 'billingAnchorDate',
                purchaseOrderNumber: 'purchaseOrderNumber',
              }}
              customerTimezone={customerTimezone}
              startedAtLocked={fieldLocks.startedAt}
              billingAnchorDateLocked={fieldLocks.billingAnchorDate}
            />
          </CenteredPage.PageSection>
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})
