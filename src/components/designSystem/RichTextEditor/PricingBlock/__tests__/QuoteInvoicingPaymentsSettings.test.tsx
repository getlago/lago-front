import { configure, render, screen } from '@testing-library/react'

import type { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import type { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'

import { QuoteInvoicingPaymentsSettings } from '../QuoteInvoicingPaymentsSettings'

// The mocked selectors below use `data-test` (the codebase's convention),
// but `getByTestId` defaults to `data-testid` unless configured — matches
// the pattern in PaginatedContent.test.tsx.
configure({ testIdAttribute: 'data-test' })

// Capture the props the shared selectors receive so we can assert the bridge.
let paymentSelectorProps: {
  value: SelectedPaymentMethod
  onChange: (v: SelectedPaymentMethod) => void
  viewType: ViewTypeEnum
  externalCustomerId: string
} | null = null
let invoicingSelectorProps: {
  value: InvoiceCustomSectionInput | undefined
  onChange: (v: InvoiceCustomSectionInput) => void
  viewType: ViewTypeEnum
  customerId: string
} | null = null

jest.mock('~/components/paymentSettings/PaymentSettingsSelector', () => ({
  PaymentSettingsSelector: (props: {
    value: SelectedPaymentMethod
    onChange: (v: SelectedPaymentMethod) => void
    viewType: ViewTypeEnum
    externalCustomerId: string
  }) => {
    paymentSelectorProps = {
      value: props.value,
      onChange: props.onChange,
      viewType: props.viewType,
      externalCustomerId: props.externalCustomerId,
    }

    return <div data-test="payment-settings-selector" />
  },
}))

jest.mock('~/components/invoicingSettings/InvoicingSettingsSelector', () => ({
  InvoicingSettingsSelector: (props: {
    value: InvoiceCustomSectionInput | undefined
    onChange: (v: InvoiceCustomSectionInput) => void
    viewType: ViewTypeEnum
    customerId: string
  }) => {
    invoicingSelectorProps = {
      value: props.value,
      onChange: props.onChange,
      viewType: props.viewType,
      customerId: props.customerId,
    }

    return <div data-test="invoicing-settings-selector" />
  },
}))

const customer = { id: 'cust-1', externalId: 'ext-1', name: 'Acme' }

const section: InvoiceCustomSectionInput = {
  invoiceCustomSections: [{ id: 'sec-1', name: 'Bank details' }],
  skipInvoiceCustomSections: false,
}

describe('QuoteInvoicingPaymentsSettings', () => {
  beforeEach(() => {
    paymentSelectorProps = null
    invoicingSelectorProps = null
  })

  it('renders both selector cards', () => {
    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: '', invoiceCustomFooter: '' }}
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByTestId('payment-settings-selector')).toBeInTheDocument()
    expect(screen.getByTestId('invoicing-settings-selector')).toBeInTheDocument()
  })

  it('maps flat state IN to rich selector values', () => {
    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: 'pm-9', invoiceCustomFooter: JSON.stringify(section) }}
        onChange={jest.fn()}
      />,
    )

    expect(paymentSelectorProps?.value).toEqual({ paymentMethodId: 'pm-9' })
    expect(invoicingSelectorProps?.value).toEqual(section)
  })

  it('maps empty flat state to null/undefined rich values', () => {
    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: '', invoiceCustomFooter: '' }}
        onChange={jest.fn()}
      />,
    )

    expect(paymentSelectorProps?.value).toBeNull()
    expect(invoicingSelectorProps?.value).toBeUndefined()
  })

  it('maps payment selector change OUT to flat paymentMethodId, preserving the other field', () => {
    const onChange = jest.fn()

    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: '', invoiceCustomFooter: JSON.stringify(section) }}
        onChange={onChange}
      />,
    )

    paymentSelectorProps?.onChange({ paymentMethodId: 'pm-42' })

    expect(onChange).toHaveBeenCalledWith({
      paymentMethodId: 'pm-42',
      invoiceCustomFooter: JSON.stringify(section),
    })
  })

  it('maps a null payment change OUT to empty string', () => {
    const onChange = jest.fn()

    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: 'pm-9', invoiceCustomFooter: '' }}
        onChange={onChange}
      />,
    )

    paymentSelectorProps?.onChange(null)

    expect(onChange).toHaveBeenCalledWith({ paymentMethodId: '', invoiceCustomFooter: '' })
  })

  it('passes customerId/externalCustomerId and viewType to the respective selectors', () => {
    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: '', invoiceCustomFooter: '' }}
        onChange={jest.fn()}
      />,
    )

    expect(invoicingSelectorProps?.customerId).toBe('cust-1')
    expect(invoicingSelectorProps?.viewType).toBe(ViewTypeEnum.Subscription)
    expect(paymentSelectorProps?.externalCustomerId).toBe('ext-1')
    expect(paymentSelectorProps?.viewType).toBe(ViewTypeEnum.Subscription)
  })

  it('maps a malformed invoiceCustomFooter to undefined without throwing', () => {
    expect(() =>
      render(
        <QuoteInvoicingPaymentsSettings
          customer={customer}
          value={{ paymentMethodId: '', invoiceCustomFooter: '{bad' }}
          onChange={jest.fn()}
        />,
      ),
    ).not.toThrow()

    expect(invoicingSelectorProps?.value).toBeUndefined()
  })

  it('maps invoicing selector change OUT to JSON string, preserving the other field', () => {
    const onChange = jest.fn()

    render(
      <QuoteInvoicingPaymentsSettings
        customer={customer}
        value={{ paymentMethodId: 'pm-9', invoiceCustomFooter: '' }}
        onChange={onChange}
      />,
    )

    invoicingSelectorProps?.onChange(section)

    expect(onChange).toHaveBeenCalledWith({
      paymentMethodId: 'pm-9',
      invoiceCustomFooter: JSON.stringify(section),
    })
  })
})
