import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { InvoicingPaymentsFormSection } from '../InvoicingPaymentsFormSection'

const mockPaymentMethodsInvoiceSettings: jest.Mock<null, [Record<string, unknown>]> = jest.fn()

jest.mock('~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings', () => ({
  PaymentMethodsInvoiceSettings: (props: Record<string, unknown>) => {
    mockPaymentMethodsInvoiceSettings(props)
    return null
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
      const WithFormWrapper = (receivedProps: Record<string, unknown>) => {
        return <RenderComponent {...defaultProps} {...receivedProps} />
      }

      WithFormWrapper.displayName = 'WithFormWrapper'

      return WithFormWrapper
    },
  ),
}))

const createMockForm = () => ({
  setFieldValue: jest.fn(),
  // `state` and `store` hold deliberately different values: the section must
  // read reactively from `form.store` (spec §4.9) so edits re-render in the
  // drawer. If it reverts to the bare `form.state.values` read, the forwarded
  // value would be the stale one and the assertion below fails.
  state: { values: { planId: 'stale-plan' } },
  store: { state: { values: { planId: 'reactive-plan' } } },
})

describe('InvoicingPaymentsFormSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
          formikProps: expect.objectContaining({
            values: { planId: 'reactive-plan' },
            setFieldValue: expect.any(Function),
          }),
        }),
      )
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
    it('THEN should not render', () => {
      render(
        <InvoicingPaymentsFormSection
          // @ts-expect-error — mock form shape
          form={createMockForm()}
          customer={null}
        />,
      )

      expect(screen.queryByText('text_1762862388271au34vz50g8i')).not.toBeInTheDocument()
      expect(mockPaymentMethodsInvoiceSettings).not.toHaveBeenCalled()
    })
  })
})
