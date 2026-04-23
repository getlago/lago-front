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
    it.each([
      ['quote-123', '/quote/quote-123/approve'],
      ['quote-456', '/quote/quote-456/approve'],
    ])('WHEN called with %s THEN should navigate to %s', (quoteId, expectedPath) => {
      const { result } = renderHook(() => useApproveQuote(), { wrapper })

      act(() => {
        result.current.goToApproveQuote(quoteId)
      })

      expect(testMockNavigateFn).toHaveBeenCalledWith(expectedPath)
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
