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

/**
 * `RateCardRateModelEnum` and `ChargeModelEnum` are distinct GraphQL types carrying identical
 * string members, and every charge component keys off those strings. The exhaustive `Record`
 * is what makes the bridge safe: should the two enums ever diverge, this stops compiling
 * instead of silently casting a member the charge world cannot render.
 */
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

/**
 * The same rendering the rates table and the rate overview use, so the boundary date quoted in
 * the error copy reads identically to the dates shown beside it. UTC for the reason above.
 */
export const formatEffectiveDate = (isoDate: string): string =>
  intlFormatDateTime(isoDate, { timezone: TimezoneEnum.TzUtc }).date

/**
 * The card's rate timeline is append-only: a rate may only be inserted strictly after the
 * currently effective one (`RateCardRate#validate_effective_from_is_appended`). `boundary` is
 * that rate's `effectiveFrom`, or null when the card has no effective rate yet.
 */
export const isEffectiveFromAppendable = (isoDate: string, boundary: string | null): boolean => {
  if (!isoDate || !boundary) return true

  return DateTime.fromISO(isoDate) > DateTime.fromISO(boundary)
}

/**
 * The later of two append boundaries, null meaning "no boundary yet". Used to carry a boundary
 * moved by a save forward across a form reset, which re-derives it from an older card snapshot.
 */
export const laterEffectiveFrom = (a: string | null, b: string | null): string | null => {
  if (!a) return b
  if (!b) return a

  return DateTime.fromISO(a) > DateTime.fromISO(b) ? a : b
}

/**
 * The rate a new date must land after - the card's currently effective rate, EXCEPT when that
 * is the very rate being edited: comparing it against itself would make its own date invalid
 * and block every save. Mirrors `validate_effective_from_is_appended`, which excludes self.
 */
export const deriveEffectiveFromBoundary = (
  rateCard: Pick<RateCardForRateDrawerFragment, 'activeRate'>,
  rate?: Pick<RateCardRateForDrawerFragment, 'id'>,
): string | null => {
  const activeRate = rateCard.activeRate

  if (!activeRate || activeRate.id === rate?.id) return null

  return activeRate.effectiveFrom
}

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

/**
 * Deleting is soft and audit-safe only before the rate ever applied, which is the single rule
 * `RateCardRates::DestroyService` enforces (`only_pending_rates_can_be_deleted`). The parent
 * card's attachments are deliberately not consulted: a pending rate has never priced anything,
 * so it stays deletable even on a card already in a plan or a subscription.
 */
export const isRateCardRateDeletable = (
  rate: Pick<RateCardRateForDrawerFragment, 'status'>,
): boolean => rate.status === RateCardRateStatusEnum.Pending
