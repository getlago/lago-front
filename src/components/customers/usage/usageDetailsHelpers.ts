import { ChargeUsage, ProjectedChargeUsage } from '~/generated/graphql'

export const NO_ID_FILTER_DEFAULT_VALUE = 'NO_ID_FILTER_DEFAULT_VALUE'

export type SubscriptionUsageDetailDrawerUsage = ChargeUsage | ProjectedChargeUsage

export type PresentationBreakdownRow = {
  id: string
  __isBreakdown: true
  presentationBy: Record<string, unknown>
  breakdownUnits: string
}

export const isBreakdownRow = (row: unknown): row is PresentationBreakdownRow =>
  typeof row === 'object' && row !== null && '__isBreakdown' in row

export const sumBreakdownUnits = (
  breakdowns: ReadonlyArray<{ units: string }> | null | undefined,
): number => (breakdowns ?? []).reduce((acc, b) => acc + (Number(b.units) || 0), 0)

// A "meaningful" presentation value is one that's actually present — we
// suppress null/undefined/empty-string entries so the UI never renders
// blank chips (or worse, the literal string "undefined").
export const isMeaningfulPresentationValue = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).length > 0

export const makeBreakdownRows = (
  parentId: string,
  breakdowns: ReadonlyArray<{ presentationBy: unknown; units: string }> | null | undefined,
): PresentationBreakdownRow[] => {
  // The backend emits one breakdown per fee — when a parent (grouped usage or
  // charge usage) spans multiple fees, identical `presentationBy` keys repeat
  // and the displayed units would over-count vs the parent row. Aggregate here
  // so the breakdown rows partition the parent's units.
  const grouped = new Map<string, { presentationBy: Record<string, unknown>; total: number }>()

  for (const b of breakdowns ?? []) {
    const presentationBy = (b.presentationBy ?? {}) as Record<string, unknown>

    // Drop breakdowns where every key has a null/undefined value — those
    // would render as a row of empty chips, which the QA team flagged as
    // confusing. The parent row's units still cover those fees.
    const hasAnyMeaningfulValue = Object.values(presentationBy).some(isMeaningfulPresentationValue)

    if (!hasAnyMeaningfulValue) continue

    const stableKey = JSON.stringify(
      Object.keys(presentationBy)
        .sort()
        .map((k) => [k, presentationBy[k]]),
    )
    const units = Number(b.units) || 0
    const existing = grouped.get(stableKey)

    if (existing) {
      existing.total += units
    } else {
      grouped.set(stableKey, { presentationBy, total: units })
    }
  }

  return Array.from(grouped.values()).map((entry, i) => ({
    id: `${parentId}__breakdown__${i}`,
    __isBreakdown: true,
    presentationBy: entry.presentationBy,
    breakdownUnits: String(entry.total),
  }))
}
