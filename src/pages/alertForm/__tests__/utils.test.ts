import { AlertTypeEnum } from '~/generated/graphql'
import { isBillableMetricAlertType, isUnitsAlertType } from '~/pages/alertForm/utils'

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
