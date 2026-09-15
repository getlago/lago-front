import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
} from '~/generated/graphql'

import { findPaymentRouting, toSelectedConnection } from '../fromConnectionRouting'

const routing = (
  category: ConnectionCategoryEnum,
  behavior: ConnectionResolvedBehaviorEnum,
  code?: string | null,
) => ({ category, behavior, code })

describe('fromConnectionRouting', () => {
  describe('GIVEN a routing list covering every category', () => {
    describe('WHEN the payment one is looked up', () => {
      it('THEN should return it regardless of its position', () => {
        const rows = [
          routing(ConnectionCategoryEnum.Tax, ConnectionResolvedBehaviorEnum.Inherit, 'anrok_eu'),
          routing(
            ConnectionCategoryEnum.Payment,
            ConnectionResolvedBehaviorEnum.Specific,
            'stripe_eu',
          ),
        ]

        expect(findPaymentRouting(rows)?.code).toBe('stripe_eu')
      })
    })
  })

  describe('GIVEN a routing the object chose for itself', () => {
    describe('WHEN it is mapped to the form', () => {
      it('THEN should carry the code, so the drawer reopens on that connection', () => {
        expect(
          toSelectedConnection(
            routing(
              ConnectionCategoryEnum.Payment,
              ConnectionResolvedBehaviorEnum.Specific,
              'stripe_eu',
            ),
          ),
        ).toEqual({ code: 'stripe_eu' })
      })
    })
  })

  describe('GIVEN a skipped category', () => {
    describe('WHEN it is mapped to the form', () => {
      it('THEN should carry the skip behavior', () => {
        expect(
          toSelectedConnection(
            routing(ConnectionCategoryEnum.Payment, ConnectionResolvedBehaviorEnum.Skip, null),
          ),
        ).toEqual({ behavior: ConnectionBehaviorEnum.Skip })
      })
    })
  })

  describe('GIVEN a category the object inherits', () => {
    describe('WHEN it is mapped to the form', () => {
      // `inherit` reports the customer default's code. Carrying it would turn an inherited routing
      // into an explicit override on the next save, and the override would survive the default
      // changing.
      it('THEN should drop the resolved code and leave the field untouched', () => {
        expect(
          toSelectedConnection(
            routing(
              ConnectionCategoryEnum.Payment,
              ConnectionResolvedBehaviorEnum.Inherit,
              'stripe_eu',
            ),
          ),
        ).toBeUndefined()
      })
    })
  })

  describe('GIVEN an object with no routing at all', () => {
    describe('WHEN it is mapped to the form', () => {
      it('THEN should leave the field untouched', () => {
        expect(toSelectedConnection(findPaymentRouting(undefined))).toBeUndefined()
      })
    })
  })
})
