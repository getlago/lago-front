import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { render } from '~/test-utils'

import {
  INVOICING_SETTINGS_SELECTOR_TEST_ID,
  INVOICING_SUMMARY_KEYS,
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

jest.mock('~/components/invoicingSettings/InvoicingSettingsDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  return {
    InvoicingSettingsDrawer: forwardRef((props: Record<string, unknown>, ref: unknown): null => {
      mockDrawer(props)
      useImperativeHandle(ref, () => ({ openDrawer: mockOpenDrawer, closeDrawer: jest.fn() }))

      return null
    }),
  }
})

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

const renderSelector = (
  overrides: {
    value?: InvoiceCustomSectionInput
    onChange?: (value: InvoiceCustomSectionInput) => void
    customerId?: string | undefined
    dataTest?: string
  } = {},
) => {
  const onChange = overrides.onChange ?? jest.fn()

  render(
    <InvoicingSettingsSelector
      viewType={ViewTypeEnum.WalletTopUp}
      customerId={'customerId' in overrides ? overrides.customerId : 'cust-1'}
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
    customerId?: string
    showCustomSection?: boolean
    onSave?: (v: { invoiceCustomSection: InvoiceCustomSectionInput }) => void
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
        ['none (default)', undefined, INVOICING_SUMMARY_KEYS.none],
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

        lastDrawerProps().onSave?.({ invoiceCustomSection: APPLY_VALUE })

        expect(onChange).toHaveBeenCalledWith(APPLY_VALUE)
      })
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
