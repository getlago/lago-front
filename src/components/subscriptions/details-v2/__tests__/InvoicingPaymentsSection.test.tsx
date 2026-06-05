import { fireEvent, screen } from '@testing-library/react'

import { InvoicingPaymentsSectionFragment, PaymentMethodTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { InvoicingPaymentsSection } from '../InvoicingPaymentsSection'

const mockOpenDrawer = jest.fn()

// Mock the drawer hook: the section's only job is to wire the Edit action to it.
// The drawer's own behaviour is covered in useInvoicingPaymentsDrawer.test.
jest.mock('../drawers/useInvoicingPaymentsDrawer', () => ({
  useInvoicingPaymentsDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

const mockPaymentInvoiceDetails = jest.fn()

// Stub the read-only display: assert it receives the right props without
// pulling in its data hooks. Its behaviour is covered in PaymentInvoiceDetails.test.
jest.mock('~/components/subscriptions/PaymentInvoiceDetails', () => ({
  PaymentInvoiceDetails: (props: Record<string, unknown>) => {
    mockPaymentInvoiceDetails(props)

    return null
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

let mockHasFeatureFlag = true

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: () => mockHasFeatureFlag }),
}))

let mockHasPermission = true

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => mockHasPermission }),
}))

const subscription = {
  id: 'sub-1',
  paymentMethodType: PaymentMethodTypeEnum.Manual,
  paymentMethod: { id: 'pm-1' },
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [{ id: 'ics-1', name: 'Bank details' }],
  customer: { id: 'cust-1', externalId: 'cust-ext-1' },
} as unknown as InvoicingPaymentsSectionFragment

describe('InvoicingPaymentsSection', () => {
  beforeEach(() => {
    mockOpenDrawer.mockClear()
    mockPaymentInvoiceDetails.mockClear()
    mockHasFeatureFlag = true
    mockHasPermission = true
  })

  it('renders nothing when the MultiplePaymentMethods feature flag is off', () => {
    mockHasFeatureFlag = false

    render(<InvoicingPaymentsSection subscription={subscription} />)

    expect(screen.queryByText('text_1762862388271au34vz50g8i')).not.toBeInTheDocument()
    expect(mockPaymentInvoiceDetails).not.toHaveBeenCalled()
  })

  it('renders the section and the read-only display when the feature flag is on', () => {
    render(<InvoicingPaymentsSection subscription={subscription} />)

    expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument() // title

    expect(mockPaymentInvoiceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        hideSectionTitle: true,
        selectedPaymentMethod: {
          paymentMethodType: PaymentMethodTypeEnum.Manual,
          paymentMethodId: 'pm-1',
        },
        externalCustomerId: 'cust-ext-1',
        customerId: 'cust-1',
        selectedInvoiceCustomSections: [{ id: 'ics-1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      }),
    )
  })

  it('opens the edit drawer when the Edit action is clicked', () => {
    render(<InvoicingPaymentsSection subscription={subscription} />)

    fireEvent.click(screen.getByRole('button', { name: 'text_63e51ef4985f0ebd75c212fc' }))

    expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
  })

  it('hides the Edit action without the subscriptionsUpdate permission', () => {
    mockHasPermission = false

    render(<InvoicingPaymentsSection subscription={subscription} />)

    expect(
      screen.queryByRole('button', { name: 'text_63e51ef4985f0ebd75c212fc' }),
    ).not.toBeInTheDocument()
  })
})
