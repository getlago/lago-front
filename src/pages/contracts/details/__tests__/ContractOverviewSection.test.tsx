import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'

import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import {
  ContractForContractDetailsOverviewFragment,
  ContractStatusEnum,
  GetContractForDetailsOverviewDocument,
  PaymentMethodTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { ContractOverviewSection } from '../ContractOverviewSection'

const mockPaymentMethodProps = jest.fn()
const mockTimezoneDateProps = jest.fn()
const mockBillingEntityLabelProps = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/billingEntity/BillingEntityLabel', () => ({
  BillingEntityLabel: (props: Record<string, unknown>) => {
    mockBillingEntityLabelProps(props)
    return <span>Affiliated entity label</span>
  },
}))

jest.mock('~/components/subscriptions/SubscriptionPaymentMethodDetails', () => ({
  SubscriptionPaymentMethodDetails: (props: Record<string, unknown>) => {
    mockPaymentMethodProps(props)
    return <div data-test="payment-method" />
  },
}))

jest.mock('~/components/TimezoneDate', () => ({
  TimezoneDate: (props: Record<string, unknown>) => {
    mockTimezoneDateProps(props)
    return <span>{String(props.date)}</span>
  },
}))

const contract: ContractForContractDetailsOverviewFragment = {
  __typename: 'Contract',
  id: 'contract-1',
  externalId: 'external-contract-1',
  name: null,
  status: ContractStatusEnum.Terminated,
  startedAt: '2026-01-01T00:00:00Z',
  endedAt: '2026-12-31T00:00:00Z',
  billingAnchorDate: '2026-01-15',
  canceledAt: null,
  terminatedAt: '2026-08-01T00:00:00Z',
  billingEntityId: 'entity-2',
  consolidateInvoice: true,
  purchaseOrderNumber: 'PO-42',
  paymentMethodType: PaymentMethodTypeEnum.Provider,
  paymentMethod: { __typename: 'PaymentMethod', id: 'payment-method-1' },
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    externalId: 'external-customer-1',
    displayName: 'Acme',
    applicableTimezone: TimezoneEnum.TzAmericaNewYork,
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'entity-1',
      name: 'Default entity',
      code: 'default',
    },
  },
  plan: {
    __typename: 'CatalogPlan',
    id: 'plan-1',
    name: 'Enterprise plan',
  },
}

const renderSection = async (overrides: Partial<typeof contract> = {}) => {
  const contractResult = { ...contract, ...overrides }
  const queryMock = {
    request: {
      query: GetContractForDetailsOverviewDocument,
      variables: { id: 'contract-1' },
    },
    result: { data: { contract: contractResult } },
  }

  await act(() =>
    rtlRender(<ContractOverviewSection />, {
      wrapper: ({ children }) => (
        <AllTheProviders forceTypenames mocks={[queryMock]} useParams={{ id: 'contract-1' }}>
          {children}
        </AllTheProviders>
      ),
    }),
  )
}

describe('ContractOverviewSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the shared details skeleton while the contract is loading', () => {
    const loadingMock = {
      request: {
        query: GetContractForDetailsOverviewDocument,
        variables: { id: 'contract-1' },
      },
      delay: 5_000,
      result: { data: { contract } },
    }

    rtlRender(<ContractOverviewSection />, {
      wrapper: ({ children }) => (
        <AllTheProviders forceTypenames mocks={[loadingMock]} useParams={{ id: 'contract-1' }}>
          {children}
        </AllTheProviders>
      ),
    })

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(7)
    expect(screen.queryByText('text_1789552637141n7ijvldeali')).not.toBeInTheDocument()
  })

  it('renders read-only settings and linked attached objects', async () => {
    await renderSection()

    expect(await screen.findByText('external-contract-1')).toBeInTheDocument()
    expect(screen.getAllByText('-')).not.toHaveLength(0)
    expect(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)).toBeInTheDocument()
    const purchaseOrderNumber = screen.getByText('PO-42')
    const contractSettings = screen.getByText('text_1789552637141f58gbx5dew3').closest('section')
    const invoicingSettings = screen.getByText('text_17423672025282dl7iozy1ru').closest('section')

    expect(contractSettings).toContainElement(purchaseOrderNumber)
    expect(invoicingSettings).not.toContainElement(purchaseOrderNumber)
    expect(screen.getByText('Affiliated entity label')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/customer/customer-1',
    )
    expect(screen.getByRole('link', { name: 'Enterprise plan' })).toHaveAttribute(
      'href',
      '/plan-pricing/plan-1/overview',
    )
  })

  it('renders sections in design order with dividers on the first three', async () => {
    await renderSection()

    const attached = await screen.findByText('text_1789552637141n7ijvldeali')
    const settings = screen.getByText('text_1789552637141f58gbx5dew3')
    const invoicing = screen.getByText('text_17423672025282dl7iozy1ru')
    const payment = screen.getByText('text_1782825858647rr5zp42t63m')

    expect(attached.compareDocumentPosition(settings)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(settings.compareDocumentPosition(invoicing)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(invoicing.compareDocumentPosition(payment)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(attached.closest('section')).toHaveClass('pb-12', 'shadow-b')
    expect(settings.closest('section')).toHaveClass('pb-12', 'shadow-b')
    expect(invoicing.closest('section')).toHaveClass('pb-12', 'shadow-b')
    expect(payment.closest('section')).not.toHaveClass('shadow-b')
  })

  it('passes explicit and inherited billing entities to the shared resolver', async () => {
    await renderSection()

    await waitFor(() => {
      expect(mockBillingEntityLabelProps).toHaveBeenCalledWith({
        ownId: 'entity-2',
        customerEntity: contract.customer.billingEntity,
      })
    })
  })

  it('maps payment settings and renders the status-specific lifecycle date', async () => {
    await renderSection()

    await waitFor(() => {
      expect(mockPaymentMethodProps).toHaveBeenCalledWith({
        selectedPaymentMethod: {
          paymentMethodId: 'payment-method-1',
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        },
        externalCustomerId: 'external-customer-1',
      })
    })
    expect(screen.getByText('text_17897233021144v1deu5m2s7')).toBeInTheDocument()
    expect(screen.queryByText('text_1789723302114ceqx5k6efdq')).not.toBeInTheDocument()
    expect(mockTimezoneDateProps).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-08-01T00:00:00Z',
        customerTimezone: TimezoneEnum.TzAmericaNewYork,
      }),
    )
  })

  it('renders the cancellation date only for canceled contracts', async () => {
    await renderSection({
      status: ContractStatusEnum.Canceled,
      canceledAt: '2026-07-01T00:00:00Z',
      terminatedAt: null,
    })

    expect(await screen.findByText('text_1789723302114ceqx5k6efdq')).toBeInTheDocument()
    expect(screen.queryByText('text_17897233021144v1deu5m2s7')).not.toBeInTheDocument()
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
    'does not render a lifecycle date for %s contracts',
    async (status) => {
      await renderSection({ status, canceledAt: null, terminatedAt: null })

      expect(screen.queryByText('text_1789723302114ceqx5k6efdq')).not.toBeInTheDocument()
      expect(screen.queryByText('text_17897233021144v1deu5m2s7')).not.toBeInTheDocument()
    },
  )
})
