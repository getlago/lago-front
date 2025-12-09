import { wait } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'

import { ERROR_404_ROUTE } from '~/core/router'
import { GetInvoiceCreateCreditNoteDocument } from '~/generated/graphql'
import {
  fourOFourInvoiceMock,
  fullOneOffInvoiceMockAndExpect,
  fullSubscriptionInvoiceGroupTrueUpMockAndExpect,
  fullSubscriptionInvoiceMockAndExpect,
  INVOICE_FIXTURE_ID,
} from '~/hooks/__tests__/fixtures'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import { useCreateCreditNote } from '../useCreateCreditNote'

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
    testMockNavigateFn.mockClear()
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

  it('send to 404 if no refundableAmountCents and creditableAmountCents', async () => {
    const { mock } = fourOFourInvoiceMock()

    await prepare({ mock })

    // Skip loading state
    await act(() => wait(0))

    act(() => {
      expect(testMockNavigateFn).toHaveBeenCalledWith(ERROR_404_ROUTE)
    })
  })

  it('should format feeForAddOn correctly', async () => {
    const { mock, transformedObject } = fullOneOffInvoiceMockAndExpect()

    const { result } = await prepare({ mock })

    // Skip loading state
    await act(() => wait(0))

    expect(result.current.feeForAddOn).toStrictEqual(transformedObject)
  })

  it('should format feesPerInvoice correctly', async () => {
    const { mock, transformedObject } = fullSubscriptionInvoiceGroupTrueUpMockAndExpect()

    const { result } = await prepare({ mock })

    // Skip loading state
    await act(() => wait(0))

    expect(result.current.feesPerInvoice).toStrictEqual(transformedObject)
  })
})
