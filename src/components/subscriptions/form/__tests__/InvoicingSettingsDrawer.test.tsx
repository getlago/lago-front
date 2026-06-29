import { act, createRef } from 'react'

import { render } from '~/test-utils'

import { ViewTypeEnum } from '../../../paymentMethodsInvoiceSettings/types'
import { InvoicingSettingsDrawer, InvoicingSettingsDrawerRef } from '../InvoicingSettingsDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

jest.mock('~/components/subscriptions/SubscriptionInvoiceConsolidationSection', () => ({
  SubscriptionInvoiceConsolidationSection: () => <div data-test="consolidation" />,
}))

jest.mock('~/components/invoceCustomFooter/InvoiceCustomSectionFields', () => ({
  InvoiceCustomSectionFields: () => <div data-test="ics-fields" />,
}))

describe('InvoicingSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderDrawer = (onSave = jest.fn()) => {
    const ref = createRef<InvoicingSettingsDrawerRef>()

    render(
      <InvoicingSettingsDrawer
        ref={ref}
        viewType={ViewTypeEnum.Subscription}
        customerId="cust_1"
        showCustomSection
        onSave={onSave}
      />,
    )

    return { ref, onSave }
  }

  it('renders nothing until opened', () => {
    const { container } = render(
      <InvoicingSettingsDrawer
        viewType={ViewTypeEnum.Subscription}
        customerId="cust_1"
        showCustomSection
        onSave={jest.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('opens the drawer with the Invoicing settings title', () => {
    const { ref } = renderDrawer()

    act(() => {
      ref.current?.openDrawer({
        consolidateInvoice: true,
        invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
      })
    })

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'text_17423672025282dl7iozy1ru' }),
    )
  })

  it('commits the seeded draft through onSave on submit, then closes', async () => {
    const { ref, onSave } = renderDrawer()

    const seeded = {
      consolidateInvoice: false,
      invoiceCustomSection: {
        invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      },
    }

    act(() => {
      ref.current?.openDrawer(seeded)
    })

    const { form } = mockOpen.mock.calls[0][0] as { form: { submit: () => Promise<void> } }

    await act(async () => {
      await form.submit()
    })

    expect(onSave).toHaveBeenCalledWith(seeded)
    expect(mockClose).toHaveBeenCalled()
  })
})
