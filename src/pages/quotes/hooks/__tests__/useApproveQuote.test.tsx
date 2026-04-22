import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import { useApproveQuote } from '../useApproveQuote'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

describe('useApproveQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return goToApproveQuote and approveQuote functions', () => {
        const { result } = renderHook(() => useApproveQuote(), { wrapper })

        expect(typeof result.current.goToApproveQuote).toBe('function')
        expect(typeof result.current.approveQuote).toBe('function')
      })
    })
  })

  describe('GIVEN goToApproveQuote is called', () => {
    describe('WHEN called with a quoteId', () => {
      it('THEN should navigate to the approve quote route', () => {
        const { result } = renderHook(() => useApproveQuote(), { wrapper })

        act(() => {
          result.current.goToApproveQuote('quote-123')
        })

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/approve')
      })
    })

    describe('WHEN called with a different quoteId', () => {
      it('THEN should navigate to the correct approve route for that quote', () => {
        const { result } = renderHook(() => useApproveQuote(), { wrapper })

        act(() => {
          result.current.goToApproveQuote('quote-456')
        })

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-456/approve')
      })
    })
  })

  describe('GIVEN approveQuote is called', () => {
    describe('WHEN invoked', () => {
      it('THEN should return true', () => {
        const { result } = renderHook(() => useApproveQuote(), { wrapper })

        const returnValue = result.current.approveQuote()

        expect(returnValue).toBe(true)
      })
    })
  })
})
