import { renderHook } from '@testing-library/react'

import { testMockNavigateFn } from '~/test-utils'

import { useEditQuote } from '../useEditQuote'

describe('useEditQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN it returns', () => {
      it('THEN should return editQuote function', () => {
        const { result } = renderHook(() => useEditQuote())

        expect(result.current.editQuote).toBeDefined()
        expect(typeof result.current.editQuote).toBe('function')
      })
    })
  })

  describe('GIVEN editQuote is called', () => {
    describe('WHEN called with a quoteId', () => {
      it('THEN should navigate to the edit quote route', () => {
        const { result } = renderHook(() => useEditQuote())

        result.current.editQuote('quote-123')

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/edit')
      })
    })
  })
})
