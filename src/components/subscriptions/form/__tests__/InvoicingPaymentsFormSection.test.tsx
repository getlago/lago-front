import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { InvoicingPaymentsFormSection } from '../InvoicingPaymentsFormSection'

const mockPaymentMethodSettings: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockInvoiceCustomSectionFields: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockConsolidationSection: jest.Mock<null, [Record<string, unknown>]> = jest.fn()

jest.mock('~/components/paymentMethodsInvoiceSettings/PaymentMethodSettings', () => ({
  PaymentMethodSettings: (props: Record<string, unknown>) => {
    mockPaymentMethodSettings(props)
    return null
  },
}))

jest.mock('~/components/invoceCustomFooter/InvoiceCustomSectionFields', () => ({
  InvoiceCustomSectionFields: (props: Record<string, unknown>) => {
    mockInvoiceCustomSectionFields(props)
    return null
  },
}))

jest.mock('~/components/subscriptions/SubscriptionInvoiceConsolidationSection', () => ({
  SubscriptionInvoiceConsolidationSection: (props: Record<string, unknown>) => {
    mockConsolidationSection(props)
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
      const WithFormWrapper = (receivedProps: Record<string, unknown>) => {
        return <RenderComponent {...defaultProps} {...receivedProps} />
      }

      WithFormWrapper.displayName = 'WithFormWrapper'

      return WithFormWrapper
    },
  ),
}))

const createMockForm = () => {
  const state = { values: { planId: 'plan-1' } }

  return {
    setFieldValue: jest.fn(),
    state,
    store: { state },
  }
}

describe('InvoicingPaymentsFormSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasFeatureFlag = true
  })

  describe('GIVEN a customer with id', () => {
    it('THEN renders the section title and the inline payment + custom-section fields', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error - mock form shape
          form={createMockForm()}
          customer={{ id: 'cust-1' }}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
      expect(mockPaymentMethodSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: { id: 'cust-1' },
          viewType: 'subscription',
          form: expect.objectContaining({
            values: expect.any(Object),
            setFieldValue: expect.any(Function),
          }),
        }),
      )
      expect(mockInvoiceCustomSectionFields).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          viewType: 'subscription',
          onChange: expect.any(Function),
        }),
      )
    })

    it('THEN renders the consolidation field group wired to consolidateInvoice', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error - mock form shape
          form={createMockForm()}
          customer={{ id: 'cus-1' }}
        />,
      )

      expect(mockConsolidationSection).toHaveBeenCalledWith(
        expect.objectContaining({ fields: { consolidateInvoice: 'consolidateInvoice' } }),
      )
    })

    it('hides the payment + custom-section fields without the flag but keeps consolidation', () => {
      mockHasFeatureFlag = false

      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error - mock form shape
          form={createMockForm()}
          customer={{ id: 'cus-1' }}
        />,
      )

      expect(mockConsolidationSection).toHaveBeenCalled()
      expect(mockPaymentMethodSettings).not.toHaveBeenCalled()
      expect(mockInvoiceCustomSectionFields).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a customer with externalId only', () => {
    it('THEN renders payment settings but not the custom-section fields (no customer id)', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error - mock form shape
          form={createMockForm()}
          customer={{ externalId: 'ext-1' }}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
      expect(mockPaymentMethodSettings).toHaveBeenCalledWith(
        expect.objectContaining({ customer: { externalId: 'ext-1' } }),
      )
      expect(mockInvoiceCustomSectionFields).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a customer without id or externalId', () => {
    it('THEN renders consolidation but not the payment + custom-section fields', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error - mock form shape
          form={createMockForm()}
          customer={null}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
      expect(mockConsolidationSection).toHaveBeenCalled()
      expect(mockPaymentMethodSettings).not.toHaveBeenCalled()
      expect(mockInvoiceCustomSectionFields).not.toHaveBeenCalled()
    })
  })
})
