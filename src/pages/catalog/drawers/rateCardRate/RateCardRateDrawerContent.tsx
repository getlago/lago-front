import { useStore } from '@tanstack/react-form'
import { useMemo, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
} from './constants'
import {
  RATE_FIELD_GROUP_FIELDS,
  RateBillingIntervalFields,
  RateCardRateDrawerRateCard,
  RateInvoicingSettingsSection,
  RatePricingSettingsSection,
} from './RateCardRateFieldGroups'
import {
  buildRateCodeFromEffectiveDate,
  formatEffectiveDate,
  isEffectiveFromAppendable,
} from './utils'

export const RATE_CARD_RATE_DRAWER_CODE_TEST_ID = 'rate-card-rate-code'

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
    proration: false,
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

    const effectiveFrom = useStore(form.store, (state) => state.values.effectiveFrom)
    const effectiveFromBoundary = getEffectiveFromBoundary()

    // Seeding stops once the code is edited by hand. The second ref marks this component's
    // own writes, which the code field's listener would otherwise read as a hand edit.
    const isCodeDerivedFromDateRef = useRef(!isEdit)
    const isSeedingCodeRef = useRef(false)

    // Interpolates the boundary date, which `translate()` cannot do from a zod message.
    const effectiveFromErrorOverride = useMemo(() => {
      if (!effectiveFromBoundary) return undefined
      if (isEffectiveFromAppendable(effectiveFrom, effectiveFromBoundary)) return undefined

      return translate(RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY, {
        date: formatEffectiveDate(effectiveFromBoundary),
      })
    }, [effectiveFrom, effectiveFromBoundary, translate])

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
                disabled={isCodeLocked}
              />
            )}
          </form.AppField>

          <RateBillingIntervalFields
            form={form}
            fields={RATE_FIELD_GROUP_FIELDS}
            disabled={isActiveRate}
          />
        </CenteredPage.PageSection>

        <RatePricingSettingsSection
          form={form}
          fields={RATE_FIELD_GROUP_FIELDS}
          rateCard={rateCard}
          isRateModelLocked={isActiveRate}
          disabled={false}
        />

        <RateInvoicingSettingsSection
          form={form}
          fields={RATE_FIELD_GROUP_FIELDS}
          rateCard={rateCard}
          disabled={isActiveRate}
          initialMinAmountCents={initialMinAmountCents}
        />
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
    return (
      <CreateMoreResetBoundary resetSignal={resetSignal}>
        <RateCardRateDrawerFormSections
          form={form}
          rateCard={rateCard}
          isEdit={isEdit}
          isActiveRate={isActiveRate}
          isCodeLocked={isCodeLocked}
          getEffectiveFromBoundary={getEffectiveFromBoundary}
          initialMinAmountCents={initialMinAmountCents}
        />
      </CreateMoreResetBoundary>
    )
  },
})
