import { StatusTypeEnum } from '~/generated/graphql'

import { isSubscriptionPurchaseOrderNumberEditable, normalizePurchaseOrderNumber } from '../utils'

describe('normalizePurchaseOrderNumber', () => {
  describe('GIVEN an empty-ish value', () => {
    describe('WHEN the value is undefined, null, empty or whitespace only', () => {
      it.each([
        ['undefined', undefined],
        ['null', null],
        ['empty string', ''],
        ['single space', ' '],
        ['multiple spaces', '     '],
        ['tabs and spaces', ' \t  \n '],
      ])('THEN should return null for %s', (_, input) => {
        expect(normalizePurchaseOrderNumber(input)).toBeNull()
      })
    })
  })

  describe('GIVEN a value with meaningful content', () => {
    describe('WHEN the value contains characters', () => {
      it.each([
        ['already trimmed', 'PO-123', 'PO-123'],
        ['leading whitespace', '   PO-123', 'PO-123'],
        ['trailing whitespace', 'PO-123   ', 'PO-123'],
        ['surrounding whitespace', '  PO-123  ', 'PO-123'],
        ['inner whitespace preserved', '  PO 123 456  ', 'PO 123 456'],
      ])('THEN should return the trimmed value for %s', (_, input, expected) => {
        expect(normalizePurchaseOrderNumber(input)).toBe(expected)
      })
    })
  })
})

describe('isSubscriptionPurchaseOrderNumberEditable', () => {
  describe('GIVEN a subscription status', () => {
    describe('WHEN the subscription is pending or active', () => {
      it.each([
        ['pending', StatusTypeEnum.Pending],
        ['active', StatusTypeEnum.Active],
      ])('THEN should return true for %s', (_, status) => {
        expect(isSubscriptionPurchaseOrderNumberEditable(status)).toBe(true)
      })
    })

    describe('WHEN the subscription is in any other state', () => {
      it.each([
        ['terminated', StatusTypeEnum.Terminated],
        ['canceled', StatusTypeEnum.Canceled],
        ['incomplete', StatusTypeEnum.Incomplete],
        ['undefined', undefined],
        ['null', null],
      ])('THEN should return false for %s', (_, status) => {
        expect(isSubscriptionPurchaseOrderNumberEditable(status)).toBe(false)
      })
    })
  })
})
