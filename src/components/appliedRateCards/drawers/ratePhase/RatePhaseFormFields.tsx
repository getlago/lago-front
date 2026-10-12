import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { Checkbox } from '~/components/form/Checkbox/Checkbox'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { RateCardBillingTimingEnum, RateCardRateModelEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { BILLING_INTERVAL_UNIT_TRANSLATION_KEY } from '~/pages/catalog/drawers/rateCardRate/constants'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'
import { RateWrapperSwitch } from '~/pages/catalog/rateProperties/RateWrapperSwitch'
import { getAvailableRateModels } from '~/pages/catalog/utils/rateModelAvailability'

import {
  isPlacedLast,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

export const RATE_PHASE_POSITION_MODE_TEST_ID = 'rate-phase-position-mode'
export const RATE_PHASE_POSITION_REFERENCE_TEST_ID = 'rate-phase-position-reference'
export const RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID = 'rate-phase-duration-cycle-count'
export const RATE_PHASE_FOREVER_CHECKBOX_TEST_ID = 'rate-phase-forever-checkbox'

type RatePhaseFormFieldsRenderProps = {
  title: string
  otherPhases: RatePhaseReference[]
  rateCard: RateCardForRatePhaseFields
}

const defaultProps: RatePhaseFormFieldsRenderProps = {
  title: '',
  otherPhases: [],
  rateCard: {
    productType: 'metered' as RateCardForRatePhaseFields['productType'],
    currency: 'USD' as RateCardForRatePhaseFields['currency'],
    billingTiming: RateCardBillingTimingEnum.Arrears,
    appliedPricingUnitCode: null,
    rateModelConfiguration: undefined,
  },
}

export const RatePhaseFormFields = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: defaultProps,
  render: function RatePhaseFormFieldsRender({ form, title, otherPhases, rateCard }) {
    const { translate } = useInternationalization()
    const overrideEnabled = useStore(form.store, (state) => state.values.overrideEnabled)
    const rateModel = useStore(form.store, (state) => state.values.rateModel)
    const positionMode = useStore(form.store, (state) => state.values.positionMode)
    const positionReferenceCode = useStore(
      form.store,
      (state) => state.values.positionReferenceCode,
    )
    const durationType = useStore(form.store, (state) => state.values.durationType)

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

    const rateModelComboboxData = useMemo(() => {
      const availableRateModels =
        getAvailableRateModels(rateCard.rateModelConfiguration) ??
        Object.values(RateCardRateModelEnum)

      return availableRateModels.map((model) => ({
        value: model,
        label: translate(chargeModelLookupTranslation[toChargeModel(model)]),
      }))
    }, [rateCard.rateModelConfiguration, translate])

    const handleOverrideToggle = ({ value }: { value: boolean }): void => {
      if (value) return

      form.setFieldValue('rateModel', RATE_PHASE_FORM_DEFAULTS.rateModel)
      form.setFieldValue('properties', RATE_PHASE_FORM_DEFAULTS.properties)
      form.setFieldValue(
        'overrideBillingIntervalCount',
        RATE_PHASE_FORM_DEFAULTS.overrideBillingIntervalCount,
      )
      form.setFieldValue(
        'overrideBillingIntervalUnit',
        RATE_PHASE_FORM_DEFAULTS.overrideBillingIntervalUnit,
      )
      form.setFieldValue('minAmountCents', RATE_PHASE_FORM_DEFAULTS.minAmountCents)
      form.setFieldValue('conversionRate', RATE_PHASE_FORM_DEFAULTS.conversionRate)
    }

    const setDurationType = (value: RatePhaseFormValues['durationType']): void => {
      form.setFieldValue('durationType', value)

      if (value === 'forever' && form.state.values.durationCycleCount) {
        form.setFieldValue('durationCycleCount', '')
      }
    }

    // `RatePhases::ReplaceService` only accepts the last phase running forever.
    useEffect(() => {
      if (!isLast && form.state.values.durationType === 'forever') setDurationType('finite')
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLast])

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

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle title={translate('text_17918352599291fjtlpy6o9t')} />

            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              nameProps={{ placeholder: translate('text_1791835259930oafoij0etbt') }}
              codeProps={{ placeholder: translate('text_1791835259930kt2jtyd9bw0') }}
            />

            {otherPhases.length > 0 && (
              <div className="flex flex-col gap-3">
                <Typography variant="captionHl" color="grey700">
                  {translate('text_1791835259929vzy9i811ojq')}
                </Typography>
                <div className="flex items-start gap-3">
                  <form.AppField name="positionMode">
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
                  <form.AppField name="positionReferenceCode">
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

          <CenteredPage.PageSection>
            <form.AppField name="overrideEnabled" listeners={{ onChange: handleOverrideToggle }}>
              {(field) => (
                <field.SwitchField
                  dataTest="rate-phase-override-toggle"
                  label={translate('text_17914856703260y0i9has5wq')}
                />
              )}
            </form.AppField>

            {overrideEnabled && (
              <>
                <form.AppField name="rateModel">
                  {(field) => (
                    <field.ComboBoxField
                      label={translate('text_65201b8216455901fe273dd5')}
                      data={rateModelComboboxData}
                      disableClearable
                    />
                  )}
                </form.AppField>

                <RateWrapperSwitch
                  form={form}
                  fields="properties"
                  rateModel={rateModel}
                  productType={rateCard.productType}
                  currency={rateCard.currency}
                  pricingUnitShortName={rateCard.appliedPricingUnitCode ?? undefined}
                  onExpandCustomCharge={() => undefined}
                />

                <CenteredPage.PageSectionTitle title={translate('text_1787737220227tqziocrcywv')} />

                <div className="flex items-start gap-3">
                  <form.AppField name="overrideBillingIntervalCount">
                    {(field) => (
                      <field.TextInputField
                        className="w-30"
                        beforeChangeFormatter={['int', 'positiveNumber']}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="overrideBillingIntervalUnit">
                    {(field) => (
                      <field.ComboBoxField
                        containerClassName="flex-1"
                        disableClearable
                        sortValues={false}
                        data={Object.entries(BILLING_INTERVAL_UNIT_TRANSLATION_KEY).map(
                          ([unit, labelKey]) => ({ value: unit, label: translate(labelKey) }),
                        )}
                      />
                    )}
                  </form.AppField>
                </div>

                {rateCard.billingTiming === RateCardBillingTimingEnum.Arrears && (
                  <form.AppField name="minAmountCents">
                    {(field) => (
                      <field.AmountInputField
                        data-test="rate-phase-min-amount"
                        currency={rateCard.currency}
                        label={translate('text_1758285847805xn6hdyurz3e')}
                      />
                    )}
                  </form.AppField>
                )}

                {!!rateCard.appliedPricingUnitCode && (
                  <form.AppField name="conversionRate">
                    {(field) => (
                      <field.AmountInputField
                        data-test="rate-phase-conversion-rate"
                        currency={rateCard.currency}
                        label={translate('text_1750411499858su5b7bbp5t9')}
                      />
                    )}
                  </form.AppField>
                )}
              </>
            )}
          </CenteredPage.PageSection>
        </CenteredPage.SubsectionWrapper>
      </div>
    )
  },
})
