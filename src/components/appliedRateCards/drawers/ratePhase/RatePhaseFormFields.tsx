import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { useState } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { Checkbox } from '~/components/form/Checkbox/Checkbox'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { CurrencyEnum, ProductTypeEnum, RateCardBillingTimingEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import {
  RATE_FIELD_GROUP_FIELDS,
  RateBillingIntervalFields,
  RateInvoicingSettingsSection,
  RatePricingSettingsSection,
} from '~/pages/catalog/drawers/rateCardRate/RateCardRateFieldGroups'

import {
  isPlacedLast,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import { getActiveRateFieldValues } from './ratePhaseSeeds'
import { RateCardForRatePhaseFields } from './types'

export const RATE_PHASE_POSITION_MODE_TEST_ID = 'rate-phase-position-mode'
export const RATE_PHASE_POSITION_REFERENCE_TEST_ID = 'rate-phase-position-reference'
export const RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID = 'rate-phase-duration-cycle-count'
export const RATE_PHASE_FOREVER_CHECKBOX_TEST_ID = 'rate-phase-forever-checkbox'
export const RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID = 'rate-phase-override-toggle'

type RatePhaseFormFieldsRenderProps = {
  title: string
  isEdition: boolean
  // A getter: `children` is captured once at open(), and "create more" adds phases mid-session.
  getOtherPhases: () => RatePhaseReference[]
  rateCard: RateCardForRatePhaseFields
}

const defaultProps: RatePhaseFormFieldsRenderProps = {
  title: '',
  isEdition: false,
  getOtherPhases: () => [],
  rateCard: {
    productType: ProductTypeEnum.Metered,
    currency: CurrencyEnum.Usd,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    appliedPricingUnitCode: null,
    proration: false,
    activeRate: null,
  },
}

export const RatePhaseFormFields = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: defaultProps,
  render: function RatePhaseFormFieldsRender({ form, title, isEdition, getOtherPhases, rateCard }) {
    const { translate } = useInternationalization()
    const otherPhases = getOtherPhases()
    const overrideEnabled = useStore(form.store, (state) => state.values.overrideEnabled)
    const minAmountCents = useStore(form.store, (state) => state.values.minAmountCents)
    const positionMode = useStore(form.store, (state) => state.values.positionMode)
    const positionReferenceCode = useStore(
      form.store,
      (state) => state.values.positionReferenceCode,
    )
    const durationType = useStore(form.store, (state) => state.values.durationType)
    // Reveals the spending minimum input; frozen while editable so clearing it does not collapse it.
    const [minAmountCentsWhenEnabled, setMinAmountCentsWhenEnabled] = useState(
      () => form.state.values.minAmountCents,
    )

    const isLast = isPlacedLast({ positionMode, positionReferenceCode }, otherPhases)
    const isForever = durationType === 'forever'

    const positionModeComboboxData = [
      { value: 'after', label: translate('text_17918352599290m49qpwdu3s') },
      { value: 'before', label: translate('text_1791835259929a6ko4g4o8zx') },
    ]

    const positionReferenceComboboxData = otherPhases.map((phase, index) => ({
      value: phase.code,
      label: translate('text_1791835259929gdoqvjuiov8', {
        phaseName: phase.name || phase.code,
        position: index + 1,
      }),
      description: phase.code,
    }))

    const handleOverrideToggle = ({ value }: { value: boolean }): void => {
      if (value) {
        setMinAmountCentsWhenEnabled(form.state.values.minAmountCents)
        return
      }

      const activeRateValues = getActiveRateFieldValues(rateCard)

      form.setFieldValue('rateModel', activeRateValues.rateModel)
      form.setFieldValue('properties', activeRateValues.properties)
      form.setFieldValue('billingIntervalCount', activeRateValues.billingIntervalCount)
      form.setFieldValue('billingIntervalUnit', activeRateValues.billingIntervalUnit)
      form.setFieldValue('minAmountCents', activeRateValues.minAmountCents)
      form.setFieldValue('conversionRate', activeRateValues.conversionRate)
    }

    const setDurationType = (value: RatePhaseFormValues['durationType']): void => {
      form.setFieldValue('durationType', value)

      if (value === 'forever' && form.state.values.durationCycleCount) {
        form.setFieldValue('durationCycleCount', '')
      }
    }

    // `RatePhases::ReplaceService` only accepts the last phase running forever.
    const handlePositionChange = (): void => {
      const { values } = form.state

      if (values.durationType === 'forever' && !isPlacedLast(values, getOtherPhases())) {
        setDurationType('finite')
      }
    }

    return (
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {title}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1791833366840abmtqvj371f')}
          </Typography>
        </div>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle title={translate('text_17918352599291fjtlpy6o9t')} />

          <NameAndCodeGroup
            form={form}
            fields={{ name: 'name', code: 'code' }}
            disableAutoGenerateCode={isEdition}
            nameProps={{ placeholder: translate('text_1791835259930oafoij0etbt') }}
            codeProps={{ placeholder: translate('text_1791835259930kt2jtyd9bw0') }}
          />

          {otherPhases.length > 0 && (
            <div className="flex flex-col gap-3">
              <Typography variant="captionHl" color="grey700">
                {translate('text_1791835259929vzy9i811ojq')}
              </Typography>
              <div className="flex items-start gap-3">
                <form.AppField name="positionMode" listeners={{ onChange: handlePositionChange }}>
                  {(field) => (
                    <field.ComboBoxField
                      dataTest={RATE_PHASE_POSITION_MODE_TEST_ID}
                      containerClassName="w-40"
                      disableClearable
                      sortValues={false}
                      placeholder={translate('text_1791835259929w5awid04gdu')}
                      data={positionModeComboboxData}
                    />
                  )}
                </form.AppField>
                <form.AppField
                  name="positionReferenceCode"
                  listeners={{ onChange: handlePositionChange }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      dataTest={RATE_PHASE_POSITION_REFERENCE_TEST_ID}
                      containerClassName="flex-1"
                      disableClearable
                      sortValues={false}
                      placeholder={translate('text_1791835259929pk9djobpqt4')}
                      data={positionReferenceComboboxData}
                    />
                  )}
                </form.AppField>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <form.AppField name="durationCycleCount">
              {(field) => (
                <field.TextInputField
                  data-test={RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID}
                  beforeChangeFormatter={['int', 'positiveNumber']}
                  label={translate('text_17914856703265q2q10b1hry')}
                  placeholder={isForever ? translate('text_63c83a3476e46bc6ab9d85d6') : '1'}
                  disabled={isForever}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {translate('text_1791485670326auwsxq3x83b')}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </form.AppField>
            <Checkbox
              name="durationType"
              data-test={RATE_PHASE_FOREVER_CHECKBOX_TEST_ID}
              label={translate('text_1791835259929jzk45luf7yg')}
              value={isForever}
              disabled={!isLast}
              onChange={(_, checked) => setDurationType(checked ? 'forever' : 'finite')}
            />
          </div>
        </CenteredPage.PageSection>

        <div className="relative -mx-12 flex justify-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-purple-200" />
          <div className="relative flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-100 px-3 py-1">
            <Typography variant="bodyHl" className="text-purple-500">
              {translate('text_17914856703260y0i9has5wq')}
            </Typography>
            <form.AppField name="overrideEnabled" listeners={{ onChange: handleOverrideToggle }}>
              {(field) => <field.SwitchField dataTest={RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID} />}
            </form.AppField>
          </div>
        </div>

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle title={translate('text_17918384599834dc1b83rkki')} />
            <RateBillingIntervalFields
              form={form}
              fields={RATE_FIELD_GROUP_FIELDS}
              disabled={!overrideEnabled}
            />
          </CenteredPage.PageSection>

          <RatePricingSettingsSection
            form={form}
            fields={RATE_FIELD_GROUP_FIELDS}
            rateCard={rateCard}
            isRateModelLocked={false}
            disabled={!overrideEnabled}
          />

          <RateInvoicingSettingsSection
            form={form}
            fields={RATE_FIELD_GROUP_FIELDS}
            rateCard={rateCard}
            disabled={!overrideEnabled}
            initialMinAmountCents={overrideEnabled ? minAmountCentsWhenEnabled : minAmountCents}
          />
        </CenteredPage.SubsectionWrapper>
      </div>
    )
  },
})
