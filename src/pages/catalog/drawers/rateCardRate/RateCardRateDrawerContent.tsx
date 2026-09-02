import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { ChargeWrapperSwitch } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { SpendingMinimumOptionSection } from '~/components/plans/chargeAccordion/SpendingMinimumOptionSection'
import { useCustomChargeDrawer } from '~/components/plans/drawers/common/useCustomChargeDrawer'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { getTimezoneConfig } from '~/core/timezone'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { tw } from '~/styles/utils'

import {
  BILLING_INTERVAL_UNIT_TRANSLATION_KEY,
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
} from './constants'
import {
  buildRateCodeFromEffectiveDate,
  formatEffectiveDate,
  isEffectiveFromAppendable,
  toChargeModel,
} from './utils'

export const RATE_CARD_RATE_DRAWER_CODE_TEST_ID = 'rate-card-rate-code'
export const RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID =
  'rate-card-rate-billing-interval-count'
export const RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID =
  'rate-card-rate-billing-interval-unit'
export const RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID = 'rate-card-rate-conversion-rate'
export const RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID = 'rate-card-rate-spending-minimum'

export type RateCardRateDrawerRateCard = {
  currency: CurrencyEnum
  appliedPricingUnitCode?: string | null
  billingTiming: RateCardBillingTimingEnum
  productType: ProductTypeEnum
  aggregationType?: AggregationTypeEnum | null
}

type RateCardRateDrawerSectionsExtraProps = {
  rateCard: RateCardRateDrawerRateCard
  isEdit: boolean
  isActiveRate: boolean
  isCodeLocked: boolean
  // A getter, not a value: `children` is captured once at open() while the boundary moves.
  getEffectiveFromBoundary: () => string | null
  // Captured at open time so clearing the input does not collapse the section mid-edit.
  initialMinAmountCents: string
}

const rateCardRateDrawerSectionsDefaultProps: RateCardRateDrawerSectionsExtraProps = {
  rateCard: {
    currency: CurrencyEnum.Usd,
    appliedPricingUnitCode: null,
    billingTiming: RateCardBillingTimingEnum.Arrears,
    productType: ProductTypeEnum.Fixed,
    aggregationType: undefined,
  },
  isEdit: false,
  isActiveRate: false,
  isCodeLocked: false,
  getEffectiveFromBoundary: () => null,
  initialMinAmountCents: '',
}

const RateCardRateDrawerFormSections = withForm({
  defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
  props: rateCardRateDrawerSectionsDefaultProps,
  render: function RateCardRateDrawerFormSectionsRender({
    form,
    rateCard,
    isEdit,
    isActiveRate,
    isCodeLocked,
    getEffectiveFromBoundary,
    initialMinAmountCents,
  }) {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
    const { getFixedChargeModelComboboxData, getUsageChargeModelComboboxData } = useChargeForm()
    const { pricingUnits } = useCustomPricingUnits()

    // Resolved on render, not at open(): `children` is captured once, so a short name read
    // before the pricing-units query resolved would stick for the whole session.
    const pricingUnitShortName = pricingUnits.find(
      (unit) => unit.code === rateCard.appliedPricingUnitCode,
    )?.shortName

    const effectiveFrom = useStore(form.store, (state) => state.values.effectiveFrom)
    const effectiveFromBoundary = getEffectiveFromBoundary()
    const rateModel = useStore(form.store, (state) => state.values.rateModel)
    const minAmountCents = useStore(form.store, (state) => state.values.minAmountCents)

    // Seeding stops once the code is edited by hand. The second ref marks this component's
    // own writes, which the code field's listener would otherwise read as a hand edit.
    const isCodeDerivedFromDateRef = useRef(!isEdit)
    const isSeedingCodeRef = useRef(false)

    const rateModelComboboxData = useMemo(() => {
      if (rateCard.productType === ProductTypeEnum.Fixed) {
        return getFixedChargeModelComboboxData()
      }

      if (!rateCard.aggregationType) return []

      return getUsageChargeModelComboboxData({
        isPremium,
        aggregationType: rateCard.aggregationType,
      })
      // The two getters are recreated on every render by `useChargeForm`, so listing them
      // would defeat this memo; their output only varies with the deps kept below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rateCard.productType, rateCard.aggregationType, isPremium])

    const billingIntervalUnitComboboxData = useMemo(
      () =>
        Object.entries(BILLING_INTERVAL_UNIT_TRANSLATION_KEY).map(([unit, labelKey]) => ({
          value: unit,
          label: translate(labelKey),
        })),
      [translate],
    )

    // Interpolates the boundary date, which `translate()` cannot do from a zod message.
    const effectiveFromErrorOverride = useMemo(() => {
      if (!effectiveFromBoundary) return undefined
      if (isEffectiveFromAppendable(effectiveFrom, effectiveFromBoundary)) return undefined

      return translate(RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY, {
        date: formatEffectiveDate(effectiveFromBoundary),
      })
    }, [effectiveFrom, effectiveFromBoundary, translate])

    const localCharge = { chargeModel: toChargeModel(rateModel) }
    const spendingMinimumLocalCharge = { minAmountCents }
    const spendingMinimumInitialCharge = { minAmountCents: initialMinAmountCents }

    // Without this the Custom model's JSON editor never writes back to the form.
    const { openCustomChargeDrawer } = useCustomChargeDrawer({
      onSave: (customProperties) =>
        form.setFieldValue('properties.customProperties', customProperties),
    })

    const handleRateModelUpdate = (name: string, value: unknown) => {
      if (name !== 'chargeModel') return

      const nextRateModel = value as RateCardRateModelEnum

      if (nextRateModel === rateModel) return

      if (!isPremium && nextRateModel === RateCardRateModelEnum.GraduatedPercentage) {
        openPremiumWarningDialog()
        return
      }

      // Not `form.reset`: that clears `isDirty` too, and the drawer would stop prompting.
      Object.keys(form.state.fieldMeta)
        .filter((field) => field === 'properties' || field.startsWith('properties.'))
        .forEach((field) => form.resetField(field as keyof typeof form.state.values))

      form.setFieldValue('rateModel', nextRateModel)
      form.setFieldValue('properties', getPropertyShape({}))
    }

    return (
      <>
        <Typography variant="body" color="grey600">
          {translate('text_17877372202276uc54jqy1np')}
        </Typography>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle title={translate('text_1787737220227io0cqa5y5jy')} />

          <form.AppField
            name="effectiveFrom"
            listeners={{
              onChange: ({ value }: { value: string }) => {
                if (!isCodeDerivedFromDateRef.current) return

                const derivedCode = buildRateCodeFromEffectiveDate(value)

                if (derivedCode) {
                  isSeedingCodeRef.current = true
                  form.setFieldValue('code', derivedCode)
                  isSeedingCodeRef.current = false
                }
              },
            }}
          >
            {(field) => (
              <field.DatePickerField
                label={translate('text_1787737220227bfxpshdo133')}
                description={translate('text_1787737220227auyye6x3cr0')}
                // Calendar day: the backend floors it to UTC midnight, so an org-zone
                // instant would land the rate on the previous day.
                defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                disabled={isActiveRate}
                errorOverride={effectiveFromErrorOverride}
              />
            )}
          </form.AppField>

          <form.AppField
            name="code"
            listeners={{
              onChange: () => {
                if (isSeedingCodeRef.current) return

                isCodeDerivedFromDateRef.current = false
              },
            }}
          >
            {(field) => (
              <field.TextInputField
                data-test={RATE_CARD_RATE_DRAWER_CODE_TEST_ID}
                label={translate('text_629728388c4d2300e2d380b7')}
                placeholder={translate('text_629728388c4d2300e2d380d9')}
                beforeChangeFormatter="code"
                disabled={isActiveRate || isCodeLocked}
              />
            )}
          </form.AppField>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Typography variant="captionHl" color="grey700">
                {translate('text_1787737220227tqziocrcywv')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_1787737220227zq85vxlw0aq')}
              </Typography>
            </div>

            <div className="flex items-start gap-3">
              <form.AppField name="billingIntervalCount">
                {(field) => (
                  <field.TextInputField
                    data-test={RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID}
                    className="w-30"
                    beforeChangeFormatter={['int', 'positiveNumber']}
                    disabled={isActiveRate}
                  />
                )}
              </form.AppField>

              <form.AppField name="billingIntervalUnit">
                {(field) => (
                  <field.ComboBoxField
                    dataTest={RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID}
                    containerClassName="flex-1"
                    disableClearable
                    sortValues={false}
                    data={billingIntervalUnitComboboxData}
                    disabled={isActiveRate}
                  />
                )}
              </form.AppField>
            </div>
          </div>
        </CenteredPage.PageSection>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle title={translate('text_1772133285141xbpuxbd4vrk')} />

          {!!rateCard.appliedPricingUnitCode && (
            <div
              data-test={RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID}
              className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1"
            >
              <Typography variant="captionHl" color="textSecondary">
                {translate('text_1750411499858qxgqjoqtr3e')}
              </Typography>

              <Typography variant="captionHl" color="textSecondary">
                {translate('text_1750411499858su5b7bbp5t9')}
              </Typography>

              <div className="flex items-center gap-4">
                <div className="flex h-12 items-center justify-center rounded-xl border border-grey-300 bg-grey-100 px-3">
                  <Typography variant="body" color="grey500" noWrap>
                    {`1 ${pricingUnitShortName || rateCard.appliedPricingUnitCode}`}
                  </Typography>
                </div>

                <div className="flex size-12 items-center justify-center rounded-xl border border-grey-300 bg-grey-100">
                  =
                </div>
              </div>

              <form.AppField name="conversionRate">
                {(field) => (
                  <field.AmountInputField
                    currency={rateCard.currency}
                    beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                    placeholder={translate('text_643e592657fc1ba5ce110c80')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {getCurrencySymbol(rateCard.currency)}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              </form.AppField>
            </div>
          )}

          <ChargeModelSelector
            label={translate('text_65201b8216455901fe273dd5')}
            disabled={isActiveRate}
            localCharge={localCharge}
            chargeModelComboboxData={rateModelComboboxData}
            handleUpdate={handleRateModelUpdate}
          />

          <ChargeWrapperSwitch
            chargeType={rateCard.productType === ProductTypeEnum.Fixed ? 'fixed' : 'usage'}
            chargePricingUnitShortName={pricingUnitShortName}
            currency={rateCard.currency}
            form={form}
            localCharge={localCharge}
            propertyCursor="properties"
            onExpandCustomCharge={openCustomChargeDrawer}
            showPresentationGroupKeys={false}
          />
        </CenteredPage.PageSection>

        {rateCard.billingTiming === RateCardBillingTimingEnum.Arrears && (
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle title={translate('text_17423672025282dl7iozy1ru')} />

            <div
              className="flex flex-col gap-4"
              data-test={RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID}
            >
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey700">
                  {translate('text_643e592657fc1ba5ce110c30')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_1787737220228b7rp4u9zxp6')}
                </Typography>
              </div>

              <SpendingMinimumOptionSection
                initialLocalCharge={spendingMinimumInitialCharge}
                subscriptionFormType={undefined}
                disabled={isActiveRate}
                localCharge={spendingMinimumLocalCharge}
                chargePricingUnitShortName={pricingUnitShortName}
                currency={rateCard.currency}
                isPremium={isPremium}
                chargeIndex={0}
                handleUpdate={(_name, value) => {
                  form.setFieldValue('minAmountCents', value as string)
                }}
                handleRemoveSpendingMinimum={() => {
                  form.setFieldValue('minAmountCents', '')
                }}
              />
            </div>
          </CenteredPage.PageSection>
        )}
      </>
    )
  },
})

type RateCardRateDrawerContentExtraProps = RateCardRateDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const rateCardRateDrawerContentDefaultProps: RateCardRateDrawerContentExtraProps = {
  ...rateCardRateDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// `children` is captured once at open(), so reactive state lives here and `form` is the
// data-passing seam. A "create more" save remounts the sections, scrolls up and refocuses.
export const RateCardRateDrawerContent = withForm({
  defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
  props: rateCardRateDrawerContentDefaultProps,
  render: function RateCardRateDrawerContentRender({
    form,
    rateCard,
    isEdit,
    isActiveRate,
    isCodeLocked,
    getEffectiveFromBoundary,
    initialMinAmountCents,
    resetSignal,
  }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const resetIteration = useCreateMoreResetIteration(resetSignal)

    useEffect(() => {
      if (resetIteration === 0) return

      rootRef.current
        ?.closest<HTMLElement>(`[${BASE_DRAWER_CONTENT_ATTR}]`)
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      focusFirstInput(rootRef.current)
    }, [resetIteration])

    return (
      <div ref={rootRef}>
        <div
          key={resetIteration}
          className={tw('flex flex-col gap-12', resetIteration > 0 && 'animate-fade-in-right')}
        >
          <RateCardRateDrawerFormSections
            form={form}
            rateCard={rateCard}
            isEdit={isEdit}
            isActiveRate={isActiveRate}
            isCodeLocked={isCodeLocked}
            getEffectiveFromBoundary={getEffectiveFromBoundary}
            initialMinAmountCents={initialMinAmountCents}
          />
        </div>
      </div>
    )
  },
})
