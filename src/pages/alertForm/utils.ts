import { AlertTypeEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'

/** Billable-metric units alerts hold units, not amounts: no currency, integer values only. */
export const isUnitsAlertType = (alertType?: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits ||
  alertType === AlertTypeEnum.BillableMetricLifetimeUsageUnits

/** These alert types are scoped to a billable metric the user has to pick. */
export const isBillableMetricAlertType = (alertType?: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.BillableMetricCurrentUsageUnits ||
  alertType === AlertTypeEnum.BillableMetricCurrentUsageAmount ||
  alertType === AlertTypeEnum.BillableMetricLifetimeUsageUnits

/**
 * Alert types the API refuses to create without a premium addon. The org needs
 * at least one of the listed addons for the type to be selectable, otherwise
 * the mutation fails with `feature_not_available`.
 */
const PREMIUM_ALERT_TYPE_ADDONS: Partial<Record<AlertTypeEnum, PremiumIntegrationTypeEnum[]>> = {
  [AlertTypeEnum.BillableMetricLifetimeUsageUnits]: [
    PremiumIntegrationTypeEnum.GranularLifetimeUsage,
  ],
  // Mirrors the API `organization.using_lifetime_usage?`, as already done in
  // `SubscriptionUsageLifetimeGraph`
  [AlertTypeEnum.LifetimeUsageAmount]: [
    PremiumIntegrationTypeEnum.LifetimeUsage,
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  ],
}

/** Whether the org lacks the addon(s) unlocking the given alert type. */
export const isAlertTypePremiumLocked = (
  alertType: AlertTypeEnum | '',
  premiumIntegrations?: PremiumIntegrationTypeEnum[] | null,
): boolean => {
  if (!alertType) return false

  const requiredAddons = PREMIUM_ALERT_TYPE_ADDONS[alertType]

  if (!requiredAddons) return false

  return !requiredAddons.some((addon) => !!premiumIntegrations?.includes(addon))
}
