import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentTermFormValues } from '~/components/paymentTerms/types'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { PAYMENT_TERM_VALUE_KEYS } from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  INVOICING_SETTINGS_SELECTOR_TEST_ID,
  INVOICING_SUMMARY_KEYS,
  InvoicingSettingsPaymentTermProps,
  InvoicingSettingsSelector,
} from '../InvoicingSettingsSelector'

const mockSelector: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockDrawer: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockOpenDrawer = jest.fn()

jest.mock('~/components/designSystem/Selector', () => ({
  Selector: (props: Record<string, unknown>) => {
    mockSelector(props)

    return null
  },
}))

jest.mock('~/components/invoicingSettings/useInvoicingSettingsDrawer', () => ({
  useInvoicingSettingsDrawer: (props: Record<string, unknown>) => {
    mockDrawer(props)

    return { openDrawer: mockOpenDrawer }
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const SKIP_VALUE: InvoiceCustomSectionInput = {
  invoiceCustomSections: [],
  skipInvoiceCustomSections: true,
}

const APPLY_VALUE: InvoiceCustomSectionInput = {
  invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
  skipInvoiceCustomSections: false,
}

const INHERIT_LABEL_KEY = 'inherit_key'
const INHERITED_FROM = {
  term: { termType: PaymentTermTypeEnum.EndOfMonth },
  labelKey: INHERIT_LABEL_KEY,
}
const NET_60_VALUES = paymentTermFormValuesFromTerm(
  { termType: PaymentTermTypeEnum.Net, days: 60 },
  true,
)

const renderSelector = (
  overrides: {
    value?: InvoiceCustomSectionInput
    onChange?: (value: InvoiceCustomSectionInput) => void
    customerId?: string | undefined
    dataTest?: string
    paymentTerm?: InvoicingSettingsPaymentTermProps
  } = {},
) => {
  const onChange = overrides.onChange ?? jest.fn()

  render(
    <InvoicingSettingsSelector
      viewType={ViewTypeEnum.WalletTopUp}
      customerId={'customerId' in overrides ? overrides.customerId : 'cust-1'}
      value={overrides.value}
      onChange={onChange}
      paymentTerm={overrides.paymentTerm}
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
    customerId?: string
    showCustomSection?: boolean
    paymentTermInheritedFrom?: InvoicingSettingsPaymentTermProps['inheritedFrom']
    onSave?: (v: {
      invoiceCustomSection: InvoiceCustomSectionInput
      paymentTerm: PaymentTermFormValues
    }) => void
  }

describe('InvoicingSettingsSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN an invoice custom section value', () => {
    describe('WHEN summarising the selection', () => {
      it.each([
        ['skip', SKIP_VALUE, INVOICING_SUMMARY_KEYS.skip],
        ['apply', APPLY_VALUE, INVOICING_SUMMARY_KEYS.apply],
        ['fallback (default)', undefined, INVOICING_SUMMARY_KEYS.fallback],
      ])('THEN should show the %s summary', (_, value, expectedKey) => {
        renderSelector({ value: value as InvoiceCustomSectionInput })

        expect(lastSelectorProps().subtitle).toBe(expectedKey)
      })
    })
  })

  describe('GIVEN the drawer receives its props', () => {
    describe('WHEN a customer id is provided', () => {
      it('THEN should forward the customer id and enable the custom section', () => {
        renderSelector({ customerId: 'cust-9' })

        expect(lastDrawerProps().customerId).toBe('cust-9')
        expect(lastDrawerProps().showCustomSection).toBe(true)
      })
    })

    describe('WHEN no customer id is provided', () => {
      it('THEN should disable the custom section', () => {
        renderSelector({ customerId: undefined })

        expect(lastDrawerProps().showCustomSection).toBe(false)
      })
    })

    describe('WHEN mounted', () => {
      it('THEN should forward the viewType', () => {
        renderSelector()

        expect(lastDrawerProps().viewType).toBe(ViewTypeEnum.WalletTopUp)
      })
    })
  })

  describe('GIVEN the selector card is clicked', () => {
    describe('WHEN the onClick handler fires', () => {
      it('THEN should open the drawer seeded with the current value', () => {
        renderSelector({ value: APPLY_VALUE })

        lastSelectorProps().onClick?.()

        expect(mockOpenDrawer).toHaveBeenCalledWith({ invoiceCustomSection: APPLY_VALUE })
      })
    })
  })

  describe('GIVEN the drawer commits a new value', () => {
    describe('WHEN onSave fires', () => {
      it('THEN should propagate the invoice custom section through onChange', () => {
        const { onChange } = renderSelector()

        lastDrawerProps().onSave?.({
          invoiceCustomSection: APPLY_VALUE,
          paymentTerm: NET_60_VALUES,
        })

        expect(onChange).toHaveBeenCalledWith(APPLY_VALUE)
      })
    })
  })

  describe('GIVEN the object carries a payment term override', () => {
    const inheritValues = paymentTermFormValuesFromTerm(null, true)

    describe('WHEN summarising the selection', () => {
      it('THEN should append the inherited term marked with its level', () => {
        renderSelector({
          paymentTerm: { value: inheritValues, onChange: jest.fn(), inheritedFrom: INHERITED_FROM },
        })

        expect(lastSelectorProps().subtitle).toBe(
          `${INVOICING_SUMMARY_KEYS.fallback} • ${INHERIT_LABEL_KEY}`,
        )
      })

      it('THEN should append the chosen term', () => {
        renderSelector({
          paymentTerm: { value: NET_60_VALUES, onChange: jest.fn(), inheritedFrom: INHERITED_FROM },
        })

        expect(lastSelectorProps().subtitle).toBe(
          `${INVOICING_SUMMARY_KEYS.fallback} • ${PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net]}`,
        )
      })
    })

    describe('WHEN the drawer is wired', () => {
      it('THEN should enable its payment term section with the inherited term', () => {
        renderSelector({
          paymentTerm: { value: inheritValues, onChange: jest.fn(), inheritedFrom: INHERITED_FROM },
        })

        expect(lastDrawerProps().paymentTermInheritedFrom).toEqual(INHERITED_FROM)
      })

      it('THEN should seed the drawer with the current term and propagate the saved one', () => {
        const onPaymentTermChange = jest.fn()

        renderSelector({
          value: APPLY_VALUE,
          paymentTerm: {
            value: inheritValues,
            onChange: onPaymentTermChange,
            inheritedFrom: INHERITED_FROM,
          },
        })

        lastSelectorProps().onClick?.()
        lastDrawerProps().onSave?.({
          invoiceCustomSection: APPLY_VALUE,
          paymentTerm: NET_60_VALUES,
        })

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          invoiceCustomSection: APPLY_VALUE,
          paymentTerm: inheritValues,
        })
        expect(onPaymentTermChange).toHaveBeenCalledWith(NET_60_VALUES)
      })
    })
  })

  describe('GIVEN the object carries no payment term override', () => {
    it('THEN should leave the drawer payment term section off', () => {
      renderSelector()

      expect(lastDrawerProps().paymentTermInheritedFrom).toBeUndefined()
      expect(lastSelectorProps().subtitle).toBe(INVOICING_SUMMARY_KEYS.fallback)
    })
  })

  describe('GIVEN the data-test prop', () => {
    describe('WHEN not provided', () => {
      it('THEN should fall back to the default test id', () => {
        renderSelector()

        expect(lastSelectorProps()['data-test']).toBe(INVOICING_SETTINGS_SELECTOR_TEST_ID)
      })
    })

    describe('WHEN provided', () => {
      it('THEN should forward the custom test id', () => {
        renderSelector({ dataTest: 'rule-invoicing-settings-selector' })

        expect(lastSelectorProps()['data-test']).toBe('rule-invoicing-settings-selector')
      })
    })
  })
})
