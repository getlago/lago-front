import { PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { PAYMENT_TERM_VALUE_KEYS } from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { InvoicingSettingsSection } from '../InvoicingSettingsSection'

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

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: jest.fn(() => ({})),
  useStore: (store: { state: unknown }, selector: (state: unknown) => unknown) =>
    selector(store.state),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: jest.fn(),
  withForm: jest.fn(
    ({
      render: RenderComponent,
      props: defaultProps,
    }: {
      render: React.FC<Record<string, unknown>>
      defaultValues: Record<string, unknown>
      props: Record<string, unknown>
    }) => {
      const WithFormWrapper = (receivedProps: Record<string, unknown>) => (
        <RenderComponent {...defaultProps} {...receivedProps} />
      )

      WithFormWrapper.displayName = 'WithFormWrapper'

      return WithFormWrapper
    },
  ),
}))

const INHERIT_LABEL_KEY = 'inherit_key'
const INHERITED_FROM: PaymentTermInheritedFrom = {
  term: { termType: PaymentTermTypeEnum.EndOfMonth },
  labelKey: INHERIT_LABEL_KEY,
}

const renderSection = (
  values: { consolidateInvoice?: boolean; invoiceCustomSection?: unknown; paymentTerm?: unknown },
  customerId?: string,
  paymentTermInheritedFrom?: PaymentTermInheritedFrom,
) => {
  const state = { values }
  const form = { setFieldValue: jest.fn(), state, store: { state } }

  render(
    <InvoicingSettingsSection
      // @ts-expect-error - mock form shape
      form={form}
      customerId={customerId}
      paymentTermInheritedFrom={paymentTermInheritedFrom}
    />,
  )

  return { form }
}

const lastSubtitle = () =>
  (mockSelector.mock.calls.at(-1)?.[0] as { subtitle?: string } | undefined)?.subtitle

describe('InvoicingSettingsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('summarises consolidation + customer-default custom sections', () => {
    renderSection(
      {
        consolidateInvoice: true,
        invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
      },
      'cust-1',
    )

    expect(lastSubtitle()).toBe('text_1778745351091h7z5baw0ta6 • text_1782738644347svkr94bf4aw')
  })

  it('summarises isolate + specific custom sections', () => {
    renderSection(
      {
        consolidateInvoice: false,
        invoiceCustomSection: {
          invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
          skipInvoiceCustomSections: false,
        },
      },
      'cust-1',
    )

    expect(lastSubtitle()).toBe('text_1778745351091fxaqr5dwok8 • text_1782738644347qh5s13lol1p')
  })

  it('summarises the skip behaviour for custom sections', () => {
    renderSection(
      {
        consolidateInvoice: true,
        invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: true },
      },
      'cust-1',
    )

    expect(lastSubtitle()).toBe('text_1778745351091h7z5baw0ta6 • text_1782738644347z3azl4u1f15')
  })

  it('omits the custom-section part when the customer has no id', () => {
    renderSection({ consolidateInvoice: true })

    expect(lastSubtitle()).toBe('text_1778745351091h7z5baw0ta6')
    expect(mockDrawer).toHaveBeenCalledWith(expect.objectContaining({ showCustomSection: false }))
  })

  it('wires the drawer onSave back to the form fields', () => {
    const { form } = renderSection({ consolidateInvoice: true }, 'cust-1')

    const { onSave } = mockDrawer.mock.calls.at(-1)?.[0] as {
      onSave: (v: {
        consolidateInvoice: boolean
        invoiceCustomSection: unknown
        paymentTerm: unknown
      }) => void
    }

    const nextIcs = { invoiceCustomSections: [], skipInvoiceCustomSections: true }
    const nextPaymentTerm = paymentTermFormValuesFromTerm(
      { termType: PaymentTermTypeEnum.Net, days: 60 },
      true,
    )

    onSave({
      consolidateInvoice: false,
      invoiceCustomSection: nextIcs,
      paymentTerm: nextPaymentTerm,
    })

    expect(form.setFieldValue).toHaveBeenCalledWith('consolidateInvoice', false)
    expect(form.setFieldValue).toHaveBeenCalledWith('invoiceCustomSection', nextIcs)
    expect(form.setFieldValue).toHaveBeenCalledWith('paymentTerm', nextPaymentTerm)
  })

  it('seeds the drawer with the current form values on click', () => {
    const invoiceCustomSection = { invoiceCustomSections: [], skipInvoiceCustomSections: true }
    const paymentTerm = paymentTermFormValuesFromTerm(null, true)

    renderSection({ consolidateInvoice: false, invoiceCustomSection, paymentTerm }, 'cust-1')

    const { onClick } = mockSelector.mock.calls.at(-1)?.[0] as { onClick: () => void }

    onClick()

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      consolidateInvoice: false,
      invoiceCustomSection,
      paymentTerm,
    })
  })

  describe('GIVEN the subscription can inherit a payment term', () => {
    it('passes the inherited term on to the drawer', () => {
      renderSection({ consolidateInvoice: true }, 'cust-1', INHERITED_FROM)

      expect(mockDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ paymentTermInheritedFrom: INHERITED_FROM }),
      )
    })

    it('summarises the inherited term marked with its level', () => {
      renderSection(
        { consolidateInvoice: true, paymentTerm: paymentTermFormValuesFromTerm(null, true) },
        undefined,
        INHERITED_FROM,
      )

      expect(lastSubtitle()).toBe(`text_1778745351091h7z5baw0ta6 • ${INHERIT_LABEL_KEY}`)
    })

    it('summarises the chosen term', () => {
      renderSection(
        {
          consolidateInvoice: true,
          paymentTerm: paymentTermFormValuesFromTerm(
            { termType: PaymentTermTypeEnum.Net, days: 60 },
            true,
          ),
        },
        undefined,
        INHERITED_FROM,
      )

      expect(lastSubtitle()).toBe(
        `text_1778745351091h7z5baw0ta6 • ${PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net]}`,
      )
    })
  })

  it('defaults the seeded consolidation to true when the form has no value yet', () => {
    renderSection({})

    const { onClick } = mockSelector.mock.calls.at(-1)?.[0] as { onClick: () => void }

    onClick()

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ consolidateInvoice: true }),
    )
  })
})
