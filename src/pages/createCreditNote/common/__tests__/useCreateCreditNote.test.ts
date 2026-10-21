import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'

import { ERROR_404_ROUTE } from '~/core/router'
import {
  FeatureFlagEnum,
  GetInvoiceCreateCreditNoteDocument,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import {
  fullOneOffInvoiceMockAndExpect,
  fullSubscriptionInvoiceGroupTrueUpMockAndExpect,
  fullSubscriptionInvoiceMockAndExpect,
  INVOICE_FIXTURE_ID,
  invoiceWithNoCredOrRefundAmountMockAndExpect,
} from '~/hooks/__tests__/fixtures'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import { useCreateCreditNote } from '../useCreateCreditNote'

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: jest.fn(),
}))

const mockUseOrganizationInfos = jest.mocked(useOrganizationInfos)

type PrepareType = { mock?: Record<string, unknown> }

async function prepare({ mock }: PrepareType = {}) {
  const mocks = [
    {
      request: {
        query: GetInvoiceCreateCreditNoteDocument,
        variables: { id: INVOICE_FIXTURE_ID },
      },
      result: {
        data: mock,
      },
    },
  ]

  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
      mocks,
      useParams: { id: '1', invoiceId: INVOICE_FIXTURE_ID },
      forceTypenames: true,
    })

  const { result } = renderHook(() => useCreateCreditNote(), {
    wrapper: customWrapper,
  })

  return { result: result }
}

describe('useCreateCreditNote()', () => {
  beforeEach(() => {
    mockUseOrganizationInfos.mockReturnValue({
      hasFeatureFlag: (flag: FeatureFlagEnum) => flag === FeatureFlagEnum.ProductCatalog,
    } as unknown as ReturnType<typeof useOrganizationInfos>)
  })

  it('returns default datas', async () => {
    const { mock } = fullSubscriptionInvoiceMockAndExpect()
    const { result } = await prepare({ mock })

    expect(result.current.loading).toBeTruthy()

    // Skip loading state
    await act(() => wait(0))

    expect(result.current.loading).toBeFalsy()
    expect(result.current.invoice).toBeDefined()
    expect(result.current.feesPerInvoice).toBeDefined()
    expect(result.current.feeForAddOn).not.toBeDefined()
    expect(result.current.onCreate).toBeDefined()
  })

  it('should format feeForAddOn correctly', async () => {
    const { mock, transformedObject } = fullOneOffInvoiceMockAndExpect()

    const { result } = await prepare({ mock })

    // Skip loading state
    await act(() => wait(0))

    expect(result.current.feeForAddOn).toStrictEqual(transformedObject)
  })

  it('keeps contract product fees separate from ordinary one-off fees', async () => {
    const { mock, transformedObject } = fullOneOffInvoiceMockAndExpect()
    const productFee = {
      id: 'contract-product-fee',
      amountCurrency: 'EUR',
      contractRateCard: { id: 'rate-card-1' },
      itemName: 'Product',
      creditableAmountCents: '1200',
      offsettableAmountCents: '1200',
      appliedTaxes: [],
    }
    const invoiceWithProductFee = {
      invoice: { ...mock.invoice, fees: [...mock.invoice.fees, productFee] },
    }

    const { result } = await prepare({ mock: invoiceWithProductFee })
    await act(() => wait(0))

    expect(result.current.feeForAddOn).toStrictEqual(transformedObject)
    expect(result.current.feeForProduct).toEqual([
      expect.objectContaining({ id: productFee.id, value: 12 }),
    ])
  })

  it('should format feesPerInvoice correctly', async () => {
    const { mock, transformedObject } = fullSubscriptionInvoiceGroupTrueUpMockAndExpect()

    const { result } = await prepare({ mock })

    // Skip loading state
    await act(() => wait(0))

    expect(result.current.feesPerInvoice).toStrictEqual(transformedObject)
  })

  it('includes ordinary product fees while excluding subscription and non-product invoice fees', async () => {
    const { mock } = fullSubscriptionInvoiceMockAndExpect()
    const invoice = mock.invoice
    const productFee = {
      id: 'ordinary-product-fee',
      amountCurrency: 'EUR',
      contractRateCard: { id: 'rate-card-1' },
      itemName: 'Product',
      invoiceName: 'Product fee',
      creditableAmountCents: '1200',
      offsettableAmountCents: '1200',
      appliedTaxes: [],
    }
    const ordinaryFee = {
      ...productFee,
      id: 'ordinary-non-product-fee',
      contractRateCard: null,
    }
    const subscriptionProductFee = { ...productFee, id: 'subscription-product-fee' }
    const mixedMock = {
      invoice: {
        ...invoice,
        fees: [...invoice.fees, productFee, ordinaryFee],
        invoiceSubscriptions: invoice.invoiceSubscriptions.map((subscription) => ({
          ...subscription,
          fees: [...subscription.fees, subscriptionProductFee],
        })),
      },
    }

    const { result } = await prepare({ mock: mixedMock })
    await act(() => wait(0))

    expect(result.current.feeForProduct).toEqual([
      expect.objectContaining({ id: productFee.id, name: 'Product fee', checked: true }),
    ])
    expect(result.current.feesPerInvoice).toHaveProperty('invoice-subscription-subscription-1-id')
  })

  it('creates a selectable fee list from product fees alone', async () => {
    const { mock } = fullSubscriptionInvoiceMockAndExpect()
    const productFee = {
      id: 'ordinary-product-fee',
      amountCurrency: 'EUR',
      contractRateCard: { id: 'rate-card-1' },
      itemName: 'Product',
      invoiceName: 'Product fee',
      creditableAmountCents: '1200',
      offsettableAmountCents: '1200',
      appliedTaxes: [],
    }
    const productOnlyMock = {
      invoice: {
        ...mock.invoice,
        invoiceType: InvoiceTypeEnum.Contract,
        invoiceSubscriptions: [],
        fees: [productFee],
      },
    }
    const { result } = await prepare({ mock: productOnlyMock })
    await act(() => wait(0))

    expect(result.current.feeForProduct).toEqual([
      expect.objectContaining({ id: productFee.id, value: 12, maxAmount: 1200 }),
    ])
  })

  it('ignores contract fees when the product_catalog flag is off', async () => {
    mockUseOrganizationInfos.mockReturnValue({
      hasFeatureFlag: () => false,
    } as unknown as ReturnType<typeof useOrganizationInfos>)
    const { mock } = fullSubscriptionInvoiceMockAndExpect()
    const productCatalogOffMock = {
      invoice: {
        ...mock.invoice,
        fees: [
          ...mock.invoice.fees,
          {
            id: 'contract-product-fee',
            amountCurrency: 'EUR',
            contractRateCard: { id: 'rate-card-1' },
            itemName: 'Product',
            creditableAmountCents: '1200',
            offsettableAmountCents: '1200',
            appliedTaxes: [],
          },
        ],
      },
    }
    const { result } = await prepare({ mock: productCatalogOffMock })
    await act(() => wait(0))

    expect(result.current.feeForProduct).toBeUndefined()
  })

  describe('hasCreditableOrRefundableAmount', () => {
    it('should return true when creditableAmountCents > 0', async () => {
      const { mock } = fullOneOffInvoiceMockAndExpect()
      const { result } = await prepare({ mock })

      await act(() => wait(0))

      expect(result.current.hasCreditableOrRefundableAmount).toBe(true)
    })

    it('should return true when refundableAmountCents > 0', async () => {
      const { mock } = fullSubscriptionInvoiceMockAndExpect()
      // Modify mock to have refundableAmountCents > 0
      const modifiedMock = {
        invoice: {
          ...mock.invoice,
          creditableAmountCents: '0',
          refundableAmountCents: '1000',
        },
      }
      const { result } = await prepare({ mock: modifiedMock })

      await act(() => wait(0))

      expect(result.current.hasCreditableOrRefundableAmount).toBe(true)
    })

    it('should return false when both creditableAmountCents and refundableAmountCents are 0', async () => {
      const { mock } = invoiceWithNoCredOrRefundAmountMockAndExpect()
      const { result } = await prepare({ mock })

      await act(() => wait(0))

      expect(result.current.hasCreditableOrRefundableAmount).toBe(false)
    })
  })

  describe('offsettableAmountCents fallback', () => {
    it('should use offsettableAmountCents when hasCreditableOrRefundableAmount is false', async () => {
      const { mock, transformedObject } = invoiceWithNoCredOrRefundAmountMockAndExpect()
      const { result } = await prepare({ mock })

      await act(() => wait(0))

      expect(result.current.hasCreditableOrRefundableAmount).toBe(false)
      expect(result.current.feeForAddOn).toStrictEqual(transformedObject)
    })

    it('should set isReadOnly to true when using offsettableAmountCents', async () => {
      const { mock } = invoiceWithNoCredOrRefundAmountMockAndExpect()
      const { result } = await prepare({ mock })

      await act(() => wait(0))

      expect(result.current.feeForAddOn?.[0]?.isReadOnly).toBe(true)
      expect(result.current.feeForAddOn?.[1]?.isReadOnly).toBe(true)
    })

    it('should set isReadOnly to false when using creditableAmountCents', async () => {
      const { mock } = fullOneOffInvoiceMockAndExpect()
      const { result } = await prepare({ mock })

      await act(() => wait(0))

      expect(result.current.feeForAddOn?.[0]?.isReadOnly).toBe(false)
    })
  })

  describe('when the invoice is fully covered (nothing creditable/refundable/offsettable)', () => {
    it('flags the invoice as fully covered instead of redirecting to 404', async () => {
      testMockNavigateFn.mockClear()

      const { mock } = invoiceWithNoCredOrRefundAmountMockAndExpect()
      const fullyCoveredMock = {
        invoice: {
          ...mock.invoice,
          creditableAmountCents: '0',
          refundableAmountCents: '0',
          offsettableAmountCents: '0',
        },
      }
      const { result } = await prepare({ mock: fullyCoveredMock })

      await act(() => wait(0))

      expect(result.current.isInvoiceFullyCovered).toBe(true)
      expect(testMockNavigateFn).not.toHaveBeenCalledWith(ERROR_404_ROUTE)
    })
  })
})
