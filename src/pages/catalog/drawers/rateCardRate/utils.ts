import { DateTime } from 'luxon'

import { intlFormatDateTime } from '~/core/timezone'
import {
  ChargeModelEnum,
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
  TimezoneEnum,
} from '~/generated/graphql'

// Exhaustive rather than a cast: the two enums carry identical members today, and this stops
// compiling the day they diverge.
const RATE_MODEL_TO_CHARGE_MODEL: Record<RateCardRateModelEnum, ChargeModelEnum> = {
  [RateCardRateModelEnum.Custom]: ChargeModelEnum.Custom,
  [RateCardRateModelEnum.Dynamic]: ChargeModelEnum.Dynamic,
  [RateCardRateModelEnum.Graduated]: ChargeModelEnum.Graduated,
  [RateCardRateModelEnum.GraduatedPercentage]: ChargeModelEnum.GraduatedPercentage,
  [RateCardRateModelEnum.Package]: ChargeModelEnum.Package,
  [RateCardRateModelEnum.Percentage]: ChargeModelEnum.Percentage,
  [RateCardRateModelEnum.Standard]: ChargeModelEnum.Standard,
  [RateCardRateModelEnum.Volume]: ChargeModelEnum.Volume,
}

export const toChargeModel = (rateModel: RateCardRateModelEnum): ChargeModelEnum =>
  RATE_MODEL_TO_CHARGE_MODEL[rateModel]

// `effectiveFrom` is a calendar day, not an instant: read and written in UTC everywhere, or the
// day shifts for anything west of UTC.
const toUtcDateTime = (isoDate: string): DateTime => DateTime.fromISO(isoDate, { zone: 'utc' })

/** `rate_01_24_2026` */
export const buildRateCodeFromEffectiveDate = (isoDate: string): string | undefined => {
  if (!isoDate) return undefined

  const date = toUtcDateTime(isoDate)

  return date.isValid ? `rate_${date.toFormat('MM_dd_yyyy')}` : undefined
}

export const formatEffectiveDate = (isoDate: string): string =>
  intlFormatDateTime(isoDate, { timezone: TimezoneEnum.TzUtc }).date

// `RateCardRate#validate_effective_from_is_appended`: strictly after the currently effective rate.
export const isEffectiveFromAppendable = (isoDate: string, boundary: string | null): boolean => {
  if (!isoDate || !boundary) return true

  return DateTime.fromISO(isoDate) > DateTime.fromISO(boundary)
}

// Carries a boundary moved by a save across a form reset, which re-derives it from an older
// card snapshot.
export const laterEffectiveFrom = (a: string | null, b: string | null): string | null => {
  if (!a) return b
  if (!b) return a

  return DateTime.fromISO(a) > DateTime.fromISO(b) ? a : b
}

// Excludes the rate being edited, like the backend validator: comparing it against itself would
// invalidate its own date and block every save.
export const deriveEffectiveFromBoundary = (
  rateCard: Pick<RateCardForRateDrawerFragment, 'activeRate'>,
  rate?: Pick<RateCardRateForDrawerFragment, 'id'>,
): string | null => {
  const activeRate = rateCard.activeRate

  if (!activeRate || activeRate.id === rate?.id) return null

  return activeRate.effectiveFrom
}

// `RateCardRates::UpdateService`: terminated is frozen, and on a card attached to subscriptions
// only a pending rate may still change.
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

// `RateCardRates::DestroyService#only_pending_rates_can_be_deleted`. The card's attachments are
// deliberately not consulted: a pending rate has never priced anything.
export const isRateCardRateDeletable = (
  rate: Pick<RateCardRateForDrawerFragment, 'status'>,
): boolean => rate.status === RateCardRateStatusEnum.Pending
