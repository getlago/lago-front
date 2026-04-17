import { renderHook } from '@testing-library/react'

import { testMockNavigateFn } from '~/test-utils'

import { useVoidQuote } from '../useVoidQuote'

describe('useVoidQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return voidQuote function', () => {
        const { result } = renderHook(() => useVoidQuote())

        expect(result.current.voidQuote).toBeDefined()
        expect(typeof result.current.voidQuote).toBe('function')
      })
    })
  })

  describe('GIVEN voidQuote is called', () => {
    describe('WHEN called with a quoteId', () => {
      it('THEN should navigate to the void quote route', () => {
        const { result } = renderHook(() => useVoidQuote())

        result.current.voidQuote('quote-456')

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-456/void')
      })
    })
  })
})
