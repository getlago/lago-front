import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import { useInvoicingSettingsDrawer } from '~/components/invoicingSettings/useInvoicingSettingsDrawer'
import { usePaymentSettingsDrawer } from '~/components/paymentSettings/usePaymentSettingsDrawer'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  ContractForContractDetailsOverviewFragment,
  ContractStatusEnum,
  GetContractForDetailsOverviewDocument,
  PaymentMethodTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CONTRACT_OVERVIEW_EDIT_TEST_ID,
  CONTRACT_OVERVIEW_INVOICING_EDIT_TEST_ID,
  CONTRACT_OVERVIEW_PAYMENT_EDIT_TEST_ID,
  CONTRACT_OVERVIEW_SETTINGS_EDIT_TEST_ID,
  ContractOverviewSection,
} from '../ContractOverviewSection'

const mockPaymentMethodProps = jest.fn()
const mockTimezoneDateProps = jest.fn()
const mockBillingEntityLabelProps = jest.fn()
const mockCanEditContract = jest.fn()
const mockOpenAttachedObjectDrawer = jest.fn()
const mockOpenContractSettingsDrawer = jest.fn()
const mockOpenInvoicingSettingsDrawer = jest.fn()
const mockOpenPaymentSettingsDrawer = jest.fn()
const mockInvoicingSettingsDrawerProps = jest.fn(
  (props: Parameters<typeof useInvoicingSettingsDrawer>[0]) => props,
)
const mockPaymentSettingsDrawerProps = jest.fn(
  (props: Parameters<typeof usePaymentSettingsDrawer>[0]) => props,
)
const mockInvoiceCustomSectionDetailsProps = jest.fn()
const mockUpdateContractSection = jest.fn()

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

jest.mock('~/hooks/useContractPermissionsActions', () => ({
  useContractPermissionsActions: () => ({ canEditContract: mockCanEditContract }),
}))

jest.mock(
  '~/components/contracts/drawers/contractAttachedObject/useContractAttachedObjectDrawer',
  () => ({
    useContractAttachedObjectDrawer: () => ({ openDrawer: mockOpenAttachedObjectDrawer }),
  }),
)

jest.mock('~/components/contracts/drawers/contractSettings/useContractSettingsDrawer', () => ({
  useContractSettingsDrawer: () => ({ openDrawer: mockOpenContractSettingsDrawer }),
}))

jest.mock('~/components/contracts/useUpdateContractSection', () => ({
  useUpdateContractSection: () => ({ updateContractSection: mockUpdateContractSection }),
}))

jest.mock('~/components/invoicingSettings/useInvoicingSettingsDrawer', () => ({
  useInvoicingSettingsDrawer: (props: Parameters<typeof useInvoicingSettingsDrawer>[0]) => {
    mockInvoicingSettingsDrawerProps(props)
    return { openDrawer: mockOpenInvoicingSettingsDrawer }
  },
}))

jest.mock('~/components/paymentSettings/usePaymentSettingsDrawer', () => ({
  usePaymentSettingsDrawer: (props: Parameters<typeof usePaymentSettingsDrawer>[0]) => {
    mockPaymentSettingsDrawerProps(props)
    return { openDrawer: mockOpenPaymentSettingsDrawer }
  },
}))

jest.mock('~/components/invoceCustomFooter/InvoiceCustomSectionDetails', () => ({
  InvoiceCustomSectionDetails: (props: Record<string, unknown>) => {
    mockInvoiceCustomSectionDetailsProps(props)
    return <div data-test="invoice-custom-section-details" />
  },
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
  code: 'initial',
  name: null,
  status: ContractStatusEnum.Terminated,
  startedAt: '2026-01-01T00:00:00Z',
  endedAt: '2026-12-31T00:00:00Z',
  billingAnchorDate: '2026-01-15',
  canceledAt: null,
  terminatedAt: '2026-08-01T00:00:00Z',
  billingEntityId: 'entity-2',
  consolidateInvoice: true,
  selectedInvoiceCustomSections: [],
  skipInvoiceCustomSections: false,
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
    code: 'enterprise',
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
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanEditContract.mockImplementation(
      (status) => status === ContractStatusEnum.Active || status === ContractStatusEnum.Pending,
    )
  })

  it('offers Edit on the attached object section of an editable contract', async () => {
    await renderSection({ status: ContractStatusEnum.Active })

    await userEvent.click(await screen.findByTestId(CONTRACT_OVERVIEW_EDIT_TEST_ID))

    expect(mockOpenAttachedObjectDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'contract-1' }),
    )
  })

  it('offers Edit on the contract settings section of an editable contract', async () => {
    await renderSection({ status: ContractStatusEnum.Active })

    await userEvent.click(await screen.findByTestId(CONTRACT_OVERVIEW_SETTINGS_EDIT_TEST_ID))

    expect(mockOpenContractSettingsDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'contract-1' }),
    )
  })

  it('offers Edit on the invoicing settings section of an editable contract', async () => {
    await renderSection({ status: ContractStatusEnum.Active, consolidateInvoice: false })

    await userEvent.click(await screen.findByTestId(CONTRACT_OVERVIEW_INVOICING_EDIT_TEST_ID))

    expect(mockOpenInvoicingSettingsDrawer).toHaveBeenCalledWith({
      consolidateInvoice: false,
      invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
    })
    expect(mockInvoicingSettingsDrawerProps).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-1',
        showCustomSection: true,
        withInvoiceConsolidation: true,
      }),
    )
  })

  it('offers Edit on the payment settings section of an editable contract', async () => {
    await renderSection({ status: ContractStatusEnum.Active })

    await userEvent.click(await screen.findByTestId(CONTRACT_OVERVIEW_PAYMENT_EDIT_TEST_ID))

    expect(mockOpenPaymentSettingsDrawer).toHaveBeenCalledWith({
      paymentMethod: { paymentMethodId: 'payment-method-1', paymentMethodType: 'provider' },
    })
    expect(mockPaymentSettingsDrawerProps).toHaveBeenCalledWith(
      expect.objectContaining({ externalCustomerId: 'external-customer-1' }),
    )
  })

  it('saves invoicing settings with the contract id', async () => {
    await renderSection({ status: ContractStatusEnum.Active })
    await screen.findByTestId(CONTRACT_OVERVIEW_INVOICING_EDIT_TEST_ID)

    await act(async () =>
      mockInvoicingSettingsDrawerProps.mock.calls.at(-1)?.[0].onSave({
        consolidateInvoice: false,
        invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: true },
        paymentTerm: paymentTermFormValuesFromTerm(null, true),
      }),
    )

    expect(mockUpdateContractSection).toHaveBeenCalledWith({
      id: 'contract-1',
      consolidateInvoice: false,
      invoiceCustomSection: { invoiceCustomSectionIds: [], skipInvoiceCustomSections: true },
    })
  })

  it('saves payment settings with the contract id', async () => {
    await renderSection({ status: ContractStatusEnum.Active })
    await screen.findByTestId(CONTRACT_OVERVIEW_PAYMENT_EDIT_TEST_ID)

    const paymentMethod = {
      paymentMethodId: 'payment-method-2',
      paymentMethodType: PaymentMethodTypeEnum.Provider,
    }

    await act(async () =>
      mockPaymentSettingsDrawerProps.mock.calls.at(-1)?.[0].onSave({ paymentMethod }),
    )

    expect(mockUpdateContractSection).toHaveBeenCalledWith({ id: 'contract-1', paymentMethod })
  })

  it('hides every Edit action on a terminated contract', async () => {
    await renderSection()

    await screen.findByText('external-contract-1')
    expect(screen.queryByTestId(CONTRACT_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(CONTRACT_OVERVIEW_SETTINGS_EDIT_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(CONTRACT_OVERVIEW_INVOICING_EDIT_TEST_ID)).not.toBeInTheDocument()
    expect(screen.queryByTestId(CONTRACT_OVERVIEW_PAYMENT_EDIT_TEST_ID)).not.toBeInTheDocument()
  })

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
    expect(screen.queryByText('Attached object')).not.toBeInTheDocument()
  })

  it('renders read-only settings and linked attached objects', async () => {
    await renderSection()

    expect(await screen.findByText('external-contract-1')).toBeInTheDocument()
    expect(screen.getAllByText('-')).not.toHaveLength(0)
    expect(screen.getAllByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)).toHaveLength(2)
    const purchaseOrderNumber = screen.getByText('PO-42')
    const contractSettings = screen.getByText('Contract settings').closest('section')
    const invoicingSettings = screen.getByText('Invoicing settings').closest('section')

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

  describe('GIVEN a contract code', () => {
    it('THEN displays the code and copies its value', async () => {
      await renderSection({ code: 'renewal' })

      await userEvent.click(await screen.findByRole('button', { name: 'renewal' }))

      expect(copyToClipboard).toHaveBeenCalledWith('renewal')
    })
  })

  describe('GIVEN an older contract without a code', () => {
    it('THEN keeps only the external id copy action', async () => {
      await renderSection({ code: null, name: 'Enterprise agreement' })

      await screen.findByText('external-contract-1')

      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.getAllByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)).toHaveLength(1)
      expect(screen.queryByRole('button', { name: 'initial' })).not.toBeInTheDocument()
    })
  })

  it('passes the contract customer and selection to the invoice custom section display', async () => {
    await renderSection({
      selectedInvoiceCustomSections: [{ id: 'section-1', name: 'Bank details' }],
      skipInvoiceCustomSections: false,
    })

    expect(await screen.findByTestId('invoice-custom-section-details')).toBeInTheDocument()
    expect(mockInvoiceCustomSectionDetailsProps).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-1',
        selectedInvoiceCustomSections: [{ id: 'section-1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      }),
    )
  })

  it('falls back to the external id when the customer has no display name', async () => {
    await renderSection({ customer: { ...contract.customer, displayName: '' } })

    expect(await screen.findByRole('link', { name: 'external-customer-1' })).toHaveAttribute(
      'href',
      '/customer/customer-1',
    )
  })

  it('renders sections in design order with dividers on the first three', async () => {
    await renderSection()

    const attached = await screen.findByText('Attached object')
    const settings = screen.getByText('Contract settings')
    const invoicing = screen.getByText('Invoicing settings')
    const payment = screen.getByText('Payment app and settings')

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
    expect(screen.getByText('Termination date')).toBeInTheDocument()
    expect(screen.queryByText('Cancellation date')).not.toBeInTheDocument()
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

    expect(await screen.findByText('Cancellation date')).toBeInTheDocument()
    expect(screen.queryByText('Termination date')).not.toBeInTheDocument()
  })

  it.each([ContractStatusEnum.Active, ContractStatusEnum.Pending])(
    'does not render a lifecycle date for %s contracts',
    async (status) => {
      await renderSection({ status, canceledAt: null, terminatedAt: null })

      expect(screen.queryByText('Cancellation date')).not.toBeInTheDocument()
      expect(screen.queryByText('Termination date')).not.toBeInTheDocument()
    },
  )
})
