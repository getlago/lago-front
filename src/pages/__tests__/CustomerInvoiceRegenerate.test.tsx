import { fireEvent, screen, waitFor } from '@testing-library/react'
import { generatePath } from 'react-router'

import { InvoiceDetailsTable } from '~/components/invoices/details/InvoiceDetailsTable'
import {
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_TAB_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  InvoiceStatusTypeEnum,
  RegenerateInvoiceMutationOptions,
} from '~/generated/graphql'
import { useInvoiceBuildRegenerationPreview } from '~/pages/invoiceDetails/common/useInvoiceBuildRegenerationPreview'
import { render, testMockNavigateFn } from '~/test-utils'

import CustomerInvoiceRegenerate, {
  REGENERATE_INVOICE_SUBMIT_TEST_ID,
} from '../CustomerInvoiceRegenerate'

const mockRegenerateInvoice = jest.fn()
const mockVoidInvoice = jest.fn()
let mockRegenerateOptions: RegenerateInvoiceMutationOptions | undefined

jest.mock('~/pages/invoiceDetails/common/useInvoiceBuildRegenerationPreview', () => ({
  useInvoiceBuildRegenerationPreview: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: jest.fn() }),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetCustomerQuery: jest.fn(() => ({ data: undefined, loading: false })),
    useRegenerateInvoiceMutation: jest.fn((options: RegenerateInvoiceMutationOptions) => {
      mockRegenerateOptions = options

      return [mockRegenerateInvoice, {}]
    }),
    useFetchDraftInvoiceTaxesMutation: jest.fn(() => [jest.fn(), {}]),
    useVoidInvoiceMutation: jest.fn(() => [mockVoidInvoice, {}]),
    usePreviewAdjustedFeeMutation: jest.fn(() => [jest.fn(), {}]),
  }
})

jest.mock('~/components/invoices/details/DeleteAdjustedFeeDialog', () => ({
  useDeleteAdjustedFeeDialog: () => ({ openDeleteAdjustedFeeDialog: jest.fn() }),
}))

jest.mock('~/components/invoices/details/EditFeeDrawer', () => ({
  EditFeeDrawer: jest.fn(() => null),
}))

jest.mock('~/components/invoices/details/InvoiceDetailsTable', () => ({
  InvoiceDetailsTable: jest.fn(() => null),
}))

jest.mock('~/pages/InvoiceOverview', () => ({
  InvoiceQuickInfo: jest.fn(() => null),
}))

const MockInvoiceDetailsTable = InvoiceDetailsTable as unknown as jest.Mock

const mockUseInvoiceBuildRegenerationPreview = useInvoiceBuildRegenerationPreview as jest.Mock

describe('CustomerInvoiceRegenerate redirect logic', () => {
  const customerId = 'test-customer-id'
  const invoiceId = 'new-invoice-id'
  const listPath = generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
    customerId,
    tab: CustomerDetailsTabsOptions.invoices,
  })
  const detailPath = generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
    customerId,
    invoiceId,
    tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockRegenerateOptions = undefined
    mockUseInvoiceBuildRegenerationPreview.mockReturnValue({ loading: true })
  })

  describe('GIVEN an invoice regeneration completes', () => {
    it.each([
      { status: InvoiceStatusTypeEnum.Closed, expected: listPath, excluded: detailPath },
      { status: InvoiceStatusTypeEnum.Finalized, expected: detailPath, excluded: listPath },
      { status: InvoiceStatusTypeEnum.Draft, expected: detailPath, excluded: listPath },
      { status: InvoiceStatusTypeEnum.Open, expected: detailPath, excluded: listPath },
    ])('WHEN status is $status THEN navigates to $expected', ({ status, expected, excluded }) => {
      render(<CustomerInvoiceRegenerate />, { useParams: { customerId, invoiceId } })

      expect(mockRegenerateOptions?.onCompleted).toEqual(expect.any(Function))
      mockRegenerateOptions?.onCompleted?.({ regenerateFromVoided: { id: invoiceId, status } })

      expect(testMockNavigateFn).toHaveBeenCalledWith(expected)
      expect(testMockNavigateFn).not.toHaveBeenCalledWith(excluded)
    })
  })
})

describe('CustomerInvoiceRegenerate - Fee Management Logic', () => {
  const createFeeResetHandler = (originalFees: any[]) => {
    const originalFeesClone = JSON.parse(JSON.stringify(originalFees))

    return {
      originalFeesClone,
      onDelete: (id: string, currentFees: any[]) => {
        const original = originalFeesClone.find((f: any) => f.id === id)

        if (original && !original.adjustedFee) {
          return currentFees.map((fee) => (fee.id === id ? original : fee))
        }

        return currentFees.filter((fee) => fee.id !== id)
      },
    }
  }

  describe('Deep clone behavior (Apollo cache pollution fix)', () => {
    it('should create an independent copy of original fees', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'API Calls',
          charge: { billableMetric: { name: 'API Calls Metric' } },
          subscription: { id: 'sub-1' },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      originalFees[0].invoiceDisplayName = 'CORRUPTED BY CACHE'
      originalFees[0].charge.billableMetric.name = 'CORRUPTED METRIC'

      expect(originalFeesClone[0].invoiceDisplayName).toBe('API Calls')
      expect(originalFeesClone[0].charge.billableMetric.name).toBe('API Calls Metric')
    })

    it('should preserve deeply nested subscription data', () => {
      const originalFees = [
        {
          id: 'fee-1',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Premium Plan',
              interval: 'monthly',
            },
          },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      originalFees[0].subscription = { id: 'sub-1' } as any

      expect(originalFeesClone[0].subscription.plan).toBeDefined()
      expect(originalFeesClone[0].subscription.plan.name).toBe('Premium Plan')
      expect(originalFeesClone[0].subscription.plan.interval).toBe('monthly')
    })

    it('should preserve charge and billable metric data needed for display names', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceName: 'Storage Usage',
          charge: {
            id: 'charge-1',
            chargeModel: 'standard',
            billableMetric: {
              id: 'metric-1',
              name: 'Storage',
              recurring: true,
            },
          },
          chargeFilter: {
            id: 'filter-1',
            invoiceDisplayName: 'Premium Tier',
            values: { tier: ['premium'] },
          },
          groupedBy: { region: 'US-East' },
        },
      ]

      const { originalFeesClone } = createFeeResetHandler(originalFees)

      originalFees[0].charge.billableMetric = { id: 'metric-1' } as any
      originalFees[0].chargeFilter = null as any

      expect(originalFeesClone[0].charge.billableMetric.name).toBe('Storage')
      expect(originalFeesClone[0].chargeFilter.invoiceDisplayName).toBe('Premium Tier')
    })
  })

  describe('Fee reset functionality', () => {
    it('should restore original fee when resetting an edited (non-adjusted) fee', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Original Name',
          units: 10,
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Edited Name',
          units: 20,
          adjustedFee: true,
        },
      ]

      const result = onDelete('fee-1', currentFees)

      expect(result).toHaveLength(1)
      expect(result[0].invoiceDisplayName).toBe('Original Name')
      expect(result[0].units).toBe(10)
      expect(result[0].adjustedFee).toBe(false)
    })

    it('should remove fee that was originally adjusted (delete operation)', () => {
      const originalFees = [
        {
          id: 'fee-1',
          invoiceDisplayName: 'Fee 1',
          adjustedFee: true,
        },
        {
          id: 'fee-2',
          invoiceDisplayName: 'Fee 2',
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [...originalFees]

      const result = onDelete('fee-1', currentFees)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('fee-2')
    })

    it('should remove newly added fees (temporary IDs)', () => {
      const originalFees = [{ id: 'fee-1', invoiceDisplayName: 'Original Fee', adjustedFee: false }]

      const { onDelete, originalFeesClone } = createFeeResetHandler(originalFees)

      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Original Fee', adjustedFee: false },
        { id: 'temporary-id-fee-123', invoiceDisplayName: 'New Fee', adjustedFee: true },
      ]

      const result = onDelete('temporary-id-fee-123', currentFees)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('fee-1')

      expect(originalFeesClone.find((f: any) => f.id === 'temporary-id-fee-123')).toBeUndefined()
    })

    it('should preserve other fees when resetting one fee', () => {
      const originalFees = [
        { id: 'fee-1', invoiceDisplayName: 'Fee 1', units: 10, adjustedFee: false },
        { id: 'fee-2', invoiceDisplayName: 'Fee 2', units: 20, adjustedFee: false },
        { id: 'fee-3', invoiceDisplayName: 'Fee 3', units: 30, adjustedFee: false },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Fee 1', units: 10, adjustedFee: false },
        { id: 'fee-2', invoiceDisplayName: 'Edited Fee 2', units: 100, adjustedFee: true },
        { id: 'fee-3', invoiceDisplayName: 'Fee 3', units: 30, adjustedFee: false },
      ]

      const result = onDelete('fee-2', currentFees)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(currentFees[0])
      expect(result[1].invoiceDisplayName).toBe('Fee 2')
      expect(result[1].units).toBe(20)
      expect(result[2]).toEqual(currentFees[2])
    })
  })

  describe('Display name preservation after reset', () => {
    it('should preserve all fields needed for display name generation after reset', () => {
      const originalFees = [
        {
          id: 'fee-1',
          feeType: 'charge',
          invoiceDisplayName: null,
          invoiceName: 'API Usage',
          itemName: 'API Calls',
          charge: {
            id: 'charge-1',
            billableMetric: {
              id: 'metric-1',
              name: 'API Calls Metric',
            },
          },
          chargeFilter: {
            id: 'filter-1',
            invoiceDisplayName: 'Premium Filter',
            values: { tier: ['premium'] },
          },
          groupedBy: { region: 'US-East', env: 'production' },
          trueUpParentFee: null,
          subscription: {
            id: 'sub-1',
          },
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [
        {
          id: 'fee-1',
          feeType: 'charge',
          invoiceDisplayName: null,
          invoiceName: 'API Usage',
          itemName: 'API Calls',
          charge: {
            id: 'charge-1',
          },
          chargeFilter: null,
          groupedBy: null,
          trueUpParentFee: null,
          subscription: {
            id: 'sub-1',
          },
          adjustedFee: true,
        },
      ]

      const result = onDelete('fee-1', currentFees)

      const restoredFee = result[0]

      expect(restoredFee.invoiceName).toBe('API Usage')
      expect(restoredFee.itemName).toBe('API Calls')
      expect(restoredFee.charge.billableMetric.name).toBe('API Calls Metric')
      expect(restoredFee.chargeFilter).toBeDefined()
      expect(restoredFee.chargeFilter.invoiceDisplayName).toBe('Premium Filter')
      expect(restoredFee.groupedBy).toEqual({ region: 'US-East', env: 'production' })
    })

    it('should preserve subscription fee display name fields', () => {
      const originalFees = [
        {
          id: 'fee-1',
          feeType: 'subscription',
          invoiceDisplayName: 'Custom Subscription Name',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Premium Plan',
              interval: 'monthly',
            },
          },
          adjustedFee: false,
        },
      ]

      const { onDelete } = createFeeResetHandler(originalFees)

      const currentFees = [
        {
          id: 'fee-1',
          feeType: 'subscription',
          invoiceDisplayName: 'Custom Subscription Name',
          subscription: {
            id: 'sub-1',
          },
          adjustedFee: true,
        },
      ]

      const result = onDelete('fee-1', currentFees)
      const restoredFee = result[0]

      expect(restoredFee.invoiceDisplayName).toBe('Custom Subscription Name')
      expect(restoredFee.subscription.plan).toBeDefined()
      expect(restoredFee.subscription.plan.name).toBe('Premium Plan')
      expect(restoredFee.subscription.plan.interval).toBe('monthly')
    })
  })

  describe('Fee update (onAdd) logic', () => {
    const createFeeUpdateHandler = () => {
      const TEMPORARY_ID_PREFIX = 'temporary-id-fee-'

      return {
        onAdd: (
          currentFees: any[],
          previewedFeeData: any,
          input: { feeId?: string; properties?: any },
        ) => {
          const isUpdate = currentFees.some((f) => f.id === input.feeId)

          const calculatedFee = {
            ...previewedFeeData,
            properties: previewedFeeData.properties ?? input.properties,
            id: isUpdate ? input.feeId : `${TEMPORARY_ID_PREFIX}-${Math.random().toString()}`,
            adjustedFee: true,
          }

          if (isUpdate) {
            return currentFees.map((fee) => (fee.id === input.feeId ? calculatedFee : fee))
          }

          return [...currentFees, calculatedFee]
        },
      }
    }

    it('should update existing fee in place', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [
        { id: 'fee-1', invoiceDisplayName: 'Original', units: 10 },
        { id: 'fee-2', invoiceDisplayName: 'Other Fee', units: 5 },
      ]

      const previewedData = { invoiceDisplayName: 'Updated', units: 20 }
      const result = onAdd(currentFees, previewedData, { feeId: 'fee-1' })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('fee-1')
      expect(result[0].invoiceDisplayName).toBe('Updated')
      expect(result[0].units).toBe(20)
      expect(result[0].adjustedFee).toBe(true)
      expect(result[1]).toEqual(currentFees[1])
    })

    it('should add new fee with temporary ID', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [{ id: 'fee-1', invoiceDisplayName: 'Existing', units: 10 }]

      const previewedData = { invoiceDisplayName: 'New Fee', units: 5 }
      const result = onAdd(currentFees, previewedData, { feeId: undefined })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(currentFees[0])
      expect(result[1].id).toContain('temporary-id-fee-')
      expect(result[1].invoiceDisplayName).toBe('New Fee')
      expect(result[1].adjustedFee).toBe(true)
    })

    it('should preserve properties from input when mutation does not return them', () => {
      const { onAdd } = createFeeUpdateHandler()

      const currentFees = [{ id: 'fee-1' }]
      const inputProperties = {
        fromDatetime: '2024-01-01T00:00:00Z',
        toDatetime: '2024-01-31T23:59:59Z',
      }

      const previewedData = { invoiceDisplayName: 'Updated', properties: null }
      const result = onAdd(currentFees, previewedData, {
        feeId: 'fee-1',
        properties: inputProperties,
      })

      expect(result[0].properties).toEqual(inputProperties)
    })
  })
})

describe('CustomerInvoiceRegenerate - hook integration', () => {
  const mockInvoice = {
    id: 'invoice-123',
    number: 'INV-2024-001',
    issuingDate: '2024-01-15T00:00:00.000Z',
    voidedAt: null,
    currency: CurrencyEnum.Usd,
    fees: [],
    customer: {
      id: 'customer-123',
      applicableTimezone: 'UTC',
    },
    billingEntity: {
      id: 'billing-entity-123',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
      invoiceBuildRegenerationPreview: undefined,
      loading: true,
      error: undefined,
      data: undefined,
    })
  })

  describe('GIVEN the page is rendered with URL params', () => {
    describe('WHEN an invoiceId is present in the URL', () => {
      it('THEN should call useInvoiceBuildRegenerationPreview with the invoiceId', () => {
        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(mockUseInvoiceBuildRegenerationPreview).toHaveBeenCalledWith('invoice-123')
      })
    })

    describe('WHEN no invoiceId is in the URL', () => {
      it('THEN should call useInvoiceBuildRegenerationPreview with undefined', () => {
        render(<CustomerInvoiceRegenerate />, {
          useParams: { customerId: 'test-customer-id' },
        })

        expect(mockUseInvoiceBuildRegenerationPreview).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('GIVEN the hook returns a loading state', () => {
    describe('WHEN the invoice data is still loading', () => {
      it('THEN should not render InvoiceDetailsTable', () => {
        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(MockInvoiceDetailsTable).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the hook returns an invoice', () => {
    beforeEach(() => {
      mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
        invoiceBuildRegenerationPreview: mockInvoice,
        loading: false,
        error: undefined,
        data: { invoiceBuildRegenerationPreview: mockInvoice },
      })
    })

    it.each([
      { preciseUnitAmount: 0, units: 1 },
      { preciseUnitAmount: '0', units: 1 },
      { preciseUnitAmount: 2000, units: 0 },
    ])('THEN preserves zero values when submitting untouched fees: %j', async (values) => {
      mockRegenerateInvoice.mockResolvedValue({})
      mockVoidInvoice.mockResolvedValue({})

      const fee = {
        id: 'fee-123',
        ...values,
        charge: { id: 'charge-123' },
        subscription: { id: 'subscription-123' },
        description: '',
        invoiceDisplayName: null,
      }

      mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
        invoiceBuildRegenerationPreview: { ...mockInvoice, fees: [fee] },
        loading: false,
      })

      render(<CustomerInvoiceRegenerate />, {
        useParams: { invoiceId: 'invoice-123', customerId: 'customer-123' },
      })

      fireEvent.click(screen.getByTestId(REGENERATE_INVOICE_SUBMIT_TEST_ID))

      await waitFor(() => {
        expect(mockRegenerateInvoice).toHaveBeenCalledWith({
          variables: {
            input: {
              voidedInvoiceId: 'invoice-123',
              purchaseOrderNumber: null,
              fees: [
                {
                  id: 'fee-123',
                  chargeId: 'charge-123',
                  subscriptionId: 'subscription-123',
                  unitAmountCents: values.preciseUnitAmount,
                  units: values.units,
                },
              ],
            },
          },
        })
      })
      expect(mockVoidInvoice).toHaveBeenCalledWith({
        variables: { input: { id: 'invoice-123', generateCreditNote: false } },
      })
    })

    describe('WHEN the invoice has not been voided', () => {
      it('THEN should render InvoiceDetailsTable with the invoice', () => {
        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(MockInvoiceDetailsTable).toHaveBeenCalledWith(
          expect.objectContaining({ invoice: mockInvoice }),
          expect.anything(),
        )
      })

      it('THEN should render the cancel and submit buttons', () => {
        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
      })
    })

    describe('WHEN the invoice has been voided', () => {
      it('THEN should render InvoiceDetailsTable with the voided invoice', () => {
        const voidedInvoice = { ...mockInvoice, voidedAt: '2024-02-01T00:00:00.000Z' }

        mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
          invoiceBuildRegenerationPreview: voidedInvoice,
          loading: false,
          error: undefined,
          data: { invoiceBuildRegenerationPreview: voidedInvoice },
        })

        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(MockInvoiceDetailsTable).toHaveBeenCalledWith(
          expect.objectContaining({ invoice: voidedInvoice }),
          expect.anything(),
        )
      })
    })
  })

  describe('GIVEN the hook returns an error', () => {
    describe('WHEN the invoice fails to load', () => {
      it('THEN should not render InvoiceDetailsTable', () => {
        mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
          invoiceBuildRegenerationPreview: undefined,
          loading: false,
          error: new Error('Failed to load invoice'),
          data: undefined,
        })

        render(<CustomerInvoiceRegenerate />, {
          useParams: { invoiceId: 'invoice-123', customerId: 'test-customer-id' },
        })

        expect(MockInvoiceDetailsTable).not.toHaveBeenCalled()
      })
    })
  })
})
