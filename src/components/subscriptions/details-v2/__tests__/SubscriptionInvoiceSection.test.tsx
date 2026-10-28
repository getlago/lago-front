import {
  getInheritedFromCustomer,
  paymentTermFormValuesFromTerm,
} from '~/components/paymentTerms/utils'
import { PAYMENT_TERM_VALUE_KEYS } from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum, SubscriptionInvoiceSectionFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionInvoiceSection } from '../SubscriptionInvoiceSection'

const mockSectionHeader: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockInfoGridItem: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockInvoiceCustomSectionDetails: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockDrawer: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockOpenDrawer = jest.fn()
const mockSaveInvoicing = jest.fn()

jest.mock('~/components/plans/details-v2/shared/SectionHeader', () => ({
  SectionHeader: (props: Record<string, unknown>) => {
    mockSectionHeader(props)

    return null
  },
}))

jest.mock('~/components/layouts/DetailsPage', () => ({
  DetailsPage: {
    InfoGridItem: (props: Record<string, unknown>) => {
      mockInfoGridItem(props)

      return null
    },
  },
}))

jest.mock('~/components/subscriptions/SubscriptionInvoiceCustomSectionDetails', () => ({
  SubscriptionInvoiceCustomSectionDetails: (props: Record<string, unknown>) => {
    mockInvoiceCustomSectionDetails(props)

    return null
  },
}))

jest.mock('~/components/invoicingSettings/useInvoicingSettingsDrawer', () => ({
  useInvoicingSettingsDrawer: (props: Record<string, unknown>) => {
    mockDrawer(props)

    return { openDrawer: mockOpenDrawer }
  },
}))

jest.mock('~/hooks/customer/useUpdateSubscriptionSettings', () => ({
  useUpdateSubscriptionSettings: () => ({
    savePayment: jest.fn(),
    saveInvoicing: mockSaveInvoicing,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => true }),
}))

const PAYMENT_TERM_LABEL_KEY = 'text_1778660219891rv2r5gjmklq'

const subscription = {
  id: 'sub_1',
  consolidateInvoice: true,
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
  paymentTerm: null,
  customer: {
    id: 'cust_1',
    externalId: 'ext_1',
    paymentTerm: null,
    billingEntity: { id: 'be_1', paymentTerm: { termType: PaymentTermTypeEnum.EndOfMonth } },
  },
} as unknown as SubscriptionInvoiceSectionFragment

const renderSection = (overrides: Partial<SubscriptionInvoiceSectionFragment> = {}) =>
  render(<SubscriptionInvoiceSection subscription={{ ...subscription, ...overrides }} />)

const paymentTermItem = () =>
  mockInfoGridItem.mock.calls.find(([props]) => props.label === PAYMENT_TERM_LABEL_KEY)?.[0] as {
    value: string
  }

describe('SubscriptionInvoiceSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the invoicing header, consolidation, the custom-section display and the drawer', () => {
    renderSection()

    expect(mockSectionHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'text_17423672025282dl7iozy1ru',
        description: 'text_1782825858647mvpxt3d6et4',
      }),
    )
    expect(mockInfoGridItem).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'text_1778745351091h7z5baw0ta6' }),
    )
    expect(mockInvoiceCustomSectionDetails).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust_1' }),
    )
    expect(mockDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ onSave: mockSaveInvoicing, showCustomSection: true }),
    )
  })

  it('keeps consolidation but hides the custom-section display without a customer', () => {
    renderSection({ customer: undefined })

    expect(mockInfoGridItem).toHaveBeenCalled()
    expect(mockInvoiceCustomSectionDetails).not.toHaveBeenCalled()
    expect(mockDrawer).toHaveBeenCalledWith(expect.objectContaining({ showCustomSection: false }))
  })

  it('seeds the drawer with the subscription invoicing settings on edit', () => {
    renderSection()

    const { action } = mockSectionHeader.mock.calls.at(-1)?.[0] as {
      action: { onClick: () => void }
    }

    action.onClick()

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      consolidateInvoice: true,
      invoiceCustomSection: {
        invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      },
      paymentTerm: paymentTermFormValuesFromTerm(null, true),
    })
  })

  describe('GIVEN the subscription payment term', () => {
    it('shows the subscription own term and seeds the drawer with it', () => {
      const paymentTerm = { termType: PaymentTermTypeEnum.Net, days: 60 }

      renderSection({ paymentTerm })

      // The overview used to leave the term out entirely while the wallet page showed it.
      expect(paymentTermItem().value).toContain(PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.Net])

      const { action } = mockSectionHeader.mock.calls.at(-1)?.[0] as {
        action: { onClick: () => void }
      }

      action.onClick()

      expect(mockOpenDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ paymentTerm: paymentTermFormValuesFromTerm(paymentTerm, true) }),
      )
    })

    it('shows the inherited term marked as such when the subscription has none', () => {
      renderSection()

      expect(paymentTermItem().value).toContain(getInheritedFromCustomer(null).labelKey)
      expect(paymentTermItem().value).toContain(
        PAYMENT_TERM_VALUE_KEYS[PaymentTermTypeEnum.EndOfMonth],
      )
      expect(mockDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentTermInheritedFrom: getInheritedFromCustomer(subscription.customer),
        }),
      )
    })
  })
})
