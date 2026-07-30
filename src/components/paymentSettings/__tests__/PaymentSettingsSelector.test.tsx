import {
  PaymentMethodBehavior,
  SelectedPaymentMethod,
} from '~/components/paymentMethodSelection/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  PAYMENT_SETTINGS_SELECTOR_TEST_ID,
  PaymentSettingsSelector,
  SUMMARY_KEY_BY_BEHAVIOR,
} from '../PaymentSettingsSelector'

const mockSelector: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockDrawer: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockOpenDrawer = jest.fn()

jest.mock('~/components/designSystem/Selector', () => ({
  Selector: (props: Record<string, unknown>) => {
    mockSelector(props)

    return null
  },
}))

jest.mock('~/components/paymentSettings/PaymentSettingsDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  return {
    PaymentSettingsDrawer: forwardRef((props: Record<string, unknown>, ref: unknown): null => {
      mockDrawer(props)
      useImperativeHandle(ref, () => ({ openDrawer: mockOpenDrawer, closeDrawer: jest.fn() }))

      return null
    }),
  }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SPECIFIC_PM: SelectedPaymentMethod = {
  paymentMethodId: 'pm_1',
  paymentMethodType: PaymentMethodTypeEnum.Provider,
}

const MANUAL_PM: SelectedPaymentMethod = {
  paymentMethodId: null,
  paymentMethodType: PaymentMethodTypeEnum.Manual,
}

const renderSelector = (
  overrides: {
    value?: SelectedPaymentMethod
    onChange?: (value: SelectedPaymentMethod) => void
    externalCustomerId?: string
    dataTest?: string
  } = {},
) => {
  const onChange = overrides.onChange ?? jest.fn()

  render(
    <PaymentSettingsSelector
      viewType={ViewTypeEnum.WalletTopUp}
      externalCustomerId={overrides.externalCustomerId ?? 'ext-1'}
      value={overrides.value}
      onChange={onChange}
      data-test={overrides.dataTest}
    />,
  )

  return { onChange }
}

const lastSelectorProps = () =>
  mockSelector.mock.calls.at(-1)?.[0] as {
    subtitle?: string
    onClick?: () => void
    'data-test'?: string
  }

const lastDrawerProps = () =>
  mockDrawer.mock.calls.at(-1)?.[0] as {
    viewType?: ViewTypeEnum
    externalCustomerId?: string
    onSave?: (v: { paymentMethod: SelectedPaymentMethod }) => void
  }

describe('PaymentSettingsSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a payment method value', () => {
    describe('WHEN summarising the selected behaviour', () => {
      it.each([
        ['fallback (customer default)', undefined, PaymentMethodBehavior.FALLBACK],
        ['a specific payment method', SPECIFIC_PM, PaymentMethodBehavior.SPECIFIC],
        ['the manual behaviour', MANUAL_PM, PaymentMethodBehavior.MANUAL],
      ])('THEN should show the %s summary', (_, value, behavior) => {
        renderSelector({ value: value as SelectedPaymentMethod })

        expect(lastSelectorProps().subtitle).toBe(SUMMARY_KEY_BY_BEHAVIOR[behavior])
      })
    })
  })

  describe('GIVEN the selector is mounted', () => {
    describe('WHEN the drawer receives its props', () => {
      it('THEN should forward the viewType', () => {
        renderSelector()

        expect(lastDrawerProps().viewType).toBe(ViewTypeEnum.WalletTopUp)
      })

      it('THEN should forward the external customer id', () => {
        renderSelector({ externalCustomerId: 'ext-42' })

        expect(lastDrawerProps().externalCustomerId).toBe('ext-42')
      })
    })
  })

  describe('GIVEN the selector card is clicked', () => {
    describe('WHEN the onClick handler fires', () => {
      it('THEN should open the drawer seeded with the current value', () => {
        renderSelector({ value: SPECIFIC_PM })

        lastSelectorProps().onClick?.()

        expect(mockOpenDrawer).toHaveBeenCalledWith({ paymentMethod: SPECIFIC_PM })
      })
    })
  })

  describe('GIVEN the drawer commits a new value', () => {
    describe('WHEN onSave fires', () => {
      it('THEN should propagate the payment method through onChange', () => {
        const { onChange } = renderSelector()

        lastDrawerProps().onSave?.({ paymentMethod: SPECIFIC_PM })

        expect(onChange).toHaveBeenCalledWith(SPECIFIC_PM)
      })
    })
  })

  describe('GIVEN the data-test prop', () => {
    describe('WHEN not provided', () => {
      it('THEN should fall back to the default test id', () => {
        renderSelector()

        expect(lastSelectorProps()['data-test']).toBe(PAYMENT_SETTINGS_SELECTOR_TEST_ID)
      })
    })

    describe('WHEN provided', () => {
      it('THEN should forward the custom test id', () => {
        renderSelector({ dataTest: 'rule-payment-settings-selector' })

        expect(lastSelectorProps()['data-test']).toBe('rule-payment-settings-selector')
      })
    })
  })
})
