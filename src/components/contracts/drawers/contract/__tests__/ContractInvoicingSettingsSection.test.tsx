import { act } from '@testing-library/react'

import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { render } from '~/test-utils'

import {
  CONTRACT_INVOICING_SETTINGS_TEST_ID,
  ContractInvoicingSettingsSection,
} from '../ContractInvoicingSettingsSection'

const mockSelector = jest.fn()
const mockDrawer = jest.fn()
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

const emptyInvoiceCustomSection = { invoiceCustomSections: [], skipInvoiceCustomSections: false }

describe('ContractInvoicingSettingsSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('opens the contract drawer with the current consolidation value, custom section hidden without a customer', () => {
    render(
      <ContractInvoicingSettingsSection
        consolidateInvoice={false}
        invoiceCustomSection={emptyInvoiceCustomSection}
        onChange={jest.fn()}
        onInvoiceCustomSectionChange={jest.fn()}
      />,
    )

    const selectorProps = mockSelector.mock.calls.at(-1)?.[0]
    const drawerProps = mockDrawer.mock.calls.at(-1)?.[0]

    expect(selectorProps['data-test']).toBe(CONTRACT_INVOICING_SETTINGS_TEST_ID)
    expect(selectorProps.subtitle).toBe('text_1778745351091fxaqr5dwok8')
    expect(drawerProps.viewType).toBe(ViewTypeEnum.Contract)
    expect(drawerProps.customerId).toBeUndefined()
    expect(drawerProps.showCustomSection).toBe(false)
    expect(drawerProps.withInvoiceConsolidation).toBe(true)

    act(() => selectorProps.onClick())
    expect(mockOpenDrawer).toHaveBeenCalledWith({
      consolidateInvoice: false,
      invoiceCustomSection: emptyInvoiceCustomSection,
    })
  })

  it('shows the custom section once a customer is selected', () => {
    render(
      <ContractInvoicingSettingsSection
        consolidateInvoice
        invoiceCustomSection={{
          invoiceCustomSections: [{ id: 'section-1', name: 'Bank details' }],
          skipInvoiceCustomSections: false,
        }}
        customerId="customer-1"
        onChange={jest.fn()}
        onInvoiceCustomSectionChange={jest.fn()}
      />,
    )

    const selectorProps = mockSelector.mock.calls.at(-1)?.[0]
    const drawerProps = mockDrawer.mock.calls.at(-1)?.[0]

    expect(selectorProps.subtitle).toBe(
      'text_1778745351091h7z5baw0ta6 • text_1782738644347qh5s13lol1p',
    )
    expect(drawerProps.customerId).toBe('customer-1')
    expect(drawerProps.showCustomSection).toBe(true)
  })

  it('propagates both the consolidation and custom-section values saved in the drawer', () => {
    const onChange = jest.fn()
    const onInvoiceCustomSectionChange = jest.fn()

    render(
      <ContractInvoicingSettingsSection
        consolidateInvoice
        invoiceCustomSection={emptyInvoiceCustomSection}
        customerId="customer-1"
        onChange={onChange}
        onInvoiceCustomSectionChange={onInvoiceCustomSectionChange}
      />,
    )
    const drawerProps = mockDrawer.mock.calls.at(-1)?.[0]
    const nextInvoiceCustomSection = {
      invoiceCustomSections: [],
      skipInvoiceCustomSections: true,
    }

    act(() =>
      drawerProps.onSave({
        consolidateInvoice: false,
        invoiceCustomSection: nextInvoiceCustomSection,
      }),
    )

    expect(onChange).toHaveBeenCalledWith(false)
    expect(onInvoiceCustomSectionChange).toHaveBeenCalledWith(nextInvoiceCustomSection)
  })
})
