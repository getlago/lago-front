import { AlertTypeEnum } from '~/generated/graphql'

/** Billable-metric units alerts hold units, not amounts: no currency, integer values only. */
export const isUnitsAlertType = (alertType?: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits ||
  alertType === AlertTypeEnum.BillableMetricLifetimeUsageUnits

/** These alert types are scoped to a billable metric the user has to pick. */
export const isBillableMetricAlertType = (alertType?: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits ||
  alertType === AlertTypeEnum.BillableMetricCurrentUsageAmount ||
  alertType === AlertTypeEnum.BillableMetricLifetimeUsageUnits
