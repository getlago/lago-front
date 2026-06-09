import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { InvoicingPaymentsFormSection } from '../InvoicingPaymentsFormSection'

const mockPaymentMethodsInvoiceSettings: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockConsolidationSection: jest.Mock<null, [Record<string, unknown>]> = jest.fn()

jest.mock('~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings', () => ({
  PaymentMethodsInvoiceSettings: (props: Record<string, unknown>) => {
    mockPaymentMethodsInvoiceSettings(props)
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
    it('THEN should render the section title and forward props to PaymentMethodsInvoiceSettings', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={{ id: 'cust-1' }}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
      expect(mockPaymentMethodsInvoiceSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: { id: 'cust-1' },
          viewType: 'subscription',
          form: expect.objectContaining({
            values: expect.any(Object),
            setFieldValue: expect.any(Function),
          }),
        }),
      )
    })

    it('THEN should render the consolidation field group wired to consolidateInvoice', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={{ id: 'cus-1' }}
        />,
      )

      expect(mockConsolidationSection).toHaveBeenCalledWith(
        expect.objectContaining({ fields: { consolidateInvoice: 'consolidateInvoice' } }),
      )
    })

    it('hides PaymentMethodsInvoiceSettings without the MultiplePaymentMethods flag but keeps consolidation', () => {
      mockHasFeatureFlag = false

      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={{ id: 'cus-1' }}
        />,
      )

      expect(mockConsolidationSection).toHaveBeenCalled()
      expect(mockPaymentMethodsInvoiceSettings).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a customer with externalId only', () => {
    it('THEN should render the section', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={{ externalId: 'ext-1' }}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
    })
  })

  describe('GIVEN a customer without id or externalId', () => {
    it('THEN should render consolidation but not the payment settings', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={null}
        />,
      )

      expect(screen.getByText('text_1762862388271au34vz50g8i')).toBeInTheDocument()
      expect(mockConsolidationSection).toHaveBeenCalled()
      expect(mockPaymentMethodsInvoiceSettings).not.toHaveBeenCalled()
    })
  })
})
