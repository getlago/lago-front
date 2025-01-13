import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { InvoicePaymentStatusTypeEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'

import { FilterContext } from '../context'
import { useFilters } from '../hook'
import { AvailableFiltersEnum } from '../types'
import {
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from '../utils'

const staticFilters = {
  currency: 'eur',
}

const wrapper = ({
  children,
  withStaticFilters,
}: {
  children: ReactNode
  withStaticFilters: boolean
}): JSX.Element => {
  return (
    <BrowserRouter basename="/">
      <div>
        <FilterContext.Provider
          value={{
            staticFilters: withStaticFilters ? staticFilters : undefined,
            availableFilters: [AvailableFiltersEnum.status, AvailableFiltersEnum.invoiceType],
          }}
        >
          {children}
        </FilterContext.Provider>
      </div>
    </BrowserRouter>
  )
}

describe('draft', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'status=draft'

    expect(
      result.current.buildQuickFilterUrlParams({
        status: InvoiceStatusTypeEnum.Draft,
      }),
    ).toEqual(expectedSearchParams)

    const draftSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isDraftUrlParams(draftSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&status=draft'

    const draftSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(
      result.current.buildQuickFilterUrlParams({
        status: InvoiceStatusTypeEnum.Draft,
      }),
    ).toEqual(expectedSearchParams)
    expect(isDraftUrlParams(draftSearchParams)).toBe(true)
  })
})

describe('outstanding', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'paymentStatus=failed,pending&status=finalized'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentStatus: [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending],
        status: InvoiceStatusTypeEnum.Finalized,
      }),
    ).toEqual(expectedSearchParams)

    const outstandingSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isOutstandingUrlParams(outstandingSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&paymentStatus=failed,pending&status=finalized'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentStatus: [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending],
        status: InvoiceStatusTypeEnum.Finalized,
      }),
    ).toEqual(expectedSearchParams)

    const outstandingSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isOutstandingUrlParams(outstandingSearchParams)).toBe(true)
  })
})

describe('payment overdue', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'paymentOverdue=true'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentOverdue: true,
      }),
    ).toEqual(expectedSearchParams)

    const paymentOverdueSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isPaymentOverdueUrlParams(paymentOverdueSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&paymentOverdue=true'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentOverdue: true,
      }),
    ).toEqual(expectedSearchParams)

    const paymentOverdueSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isPaymentOverdueUrlParams(paymentOverdueSearchParams)).toBe(true)
  })
})

describe('succeeded', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'paymentStatus=succeeded&status=finalized'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
        status: InvoiceStatusTypeEnum.Finalized,
      }),
    ).toEqual(expectedSearchParams)

    const succeededSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isSucceededUrlParams(succeededSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&paymentStatus=succeeded&status=finalized'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
        status: InvoiceStatusTypeEnum.Finalized,
      }),
    ).toEqual(expectedSearchParams)

    const succeededSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isSucceededUrlParams(succeededSearchParams)).toBe(true)
  })
})

describe('voided', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'status=voided'

    expect(
      result.current.buildQuickFilterUrlParams({
        status: InvoiceStatusTypeEnum.Voided,
      }),
    ).toEqual(expectedSearchParams)

    const voidedSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isVoidedUrlParams(voidedSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&status=voided'

    expect(
      result.current.buildQuickFilterUrlParams({
        status: InvoiceStatusTypeEnum.Voided,
      }),
    ).toEqual(expectedSearchParams)

    const voidedSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isVoidedUrlParams(voidedSearchParams)).toBe(true)
  })
})

describe('payment dispute lost', () => {
  it('should return search params without initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: false }),
    })

    const expectedSearchParams = 'paymentDisputeLost=true'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentDisputeLost: true,
      }),
    ).toEqual(expectedSearchParams)

    const paymentDisputeLostSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isPaymentDisputeLostUrlParams(paymentDisputeLostSearchParams)).toBe(true)
  })
  it('should return search params with initial static filters', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: ({ children }) => wrapper({ children, withStaticFilters: true }),
    })

    const expectedSearchParams = 'currency=eur&paymentDisputeLost=true'

    expect(
      result.current.buildQuickFilterUrlParams({
        paymentDisputeLost: true,
      }),
    ).toEqual(expectedSearchParams)

    const paymentDisputeLostSearchParams = new Map(
      new URLSearchParams(`?${expectedSearchParams}`).entries(),
    ) as unknown as URLSearchParams

    expect(isPaymentDisputeLostUrlParams(paymentDisputeLostSearchParams)).toBe(true)
  })
})
