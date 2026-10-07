import { DateTime } from 'luxon'

import { composeChargeFilterDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  DEFAULT_SERIES_KEY,
  OTHER_SERIES_KEY,
  REALTIME_AGGREGATION_TYPES,
  REALTIME_CHARGE_MODELS,
} from './constants'
import { RealtimeUsageCharge, RealtimeUsageFilter } from './types'

export const isRealtimeCharge = (charge: RealtimeUsageCharge): boolean =>
  REALTIME_AGGREGATION_TYPES.includes(charge.billableMetric.aggregationType) &&
  REALTIME_CHARGE_MODELS.includes(charge.chargeModel) &&
  !charge.payInAdvance &&
  !charge.prorated &&
  !charge.billableMetric.recurring &&
  !charge.billableMetric.expression

// The charge default and the series the API folds past its biggest filters
// both come without a filter id; only the `other` flag tells them apart.
export const seriesKeyOf = (series: { chargeFilterId?: string | null; other: boolean }): string => {
  if (series.other) return OTHER_SERIES_KEY

  return series.chargeFilterId || DEFAULT_SERIES_KEY
}

export const filterLabelOf = (filter: RealtimeUsageFilter, translate: TranslateFunc): string => {
  if (filter.other) return translate('text_1787607502687pyo0kxh1flz')
  if (!filter.chargeFilterId) return translate('text_17876075026872bdz1e5aeep')

  // A filter deleted since its usage was counted has no values left to name it by.
  return (
    composeChargeFilterDisplayName({
      invoiceDisplayName: filter.invoiceDisplayName,
      values: filter.values || {},
    }) || filter.chargeFilterId
  )
}

export const formatUnits = (value: number): string =>
  intlFormatNumber(value, { style: 'decimal', maximumFractionDigits: 2 })

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The API snaps the window to the customer's hour walls, which differ from the
// browser's under a half-hour offset.
export const windowStartOf = (
  now: DateTime,
  windowInHours: number,
  timezone: TimezoneEnum,
): string =>
  now
    .setZone(getTimezoneConfig(timezone).name)
    .startOf('hour')
    .minus({ hours: windowInHours - 1 })
    .toUTC()
    .toISO() || ''
