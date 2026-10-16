import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { ComponentType, useMemo } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ChargeModelSelector } from '~/components/plans/chargeAccordion/ChargeModelSelector'
import { SpendingMinimumOptionSection } from '~/components/plans/chargeAccordion/SpendingMinimumOptionSection'
import { useCustomChargeDrawer } from '~/components/plans/drawers/common/useCustomChargeDrawer'
import { chargeModelLookupTranslation } from '~/core/constants/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePropertiesInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import {
  AnyReactFormApi,
  RateWrapperSwitch,
  RateWrapperSwitchProps,
} from '~/pages/catalog/rateProperties/RateWrapperSwitch'
import {
  getAvailableRateModels,
  NO_AVAILABLE_RATE_MODELS_KEY,
  RATE_MODEL_AVAILABILITY_LOADING_KEY,
  RATE_MODEL_UNAVAILABLE_KEY,
} from '~/pages/catalog/utils/rateModelAvailability'

import { BILLING_INTERVAL_UNIT_TRANSLATION_KEY } from './constants'
import { getRatePropertiesShape } from './getRatePropertiesShape'
import { toChargeModel } from './utils'

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
  recurring?: boolean | null
  proration: boolean
}

// Both the catalog rate form and the rate phase form keep these at their root, under these names.
export const RATE_FIELD_GROUP_FIELDS = {
  billingIntervalCount: 'billingIntervalCount',
  billingIntervalUnit: 'billingIntervalUnit',
  conversionRate: 'conversionRate',
  rateModel: 'rateModel',
  properties: 'properties',
  minAmountCents: 'minAmountCents',
} as const

// Bound to the host form's root `properties`, which both hosts share; same cast as the tier tables
// inside `RateWrapperSwitch`, so TanStack does not infer the field path from a widened form.
const BoundRateWrapperSwitch = RateWrapperSwitch as ComponentType<
  RateWrapperSwitchProps & { form: AnyReactFormApi; fields: 'properties' }
>

const defaultRateCard: RateCardRateDrawerRateCard = {
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  productType: ProductTypeEnum.Fixed,
  aggregationType: undefined,
  proration: false,
}

const usePricingUnitShortName = (
  appliedPricingUnitCode: string | null | undefined,
): string | undefined => {
  const { pricingUnits } = useCustomPricingUnits()

  // Resolved on render, not at open(): `children` is captured once, so a short name read
  // before the pricing-units query resolved would stick for the whole session.
  return pricingUnits.find((unit) => unit.code === appliedPricingUnitCode)?.shortName
}

type BillingIntervalValues = {
  billingIntervalCount: string
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
}

const billingIntervalDefaultValues: BillingIntervalValues = {
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
}

export const RateBillingIntervalFields = withFieldGroup({
  defaultValues: billingIntervalDefaultValues,
  props: { disabled: false },
  render: function RateBillingIntervalFieldsRender({ group, disabled }) {
    const { translate } = useInternationalization()

    const billingIntervalUnitComboboxData = useMemo(
      () =>
        Object.entries(BILLING_INTERVAL_UNIT_TRANSLATION_KEY).map(([unit, labelKey]) => ({
          value: unit,
          label: translate(labelKey),
        })),
      [translate],
    )

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_1787737220227tqziocrcywv')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_1787737220227zq85vxlw0aq')}
          </Typography>
        </div>

        <div className="flex items-start gap-3">
          <group.AppField name="billingIntervalCount">
            {(field) => (
              <field.TextInputField
                data-test={RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID}
                className="w-30"
                beforeChangeFormatter={['int', 'positiveNumber']}
                disabled={disabled}
              />
            )}
          </group.AppField>

          <group.AppField name="billingIntervalUnit">
            {(field) => (
              <field.ComboBoxField
                dataTest={RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_UNIT_TEST_ID}
                containerClassName="flex-1"
                disableClearable
                sortValues={false}
                data={billingIntervalUnitComboboxData}
                disabled={disabled}
              />
            )}
          </group.AppField>
        </div>
      </div>
    )
  },
})

type PricingSettingsValues = {
  conversionRate: string
  rateModel: RateCardRateModelEnum
  properties: RatePropertiesInput
}

type PricingSettingsProps = {
  rateCard: RateCardRateDrawerRateCard
  // The catalog's active rate keeps its model but its amounts stay editable.
  isRateModelLocked: boolean
  disabled: boolean
}

const pricingSettingsDefaultValues: PricingSettingsValues = {
  conversionRate: '',
  rateModel: RateCardRateModelEnum.Standard,
  properties: getRatePropertiesShape(),
}

const pricingSettingsDefaultProps: PricingSettingsProps = {
  rateCard: defaultRateCard,
  isRateModelLocked: false,
  disabled: false,
}

export const RatePricingSettingsSection = withFieldGroup({
  defaultValues: pricingSettingsDefaultValues,
  props: pricingSettingsDefaultProps,
  render: function RatePricingSettingsSectionRender({
    group,
    rateCard,
    isRateModelLocked,
    disabled,
  }) {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
    const { getFixedChargeModelComboboxData, getUsageChargeModelComboboxData } = useChargeForm()
    const pricingUnitShortName = usePricingUnitShortName(rateCard.appliedPricingUnitCode)
    const rateModel = useStore(group.store, (state) => state.values.rateModel)
    const hostForm = group.form as unknown as AnyReactFormApi
    const isRateModelEditable = !isRateModelLocked && !disabled

    const availableRateModels = getAvailableRateModels(rateCard)
    const availableRateModelValues: readonly string[] = availableRateModels ?? []
    const isRateModelAvailable = availableRateModelValues.includes(rateModel)
    let rateModelOptions: BasicComboBoxData[] = []

    if (rateCard.productType === ProductTypeEnum.Fixed) {
      rateModelOptions = getFixedChargeModelComboboxData()
    } else if (rateCard.aggregationType) {
      rateModelOptions = getUsageChargeModelComboboxData({
        isPremium,
        aggregationType: rateCard.aggregationType,
      })
    }

    const rateModelComboboxData = rateModelOptions.filter((option) =>
      availableRateModelValues.includes(option.value),
    )

    if (!isRateModelAvailable) {
      const currentModelOption = rateModelOptions.find((option) => option.value === rateModel) ?? {
        label: translate(chargeModelLookupTranslation[toChargeModel(rateModel)]),
        value: rateModel,
      }

      rateModelComboboxData.push({ ...currentModelOption, disabled: true })
    }

    let modelCompatibilityMessage: string | undefined

    if (isRateModelEditable) {
      if (availableRateModels?.length === 0) {
        modelCompatibilityMessage = translate(NO_AVAILABLE_RATE_MODELS_KEY)
      } else if (availableRateModels && !isRateModelAvailable) {
        modelCompatibilityMessage = translate(RATE_MODEL_UNAVAILABLE_KEY)
      }
    }

    // Without this the Custom model's JSON editor never writes back to the form.
    const { openCustomChargeDrawer } = useCustomChargeDrawer({
      onSave: (customProperties) =>
        hostForm.setFieldValue('properties.customProperties', customProperties),
    })

    const handleRateModelUpdate = (name: string, value: unknown): void => {
      if (name !== 'chargeModel') return

      const nextRateModel = availableRateModels?.find((model) => model === value)

      if (!nextRateModel || nextRateModel === rateModel || !isRateModelEditable) return

      if (!isPremium && nextRateModel === RateCardRateModelEnum.GraduatedPercentage) {
        void openPremiumWarningDialog()
        return
      }

      // Not `form.reset`: that clears `isDirty` too, and the drawer would stop prompting.
      Object.keys(hostForm.state.fieldMeta)
        .filter((field) => field === 'properties' || field.startsWith('properties.'))
        .forEach((field) => hostForm.resetField(field))

      group.setFieldValue('rateModel', nextRateModel)
      group.setFieldValue('properties', getRatePropertiesShape())
    }

    return (
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

            <group.AppField name="conversionRate">
              {(field) => (
                <field.AmountInputField
                  currency={rateCard.currency}
                  beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                  placeholder={translate('text_643e592657fc1ba5ce110c80')}
                  disabled={disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {getCurrencySymbol(rateCard.currency)}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </group.AppField>
          </div>
        )}

        {isRateModelEditable && availableRateModels === undefined && (
          <Alert type="info">{translate(RATE_MODEL_AVAILABILITY_LOADING_KEY)}</Alert>
        )}
        <group.AppField name="rateModel">
          {() => (
            <ChargeModelSelector
              label={translate('text_65201b8216455901fe273dd5')}
              disabled={!isRateModelEditable || availableRateModels === undefined}
              localCharge={{ chargeModel: toChargeModel(rateModel) }}
              chargeModelComboboxData={rateModelComboboxData}
              handleUpdate={handleRateModelUpdate}
              alreadyUsedChargeAlertMessage={modelCompatibilityMessage}
            />
          )}
        </group.AppField>

        <BoundRateWrapperSwitch
          form={hostForm}
          fields="properties"
          rateModel={rateModel}
          productType={rateCard.productType}
          currency={rateCard.currency}
          pricingUnitShortName={pricingUnitShortName}
          disabled={disabled}
          onExpandCustomCharge={openCustomChargeDrawer}
        />
      </CenteredPage.PageSection>
    )
  },
})

type InvoicingSettingsProps = {
  rateCard: RateCardRateDrawerRateCard
  disabled: boolean
  // Captured at open time so clearing the input does not collapse the section mid-edit.
  initialMinAmountCents: string
}

const invoicingSettingsDefaultProps: InvoicingSettingsProps = {
  rateCard: defaultRateCard,
  disabled: false,
  initialMinAmountCents: '',
}

export const RateInvoicingSettingsSection = withFieldGroup({
  defaultValues: { minAmountCents: '' },
  props: invoicingSettingsDefaultProps,
  render: function RateInvoicingSettingsSectionRender({
    group,
    rateCard,
    disabled,
    initialMinAmountCents,
  }) {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const pricingUnitShortName = usePricingUnitShortName(rateCard.appliedPricingUnitCode)
    const minAmountCents = useStore(group.store, (state) => state.values.minAmountCents)

    // The backend rejects a spending minimum on a pay-in-advance card.
    if (rateCard.billingTiming !== RateCardBillingTimingEnum.Arrears) return null

    return (
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
            initialLocalCharge={{ minAmountCents: initialMinAmountCents }}
            subscriptionFormType={undefined}
            disabled={disabled}
            localCharge={{ minAmountCents }}
            chargePricingUnitShortName={pricingUnitShortName}
            currency={rateCard.currency}
            isPremium={isPremium}
            chargeIndex={0}
            handleUpdate={(_name, value) => {
              group.setFieldValue('minAmountCents', value as string)
            }}
            handleRemoveSpendingMinimum={() => {
              group.setFieldValue('minAmountCents', '')
            }}
          />
        </div>
      </CenteredPage.PageSection>
    )
  },
})
