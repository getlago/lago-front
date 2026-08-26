import { DateTime } from 'luxon'
import { z } from 'zod'

import { AnyChargeModel } from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import {
  PropertiesZodInput,
  validateChargeProperties,
} from '~/formValidation/chargePropertiesSchema'
import {
  PropertiesInput,
  RateCardForRateDrawerFragment,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateForDrawerFragment,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'

export const RATE_CARD_RATE_FORM_ID = 'rateCardRateForm'

export const RATE_CARD_RATE_FORM_SUBMIT_TEST_ID = 'rate-card-rate-form-submit'

// Reused from other forms (`pnpm translations:add` only for genuinely new copy).
export const VALUE_REQUIRED_KEY = 'text_624ea7c29103fd010732ab7d' // "Value is mandatory to move forward"

// New translation keys are exported as named constants (feature convention) so tests
// and siblings reference them instead of duplicating the raw ids.
export const RATE_CARD_RATE_EFFECTIVE_DATE_LABEL_KEY = 'text_1787737220227bfxpshdo133'
export const RATE_CARD_RATE_EFFECTIVE_DATE_DESCRIPTION_KEY = 'text_1787737220227auyye6x3cr0'
export const RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY = 'text_1787737220227ti37lv0cu28'
export const RATE_CARD_RATE_BILLING_INTERVAL_LABEL_KEY = 'text_1787737220227tqziocrcywv'
export const RATE_CARD_RATE_BILLING_INTERVAL_DESCRIPTION_KEY = 'text_1787737220227zq85vxlw0aq'
export const RATE_CARD_RATE_MODEL_LABEL_KEY = 'text_17877372202270yaq0vyqria'

// Copy shared by more than one surface (drawer, rates tab, row actions, details page) lives
// here so a read-only surface never has to import the drawer module to reach a label.
export const RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY = 'text_1787737220227lhrw4x3r4h8'
export const RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY = 'text_1787737220227dhuxfszp0v6'
export const RATE_CARD_RATE_DRAWER_DESCRIPTION_KEY = 'text_17877372202276uc54jqy1np'
export const RATE_CARD_RATES_SECTION_TITLE_KEY = 'text_1784930705742tg0kbcsak2v'
export const RATE_CARD_RATE_VIEW_ACTION_KEY = 'text_1787737220228sypguqmiv1l'
export const RATE_CARD_RATE_DUPLICATE_DATE_KEY = 'text_1787753924848luck8g8y1qd'
export const RATE_CARD_RATE_SAVE_FAILED_KEY = 'text_1787753924848adhyrzqb0gz'
export const RATE_CARD_RATE_DELETE_ACTION_KEY = 'text_1787737220228txu8nd2qayi'

export const BILLING_INTERVAL_UNIT_TRANSLATION_KEY: Record<
  RateCardRateBillingIntervalUnitEnum,
  string
> = {
  [RateCardRateBillingIntervalUnitEnum.Day]: 'text_1787737220227aguxuoxtf61',
  [RateCardRateBillingIntervalUnitEnum.Week]: 'text_1787737220227assiqlb0so6',
  [RateCardRateBillingIntervalUnitEnum.Month]: 'text_1787737220227gl11bsf4our',
  [RateCardRateBillingIntervalUnitEnum.Year]: 'text_1787737220227766n4sxclwx',
}

export interface RateCardRateFormValues {
  effectiveFrom: string
  code: string
  billingIntervalCount: string
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
  conversionRate: string
  rateModel: RateCardRateModelEnum
  properties?: PropertiesInput
  minAmountCents: string
}

export const RATE_CARD_RATE_FORM_DEFAULTS: RateCardRateFormValues = {
  effectiveFrom: '',
  code: '',
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  conversionRate: '',
  rateModel: RateCardRateModelEnum.Standard,
  properties: getPropertyShape({}),
  minAmountCents: '',
}

// The effective date is a calendar day, not an instant: the picker is pinned to UTC (like every
// other date-only field in the app) so the day the user clicked is the day the backend floors to.
// Reading it back in UTC therefore keeps the derived code and the error copy on that same day.
const toUtcDateTime = (isoDate: string): DateTime => DateTime.fromISO(isoDate, { zone: 'utc' })

/** `rate_01_24_2026` - the code the Code field is seeded with when a date is picked. */
export const buildRateCodeFromEffectiveDate = (isoDate: string): string | undefined => {
  if (!isoDate) return undefined

  const date = toUtcDateTime(isoDate)

  return date.isValid ? `rate_${date.toFormat('MM_dd_yyyy')}` : undefined
}

export const formatEffectiveDate = (isoDate: string): string =>
  toUtcDateTime(isoDate).toFormat('MM/dd/yyyy')

/**
 * The card's rate timeline is append-only: a rate may only be inserted strictly after the
 * currently effective one (`RateCardRate#validate_effective_from_is_appended`). `boundary` is
 * that rate's `effectiveFrom`, or null when the card has no effective rate yet.
 */
export const isEffectiveFromAppendable = (isoDate: string, boundary: string | null): boolean => {
  if (!isoDate || !boundary) return true

  return DateTime.fromISO(isoDate) > DateTime.fromISO(boundary)
}

export type RateCardRateSchemaContext = {
  /** The parent card prices in a custom pricing unit, so a conversion rate is mandatory. */
  requiresConversionRate: boolean
  /** `effectiveFrom` of the rate currently in effect, or null when the card has none yet. */
  effectiveFromBoundary: string | null
}

/**
 * The context is read through a getter rather than captured: the schema is built once for the
 * form's lifetime while the card being edited changes on every `openDrawer`.
 */
export const buildRateCardRateSchema = (getContext: () => RateCardRateSchemaContext) =>
  z
    .object({
      effectiveFrom: z.string(),
      code: z.string().min(1, { message: VALUE_REQUIRED_KEY }),
      billingIntervalCount: z.string(),
      billingIntervalUnit: z.nativeEnum(RateCardRateBillingIntervalUnitEnum),
      conversionRate: z.string(),
      rateModel: z.nativeEnum(RateCardRateModelEnum),
      properties: z.record(z.string(), z.unknown()).optional(),
      minAmountCents: z.string(),
    })
    .superRefine((values, ctx) => {
      const { requiresConversionRate, effectiveFromBoundary } = getContext()

      if (!values.effectiveFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effectiveFrom'],
          message: VALUE_REQUIRED_KEY,
        })
      } else if (!isEffectiveFromAppendable(values.effectiveFrom, effectiveFromBoundary)) {
        // The rendered copy interpolates the boundary date, which `translate()` cannot do
        // from a zod message - the drawer body passes it through `errorOverride` instead.
        // This issue exists to block the submit.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effectiveFrom'],
          message: RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
        })
      }

      const billingIntervalCount = Number(values.billingIntervalCount)

      if (!Number.isInteger(billingIntervalCount) || billingIntervalCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['billingIntervalCount'],
          message: VALUE_REQUIRED_KEY,
        })
      }

      // Mandatory as soon as the rate card prices in a custom pricing unit
      // (`RateCardRate#validate_pricing_unit_conversion_rate`).
      if (requiresConversionRate && Number(values.conversionRate) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conversionRate'],
          message: VALUE_REQUIRED_KEY,
        })
      }

      validateChargeProperties(
        // The two enums are distinct GraphQL types with identical string members, and the
        // charge validators key off those strings.
        values.rateModel as unknown as AnyChargeModel,
        values.properties as PropertiesZodInput | undefined,
        ctx,
        ['properties'],
      )
    })

/**
 * A rate is editable at all only while the backend accepts a change: terminated rates are
 * frozen for audit, and on a card billed by subscriptions the live pricing may only be
 * appended to, so anything past `pending` is read-only there
 * (`RateCardRates::UpdateService`).
 */
export const isRateCardRateEditable = ({
  rate,
  rateCard,
}: {
  rate: Pick<RateCardRateForDrawerFragment, 'status'>
  rateCard: Pick<RateCardForRateDrawerFragment, 'attachedToSubscriptions'>
}): boolean => {
  if (rate.status === RateCardRateStatusEnum.Terminated) return false

  return !rateCard.attachedToSubscriptions || rate.status === RateCardRateStatusEnum.Pending
}

/** Deleting is soft and audit-safe only before the rate ever applied. */
export const isRateCardRateDeletable = (
  rate: Pick<RateCardRateForDrawerFragment, 'status'>,
): boolean => rate.status === RateCardRateStatusEnum.Pending
