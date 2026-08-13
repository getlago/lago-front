import { ApolloError } from '@apollo/client'

import {
  ADDONS_ERROR_CONFIG,
  COUPONS_ERROR_CONFIG,
  mapBillingItemErrors,
} from '../mapBillingItemErrors'

const makeError = (details: Record<string, string[]>): ApolloError =>
  new ApolloError({
    graphQLErrors: [
      {
        message: 'Unprocessable Entity',
        extensions: { code: 'unprocessable_entity', details },
      } as never,
    ],
  })

describe('mapBillingItemErrors', () => {
  it('maps an indexed add-on field key to the array field path', () => {
    const error = makeError({ 'billingItems.add_ons.0.unitAmountCents': ['value_is_invalid'] })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([
      { path: 'addOnItems[0].unitAmountCents', code: 'value_is_invalid' },
    ])
    expect(result.unmapped).toEqual([])
  })

  it('resolves a field nested under the `overrides` wrapper', () => {
    const error = makeError({
      'billingItems.addOns.0.overrides.unitAmountCents': ['invalid_value'],
    })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([
      { path: 'addOnItems[0].unitAmountCents', code: 'invalid_value' },
    ])
    expect(result.unmapped).toEqual([])
  })

  it('routes the derived `totalAmountCents` error onto the unit-amount field', () => {
    const error = makeError({
      'billingItems.addOns.0.overrides.totalAmountCents': ['invalid_value'],
    })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([
      { path: 'addOnItems[0].unitAmountCents', code: 'invalid_value' },
    ])
    expect(result.unmapped).toEqual([])
  })

  it('tolerates the snake/camel category variance (addons vs add_ons)', () => {
    const error = makeError({ 'billing_items.addons.1.units': ['value_is_invalid'] })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([{ path: 'addOnItems[1].units', code: 'value_is_invalid' }])
  })

  it('maps a flat coupon field key without an index', () => {
    const error = makeError({ 'billingItems.coupons.0.amountCents': ['value_is_invalid'] })

    const result = mapBillingItemErrors(error, COUPONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([{ path: 'amount', code: 'value_is_invalid' }])
  })

  it('reports a coarse category key as unmapped', () => {
    const error = makeError({ 'billingItems.addons': ['unsupported_key'] })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([])
    expect(result.unmapped).toEqual(['billingItems.addons'])
  })

  it('reports an unknown field as unmapped', () => {
    const error = makeError({ 'billingItems.add_ons.0.mystery': ['value_is_invalid'] })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result.fieldErrors).toEqual([])
    expect(result.unmapped).toEqual(['billingItems.add_ons.0.mystery'])
  })

  it('returns empty results when there are no details (non-422 / network error)', () => {
    const error = new ApolloError({ errorMessage: 'Network error' })

    const result = mapBillingItemErrors(error, ADDONS_ERROR_CONFIG)

    expect(result).toEqual({ fieldErrors: [], unmapped: [] })
  })
})
