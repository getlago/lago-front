import { AlertTypeEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import {
  isAlertTypePremiumLocked,
  isBillableMetricAlertType,
  isUnitsAlertType,
} from '~/pages/alertForm/utils'

describe('isUnitsAlertType', () => {
  describe('GIVEN a subscription alert type', () => {
    it.each([
      [AlertTypeEnum.BillableMetricCurrentUsageUnits, true],
      [AlertTypeEnum.BillableMetricLifetimeUsageUnits, true],
      [AlertTypeEnum.BillableMetricCurrentUsageAmount, false],
      [AlertTypeEnum.CurrentUsageAmount, false],
      [AlertTypeEnum.LifetimeUsageAmount, false],
    ])('THEN should return %s for %s', (alertType, expected) => {
      expect(isUnitsAlertType(alertType)).toBe(expected)
    })
  })

  describe('GIVEN no alert type picked yet', () => {
    it('THEN should return false', () => {
      expect(isUnitsAlertType('')).toBe(false)
    })
  })
})

describe('isBillableMetricAlertType', () => {
  describe('GIVEN a subscription alert type', () => {
    it.each([
      [AlertTypeEnum.BillableMetricCurrentUsageUnits, true],
      [AlertTypeEnum.BillableMetricCurrentUsageAmount, true],
      [AlertTypeEnum.BillableMetricLifetimeUsageUnits, true],
      [AlertTypeEnum.CurrentUsageAmount, false],
      [AlertTypeEnum.LifetimeUsageAmount, false],
    ])('THEN should return %s for %s', (alertType, expected) => {
      expect(isBillableMetricAlertType(alertType)).toBe(expected)
    })
  })

  describe('GIVEN no alert type picked yet', () => {
    it('THEN should return false', () => {
      expect(isBillableMetricAlertType('')).toBe(false)
    })
  })
})

describe('isAlertTypePremiumLocked', () => {
  describe('GIVEN an organization without any premium addon', () => {
    it.each([
      [AlertTypeEnum.BillableMetricLifetimeUsageUnits, true],
      [AlertTypeEnum.LifetimeUsageAmount, true],
      [AlertTypeEnum.BillableMetricCurrentUsageUnits, false],
      [AlertTypeEnum.BillableMetricCurrentUsageAmount, false],
      [AlertTypeEnum.CurrentUsageAmount, false],
    ])('THEN should return %s for %s', (alertType, expected) => {
      expect(isAlertTypePremiumLocked(alertType, [])).toBe(expected)
    })

    it('THEN should treat a missing premium integration list as no addon', () => {
      expect(isAlertTypePremiumLocked(AlertTypeEnum.LifetimeUsageAmount, undefined)).toBe(true)
      expect(isAlertTypePremiumLocked(AlertTypeEnum.LifetimeUsageAmount, null)).toBe(true)
    })
  })

  describe('GIVEN an organization with the granular lifetime usage addon', () => {
    it('THEN should unlock the billable metric lifetime usage units type only', () => {
      const premiumIntegrations = [PremiumIntegrationTypeEnum.GranularLifetimeUsage]

      expect(
        isAlertTypePremiumLocked(
          AlertTypeEnum.BillableMetricLifetimeUsageUnits,
          premiumIntegrations,
        ),
      ).toBe(false)
      expect(isAlertTypePremiumLocked(AlertTypeEnum.LifetimeUsageAmount, premiumIntegrations)).toBe(
        true,
      )
    })
  })

  describe('GIVEN an organization using lifetime usage', () => {
    it.each([
      PremiumIntegrationTypeEnum.LifetimeUsage,
      PremiumIntegrationTypeEnum.ProgressiveBilling,
    ])('THEN should unlock the lifetime usage amount type with the %s addon', (addon) => {
      expect(isAlertTypePremiumLocked(AlertTypeEnum.LifetimeUsageAmount, [addon])).toBe(false)
    })

    it('THEN should keep the billable metric lifetime usage units type locked', () => {
      expect(
        isAlertTypePremiumLocked(AlertTypeEnum.BillableMetricLifetimeUsageUnits, [
          PremiumIntegrationTypeEnum.LifetimeUsage,
        ]),
      ).toBe(true)
    })
  })

  describe('GIVEN no alert type picked yet', () => {
    it('THEN should return false', () => {
      expect(isAlertTypePremiumLocked('', [])).toBe(false)
    })
  })
})
