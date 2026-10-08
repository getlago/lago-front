import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

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

import { RATE_PHASE_FORM_DEFAULTS } from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

type RatePhaseFormFieldsRenderProps = {
  isLastPosition: boolean
  rateCard: RateCardForRatePhaseFields
}

const defaultProps: RatePhaseFormFieldsRenderProps = {
  isLastPosition: true,
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
  render: function RatePhaseFormFieldsRender({ form, isLastPosition, rateCard }) {
    const { translate } = useInternationalization()
    const overrideEnabled = useStore(form.store, (state) => state.values.overrideEnabled)
    const rateModel = useStore(form.store, (state) => state.values.rateModel)

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

    // Only 'forever' validates for the last position and only 'finite' validates for any other
    // (Task 4's schema) - keep the toggle in sync so a non-last phase doesn't mount invalid.
    useEffect(() => {
      form.setFieldValue('durationType', isLastPosition ? 'forever' : 'finite')
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLastPosition])

    return (
      <CenteredPage.SubsectionWrapper>
        <CenteredPage.PageSection>
          <NameAndCodeGroup form={form} fields={{ name: 'name', code: 'code' }} />
        </CenteredPage.PageSection>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle title={translate('text_17914856703265q2q10b1hry')} />

          <form.AppField name="durationType">
            {(field) => (
              <field.ButtonSelectorField
                label={translate('text_17914856703265q2q10b1hry')}
                options={[
                  {
                    label: translate('text_1791485670326auwsxq3x83b'),
                    value: 'finite',
                    disabled: isLastPosition,
                  },
                  {
                    label: translate('text_63c83a3476e46bc6ab9d85d6'),
                    value: 'forever',
                    disabled: !isLastPosition,
                  },
                ]}
              />
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.durationType}>
            {(durationType) =>
              durationType === 'finite' && (
                <form.AppField name="durationCycleCount">
                  {(field) => (
                    <field.TextInputField
                      data-test="rate-phase-duration-cycle-count"
                      beforeChangeFormatter={['int', 'positiveNumber']}
                      label={translate('text_1791485670326auwsxq3x83b')}
                    />
                  )}
                </form.AppField>
              )
            }
          </form.Subscribe>
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
    )
  },
})
