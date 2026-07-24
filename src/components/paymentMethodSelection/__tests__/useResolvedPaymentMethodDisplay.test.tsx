import { renderHook } from '@testing-library/react'

import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { createMockPaymentMethod } from '~/hooks/customer/__tests__/factories/PaymentMethod.factory'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import {
  useResolvedPaymentMethodDisplay,
  useResolvedPaymentMethodValue,
} from '../useResolvedPaymentMethodDisplay'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-15' }),
  }),
}))

// Translation keys reused for assertions (same literals the hook renders)
const MANUAL_PAYMENT_TRANSLATION_KEY = 'text_173799550683709p2rqkoqd5'
const ADDED_ON_DATE_TRANSLATION_KEY = 'text_1771854080250kv3j6oa9nxj'

// What formatPaymentMethodDetails produces for the factory's default details
const CARD_DETAILS_DISPLAY = 'Card - Visa •••• 4242'

const INHERITED_SUFFIX = ' (text_1764327933607jgtpungo2pp)'

describe('useResolvedPaymentMethodDisplay', () => {
  describe('GIVEN an explicitly manual payment method', () => {
    describe('WHEN resolving the display value', () => {
      it('THEN returns the manual label without the inherited suffix', () => {
        const paymentMethods: PaymentMethodList = [
          createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
        ]

        const { result } = renderHook(() =>
          useResolvedPaymentMethodValue(
            { paymentMethodType: PaymentMethodTypeEnum.Manual },
            paymentMethods,
          ),
        )

        expect(result.current).toBe(MANUAL_PAYMENT_TRANSLATION_KEY)
      })
    })
  })

  describe('GIVEN a specific payment method id present in the list', () => {
    describe('WHEN resolving the display value', () => {
      it('THEN returns the formatted card details without the inherited suffix', () => {
        const paymentMethods: PaymentMethodList = [
          createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
          createMockPaymentMethod({ id: 'pm_specific', isDefault: false }),
        ]

        const { result } = renderHook(() =>
          useResolvedPaymentMethodValue(
            {
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethodId: 'pm_specific',
            },
            paymentMethods,
          ),
        )

        expect(result.current).toBe(CARD_DETAILS_DISPLAY)
      })
    })

    describe('WHEN the resolved payment method has empty details', () => {
      it('THEN falls back to the added-on-date label', () => {
        const paymentMethods: PaymentMethodList = [
          createMockPaymentMethod({
            id: 'pm_specific',
            details: {
              __typename: 'PaymentMethodDetails',
              brand: null,
              last4: null,
              type: null,
              expirationMonth: null,
              expirationYear: null,
            },
          }),
        ]

        const { result } = renderHook(() =>
          useResolvedPaymentMethodValue(
            {
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethodId: 'pm_specific',
            },
            paymentMethods,
          ),
        )

        expect(result.current).toBe(ADDED_ON_DATE_TRANSLATION_KEY)
      })
    })
  })

  describe('GIVEN no explicit payment method selection', () => {
    describe('WHEN the customer has a default payment method', () => {
      it('THEN returns the default card details with the inherited suffix', () => {
        const paymentMethods: PaymentMethodList = [
          createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
        ]

        const { result } = renderHook(() => useResolvedPaymentMethodValue(null, paymentMethods))

        expect(result.current).toBe(`${CARD_DETAILS_DISPLAY}${INHERITED_SUFFIX}`)
      })
    })

    describe('WHEN the customer has no payment methods at all', () => {
      it('THEN returns the manual label with the inherited suffix', () => {
        const { result } = renderHook(() => useResolvedPaymentMethodValue(null, []))

        expect(result.current).toBe(`${MANUAL_PAYMENT_TRANSLATION_KEY}${INHERITED_SUFFIX}`)
      })
    })
  })

  describe('GIVEN a payment method id that no longer exists in the list', () => {
    describe('WHEN a default payment method is available', () => {
      it('THEN falls back to the inherited default', () => {
        const paymentMethods: PaymentMethodList = [
          createMockPaymentMethod({ id: 'pm_default', isDefault: true }),
        ]

        const { result } = renderHook(() =>
          useResolvedPaymentMethodValue(
            {
              paymentMethodType: PaymentMethodTypeEnum.Provider,
              paymentMethodId: 'pm_deleted',
            },
            paymentMethods,
          ),
        )

        expect(result.current).toBe(`${CARD_DETAILS_DISPLAY}${INHERITED_SUFFIX}`)
      })
    })
  })
})

describe('useResolvedPaymentMethodDisplay', () => {
  describe('GIVEN a specific payment method resolved from the list', () => {
    it('THEN exposes the structured parts without the inherited suffix', () => {
      const paymentMethods: PaymentMethodList = [
        createMockPaymentMethod({ id: 'pm_specific', isDefault: false }),
      ]

      const { result } = renderHook(() =>
        useResolvedPaymentMethodDisplay(
          {
            paymentMethodType: PaymentMethodTypeEnum.Provider,
            paymentMethodId: 'pm_specific',
          },
          paymentMethods,
        ),
      )

      expect(result.current).toEqual({
        isManual: false,
        isInherited: false,
        label: CARD_DETAILS_DISPLAY,
        inheritedSuffix: '',
        value: CARD_DETAILS_DISPLAY,
      })
    })
  })

  describe('GIVEN no payment methods at all', () => {
    it('THEN exposes the manual inherited parts and the concatenated value', () => {
      const { result } = renderHook(() => useResolvedPaymentMethodDisplay(null, []))

      expect(result.current).toEqual({
        isManual: true,
        isInherited: true,
        label: MANUAL_PAYMENT_TRANSLATION_KEY,
        inheritedSuffix: INHERITED_SUFFIX,
        value: `${MANUAL_PAYMENT_TRANSLATION_KEY}${INHERITED_SUFFIX}`,
      })
    })
  })
})
