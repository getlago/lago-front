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

describe('ContractInvoicingSettingsSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('opens the contract drawer with the current consolidation value', () => {
    render(<ContractInvoicingSettingsSection consolidateInvoice={false} onChange={jest.fn()} />)

    const selectorProps = mockSelector.mock.calls.at(-1)?.[0]
    const drawerProps = mockDrawer.mock.calls.at(-1)?.[0]

    expect(selectorProps['data-test']).toBe(CONTRACT_INVOICING_SETTINGS_TEST_ID)
    expect(selectorProps.subtitle).toBe('text_1778745351091fxaqr5dwok8')
    expect(drawerProps.viewType).toBe(ViewTypeEnum.Contract)
    expect(drawerProps.showCustomSection).toBe(false)
    expect(drawerProps.withInvoiceConsolidation).toBe(true)

    act(() => selectorProps.onClick())
    expect(mockOpenDrawer).toHaveBeenCalledWith({ consolidateInvoice: false })
  })

  it('propagates the consolidation value saved in the drawer', () => {
    const onChange = jest.fn()

    render(<ContractInvoicingSettingsSection consolidateInvoice onChange={onChange} />)
    const drawerProps = mockDrawer.mock.calls.at(-1)?.[0]

    act(() => drawerProps.onSave({ consolidateInvoice: false }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
